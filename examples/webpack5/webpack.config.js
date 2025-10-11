const { resolve } = require('node:path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const Html = require('html-webpack-plugin')
const CompressImage = require('unplugin-compress-image/webpack')

/**
 * @type {import('webpack').Configuration}
 */
const config = {
  mode: 'production',
  entry: './main.ts',
  output: {
    path: resolve(__dirname, 'dist'),
    filename: '[name].[contenthash:8].js',
    publicPath: '', // 保持相对路径，图片等可以正常引用
    assetModuleFilename: 'images/[name].[hash:8][ext]', // 图片输出目录
  },

  resolve: {
    extensions: ['.ts', '.js'], // 让 webpack 能解析 .ts 文件
  },

  module: {

    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      // {
      //   test: /\.(png|jpe?g|gif|svg)$/,
      //   use: [
      //     {
      //       loader: 'file-loader',
      //       options: {
      //         name: 'images/[name].[hash:8].[ext]',
      //         esModule: false,
      //       },
      //     },
      //   ],
      // },

      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: 'asset/resource', // webpack5 图片处理方式
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              sources: false,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    CompressImage({
      tinypng: false,
    }),
    new Html({
      template: resolve(__dirname, 'index.html'),
      inject: 'body',
    }),
  ],
}

module.exports = config
