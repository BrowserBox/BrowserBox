const path = require('path');
const webpack = require('webpack');
const common = require('./common.js');

module.exports = {
  entry: "./server.js",
  output: {
    path: path.resolve(common.APP_ROOT),
    filename: "BrowserBox.js"
  },
  target: "node",
  node: {
    APP_ROOT: false
  },
  plugins: [
    new webpack.BannerPlugin({ banner: "#!/usr/bin/env node", raw: true }),
  ],
  module: {
    rules: [
      {
        test: /\.node$/,
        loader: 'node-loader',
      },
    ],
  },
};
