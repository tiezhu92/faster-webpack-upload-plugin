# faster-webpack-upload-plugin
> Upload your files to ftp server easier and faster,add support to 'webpack --watch'

![](https://img.shields.io/npm/v/faster-webpack-upload-plugin.svg)
[![LICENSE](https://img.shields.io/badge/license-NPL%20(The%20996%20Prohibited%20License)-blue.svg)](https://github.com/996icu/996.ICU/blob/master/LICENSE)
[![996.icu](https://img.shields.io/badge/link-996.icu-red.svg)](https://996.icu)

[![NPM](https://nodei.co/npm/faster-webpack-upload-plugin.png)](https://nodei.co/npm/faster-webpack-upload-plugin/)

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
~~localPath~~|~~Folder path which need upload~~|~~String~~|Deprecated,don't need it anymore
remotePath|Folder path on server|String|(none)
log|Show log when is uploading|Boolean \| {info: Boolean, progress: Boolean, warning: Boolean, error: Boolean}|false
clearFolder|Clear remote path files for the first time|Boolean|false
fileIgnores|Files didn't upload(matching file name with file path)|Array\<RegExp\>|(none)

for other options you can see  https://github.com/mscdex/ssh2#client-methods

## Change Log

### 1.2.1
```
- change: change license from MIT to 996.ICU License
```

### 1.2.0
```
- change: remove the code of scanning local directory, so remove the option "localPath"
- fix: when webpack watching mode add new folder, the plugin can auto retry and make it right
```
## License
This project is licensed under [996.ICU](https://github.com/996icu/996.ICU/blob/master/LICENSE).
