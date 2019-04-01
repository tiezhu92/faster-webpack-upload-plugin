'use strict'

const Client = require('ssh2-sftp-client');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const ProgressBar = require('./utils/ProgressBar');

class FasterWebpackUploadPlugin {
  constructor(options = {}) {
    /*

    options = {
        host: 'host ip or address',
        port: 'default 22',
        username: 'username',
        password: 'password',
        remotePath: 'remote path',
        localPath: 'localPath',
        log: false, // log detail
        clearFolder: false // clear remote path files for the first time,
    }

    */

    this.options = options;
    options.port = options.port || '22';
    options.firstEmit = options.firstEmit === undefined ? true : options.firstEmit;
    options.log = options.log === true ? {info: true, warning: true, error: true, progress: true} : options.log;
    options.log === undefined && (options.log = false);

    this.upload = this.upload.bind(this);
  }

  apply(compiler) {
    // for different webpack version
    if (compiler.hooks) {
      compiler.hooks.afterEmit.tap('after-emit', this.upload);
    } else {
      compiler.plugin('after-emit', this.upload);
    }
  }

  async upload(compilation, callback) {

    const {remotePath, log, clearFolder, ...others} = this.options;

    const folders = [];
    const files = [];  // Array<{local: string, remote: string, size: string,  folder: string[]}>
    const uploadedFiles = [];

    const sftp = new Client();
    await sftp.connect({...others});

    if (this.options.firstEmit) {
      // first emit will check the remotePath folder exists and clear remote folder and files
      try {
        await sftp.exists(remotePath);
        if (clearFolder) {
          log && log.info && console.log(chalk.red('Clearing remote folder...'));
          await sftp.rmdir(remotePath, true); //clear
          await sftp.mkdir(remotePath, true);
        }
      } catch (e) {
        await sftp.mkdir(remotePath, true);
      }

      this.getFolderNFiles(folders, files, compilation.assets);
      this.options.firstEmit = false;

    } else {

      this.getFolderNFiles(null, files, compilation.assets);

    }

    if (folders.length > 0) {
      log && log.info && console.log(chalk.green('Creating remote folders...'));
      for (let folder of folders) {
        await sftp.mkdir(folder, true).catch(() => log && log.warning && console.log(chalk.yellow(`Folder "${folder}" create failed,it might exists`)))
      }
      //this way will make many warning
      // await Promise.all(folders.map(folder => sftp.mkdir(folder, true).catch(() => log && log.warning && console.log(chalk.yellow(`Folder "${folder}" create failed,it might exists`)))));
    }

    log && log.info && console.log(chalk.green('Uploading...'));
    const pb = log && log.progress && new ProgressBar('', 50);

    if (files.length > 0) {
      await Promise.all(files.map(file =>
        sftp.fastPut(file.local, file.remote)
          .catch((err) => {
            // upload err checker, if err end with "No such file", it will make dir and retry

            if (err.toString().includes("No such file")) {
              log && log.warning && console.log(chalk.yellow(`File: "${file.remote}"'s folder not exists,make a folder and retrying...`));
              return async function retry() {
                await sftp.mkdir(file.folder, true).catch(() => null);

                return await sftp.fastPut(file.local, file.remote).catch(log && log.error && console);
              }();
            }
          })
          .then(result => {
            if (result) {
              uploadedFiles.push(file);
              log && log.progress && pb.render({
                percent: (uploadedFiles.length / files.length).toFixed(4),
                completed: uploadedFiles.length,
                total: files.length,
              })
            }
          })));

      log && log.info && console.log('\n' + chalk.green('Upload done! Files size: ' + (uploadedFiles.reduce((pre, next) => ({size: pre.size + next.size}), {size: 0}).size / 1000).toFixed(2) + ' KB'));
    }

    await sftp.end();

    // webpack finished callback
    if (callback) {
      callback();
    }
  }

  getFolderNFiles(folders, files, assets) {
    const folderSet = folders && new Set();
    for (const file in assets) {
      if (assets[file].emitted && (!this.options.fileIgnores || !this.options.fileIgnores.some((regexp) => regexp.test(assets[file].existsAt)))) {
        const remote = formatRemotePath(this.options.remotePath, file);
        let folder = remote.substr(0, remote.lastIndexOf("/"));
        const split = folder.replace(this.options.remotePath, "").split("/");
        folders && folderSet.add(folder);

        files.push({
          local: assets[file].existsAt,
          remote,
          folder,
          size: assets[file].size(),
        });
      }
    }

    if (folders) {
      const copy = Array.from(folderSet);

      folderSet.forEach((f) => !copy.some(s => (s !== f) && s.includes(f)) && folders.push(f));
    }

  }
}

function formatRemotePath(remotePath, filePath) {
  return (remotePath + '/' + filePath).replace(/\\/g, '/').replace(/\.\//g, "");
}

module.exports = FasterWebpackUploadPlugin;
