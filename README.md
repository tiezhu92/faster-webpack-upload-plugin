# faster-webpack-upload-plugin
> Upload your files to ftp server easier and faster,add support to 'webpack --watch'

![](https://img.shields.io/npm/v/faster-webpack-upload-plugin.svg)
![](https://img.shields.io/apm/l/faster-webpack-upload-plugin.svg)

## Installation
```bash
npm i -D faster-webpack-upload-plugin
```

## Usage
add following code to your webpack config file.
```javascript
const FasterUploadPlugin = require('faster-webpack-upload-plugin');

var webpackConfig = {
  entry: 'index.js',
  output: {
    path: 'assets',
    filename: 'index_bundle.js'
  },
  plugins: [
    new FasterUploadPlugin({
      host: 'host',
      port: 'post', // default: 22
      username: 'username',
      password: 'password',
      localPath: 'local path', // eg. 'assets'
      remotePath: 'remote path', // eg. /home/website/assets
      log: ture or false, //default: false, is log details
      clearFolder: false //default: false, clear remote path files for the first time
    })
  ]
}

```
for other options you can see  https://github.com/mscdex/ssh2#client-methods

## License
This project is licensed under [MIT](http://www.opensource.org/licenses/mit-license.php).
