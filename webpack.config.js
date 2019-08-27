var path = require('path');
var webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  mode: "none",
  entry: {
    "build": "./js/plotsvy.js",
    "build.min": "./js/plotsvy.js",
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: "[name].js",
    library: 'plotsvy',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  module: {
    rules: [
      { test: /\.(html)$/, use: [{ loader: 'html-loader' }]},
      { test: /\.css$/, use: [ 'style-loader', 'css-loader' ] },
  
      { test: /\.(vs|fs)$/i,
        loaders: [
          'raw-loader'
        ]
      },
      {
        test: /node_modules/,
        loader: 'ify-loader'
      },
      { test: /\.(gif|png|woff|woff2|eot|ttf|svg)$/, loader: 'url-loader?limit=100000' }      
    ]
  },
  plugins: [
    new UglifyJsPlugin({
      include: /\.min\.js$/,
      uglifyOptions: {
        compress: true
      }
    }),
  ]
};
