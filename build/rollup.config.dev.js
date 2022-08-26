/*
 * @Author: xjm
 * @Date: 2020-06-18 14:14:17
 * @LastEditors: xjm
 * @LastEditTime: 2020-06-18 15:12:56
 * @Description: 
 */ 
process.env.NODE_ENV = 'development';

const path = require('path');
const serve = require('rollup-plugin-serve');
// const { eslint } = require('rollup-plugin-eslint') // 引入eslint插件

const configList = require('./rollup.config');
const livereload = require('rollup-plugin-livereload');

const resolveFile = function(filePath) {
  return path.join(__dirname, '..', filePath)
}
const PORT = 3000;

configList.map((config, index) => {
  config.output.sourcemap = true;

  if(index === 0) {
    config.plugins = [
      ...config.plugins,
      ...[
        // eslint(), // 添加eslint插件
        livereload({ // 启动重载，并且监听dist目录
          watch: resolveFile('dist'),
          // port: 35729  // default。 同时启动两个项目时，要修改此端口
        }),
        serve({
          port: PORT,
          contentBase: [resolveFile('example'), resolveFile('dist')], 
          // contentBase: [resolveFile('')],
          open: true,
          verbose: true,                   // 打印输出 serve路径
        })
      ]
    ]
  }

  return config;
})

module.exports = configList;