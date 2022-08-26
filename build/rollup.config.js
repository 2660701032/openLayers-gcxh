/*
 * @Author: xjm
 * @Date: 2020-06-18 14:14:17
 * @LastEditors  : xjm
 * @LastEditTime : 2020-09-22 10:06:44
 * @Description: 
 */ 
const path = require('path');
const postcss = require('rollup-plugin-postcss')
const babel = require('rollup-plugin-babel');
const nodeResolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const nodeGlobals = require('rollup-plugin-node-globals')

const resolveFile = function(filePath) {
  return path.join(__dirname, '..', filePath)
}

const isProductionEnv = process.env.NODE_ENV === 'production'

module.exports = [
  {
    input: resolveFile('lib/index.js'),  // 入口文件
    output: [{
      file: resolveFile('dist/index.js'), // 输出 JS 文件
      format: 'umd',
      name: 'JiLin_MapPlugins'
    },{
      file: resolveFile('dist/index.min.js'), // 输出 JS 压缩文件
      format: 'umd',
      name: 'JiLin_MapPlugins'
    },{
      file: resolveFile('dist/index.es.js'), // 输出 JS es 文件
      format: 'es'
    }],
    plugins: [                          // 插件
      nodeResolve(),
      commonjs(),
      nodeGlobals(),
      postcss({
        extract: isProductionEnv ? resolveFile('dist/index.css') : false,
        // 开发模式下，不分离css,否则样式不会自动注入到html中
        minimize: isProductionEnv,
      }),
      babel() // 编译 es6+, 配合 .babelrc 文件
    ],
  },
]