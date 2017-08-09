// webpack.config.js
var path = require('path');
const VertxPlugin = require('webpack-vertx-plugin');

module.exports = {

  entry: path.resolve(__dirname, 'src/client/index.js'),

  devtool: 'source-map',

  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'src/main/resources/webroot')
  },

  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }
    ]
  },

  plugins: [ new VertxPlugin() ]
};
