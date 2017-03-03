const path = require('path');
module.exports = {
  entry: './app.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname),
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      }
    ]
  },
  devServer: {
    contentBase: path.resolve(__dirname),
  },
};
