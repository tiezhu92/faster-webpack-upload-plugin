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

        this.createdFolders = {};

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
        const {localPath, remotePath, log, clearFolder, ...others} = this.options;
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

            getFolderNFiles(files, localPath, remotePath);

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

        const pb = new ProgressBar('', 50);

        if (files.length > 0) {
            await Promise.all(files.map(async file => {

                const remoteFolder = path.dirname(file.remote);

                // Create remote folders once
                if (!this.createdFolders[remoteFolder]) {
                    this.createdFolders[remoteFolder] = true;

                    await sftp.mkdir(remoteFolder, true).catch(() => {}); // ignore failure - the call to `fastPut` below will error if it really failed
                }

                return sftp.fastPut(file.local, file.remote)
                    .catch(log && console.log)
                    .then(result => {
                        if (result) {
                            uploadedFiles.push(file);
                            pb.render({
                                percent: (uploadedFiles.length / files.length).toFixed(4),
                                completed: uploadedFiles.length,
                                total: files.length,
                            })
                        }
                    })
            }));

            log && console.log('\n' + chalk.green('Upload done! Files size: ' + (uploadedFiles.reduce((pre, next) => ({size: pre.size + next.size}), {size: 0}).size / 1000).toFixed(2) + ' KB'));
        }

        await sftp.end();

        if (callback) {
            callback();
        }
    }

}


function getFolderNFiles(files, local, remote, file) {
    if (file) {
        const localPath = path.join(local, file);
        const stats = fs.statSync(localPath);
        if (stats.isDirectory()) {
            const folder = remote + '/' + file;
            const list = fs.readdirSync(local + '/' + file);

            for (const f of list) {
                getFolderNFiles(files, localPath, folder, f);
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
            getFolderNFiles(files, local, remote, file);
        }
    }

}

function formatRemotePath(remotePath, filePath) {
    return (remotePath + '/' + filePath).replace(/\\/g, '/');
}

module.exports = FasterWebpackUploadPlugin;
