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
            progress: false, // show progress bar
            clearFolder: false // clear remote path files for the first time,
        }

        */

        this.options = options;
        options.port = options.port || '22';
        options.firstEmit = options.firstEmit === undefined ? true : options.firstEmit;

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
        const {localPath, remotePath, log, progress, clearFolder, ...others} = this.options;
        const folders = [];
        const files = [];
        const uploadedFiles = [];

        const sftp = new Client();
        await sftp.connect({...others});

        if (this.options.firstEmit) {
            try {
                await sftp.exists(remotePath);
                if (clearFolder) {
                    log && console.log(chalk.red('Clearing remote folder...'));
                    await sftp.rmdir(remotePath, true);
                    await sftp.mkdir(remotePath, true);
                }
            } catch (e) {
                await sftp.mkdir(remotePath, true);
            }

            getFolderNFiles(folders, files, localPath, remotePath);

            this.options.firstEmit = false;
        } else {
            const assets = compilation.assets;
            for (const file in assets) {
                if (assets[file].emitted) {
                    files.push({
                        local: assets[file].existsAt,
                        remote: formatRemotePath(remotePath, file),
                        size: assets[file].size(),
                    })
                }
            }
        }


        if (folders.length > 0) {
            log && console.log(chalk.green('Creating remote folders...'));
            await Promise.all(folders.map(folder => sftp.mkdir(folder).catch(() => log && console.log(chalk.yellow('Folder create failed,it might exists')))));
        }


        const pb = new ProgressBar('', 50);

        if (files.length > 0) {
            await Promise.all(files.map(file =>
                sftp.fastPut(file.local, file.remote)
                    .catch(log && console.log)
                    .then(result => {
                        if (result) {
                            uploadedFiles.push(file);
                            progress && pb.render({
                                percent: (uploadedFiles.length / files.length).toFixed(4),
                                completed: uploadedFiles.length,
                                total: files.length,
                            })
                        }
                    })));

            log && console.log('\n' + chalk.green('Upload done! Files size: ' + (uploadedFiles.reduce((pre, next) => ({size: pre.size + next.size}), {size: 0}).size / 1000).toFixed(2) + ' KB'));
        }

        await sftp.end();

        if (callback) {
            callback();
        }
    }

}


function getFolderNFiles(folders, files, local, remote, file) {
    if (file) {
        const localPath = path.join(local, file);
        const stats = fs.statSync(localPath);
        if (stats.isDirectory()) {
            const folder = remote + '/' + file;
            const list = fs.readdirSync(local + '/' + file);

            folders.push(folder);
            for (const f of list) {
                getFolderNFiles(folders, files, localPath, folder, f);
            }
        } else {
            files.push({
                local: localPath,
                remote: remote + '/' + file,
                size: stats.size,
            });
        }
    } else {
        const fileList = fs.readdirSync(local);
        for (const file of fileList) {
            getFolderNFiles(folders, files, local, remote, file);
        }
    }

}

function formatRemotePath(remotePath, filePath) {
    return (remotePath + '/' + filePath).replace(/\\/g, '/');
}

module.exports = FasterWebpackUploadPlugin;
