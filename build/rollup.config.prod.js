process.env.NODE_ENV = 'production';

const {terser} = require('rollup-plugin-terser');

const postcss = require('rollup-plugin-postcss')
const configList = require('./rollup.config');

const resolveFile = function(filePath) {
  return path.join(__dirname, '..', filePath)
}

configList.map((config, index) => {

  config.output.sourcemap = false;
  config.plugins = [
    ...config.plugins,
    // ...[
    //   terser({  // 只压缩 *.min.js文件
    //     // include: [/^.+\.min\.js$/, '*esm*'], 
    //     include: [],
    //     exclude: [ 'some*' ]
    //   })
    // ]
  ]

  return config;
})

module.exports = configList;