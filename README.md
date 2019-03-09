# faster-webpack-upload-plugin
> Upload your files to ftp server easier and faster,add support to 'webpack --watch'

![](https://img.shields.io/npm/v/faster-webpack-upload-plugin.svg)
![](https://img.shields.io/npm/l/faster-webpack-upload-plugin.svg)

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

        // config options, you can find options detail down here

    })
  ]
}

```
### Options Detail:

Option Name|Usage|Type|Default Value
---|:--:|:--:|:-:
host|Server's IP address|String|(none)
port|Number of ssh port| String | "22"
username|Username for authentication|String|(none)
localPath|Folder path which need upload|String|(none)
remotePath|Folder path on server|String|(none)
log|Show log when is uploading|Boolean|false
progress|Show the progressBar|Boolean|false
clearFolder|Clear remote path files for the first time|Boolean|false
fileIgnores|Files didn't upload(matching file name with file path)|Array\<RegExp\>|(none)

for other options you can see  https://github.com/mscdex/ssh2#client-methods

## License
This project is licensed under [MIT](http://www.opensource.org/licenses/mit-license.php).
