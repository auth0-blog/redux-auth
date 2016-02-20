var path = require('path')
var webpack = require('webpack')

module.exports = {
  devtool: 'cheap-module-eval-source-map',
  entry: [
    'webpack-hot-middleware/client',
    './index'
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/static/'
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: [ 'babel' ],
      exclude: /node_modules/,
      include: __dirname
    }, {
      test: /node_modules\/auth0-lock\/.*\.js$/,
      loaders: [
        'transform/cacheable?brfs',
        'transform/cacheable?packageify'
      ]
    }, {
      test: /node_modules\/auth0-lock\/.*\.ejs$/,
      loader: 'transform/cacheable?ejsify'
    }, {
      test: /\.json?$/,
      exclude: /node_modules/,
      loader: 'json',
    }, {
      test: /\.css?$/,
      loaders: [ 'style', 'raw' ],
      include: __dirname
    }]
  }
}