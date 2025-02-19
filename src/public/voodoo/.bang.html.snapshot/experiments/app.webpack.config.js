const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: "./app.js",
  mode: process.env.BANG_PROD ? "production" : "development",
  output: {
    path: path.resolve('.', 'docs', '7guis', '.build-temp', 'src'),
    /*publicPath: 'auto',*/
    filename: "app.js"
  },
  module: {
		rules: [
			{
				test: /\.html$/,
				exclude: /node_modules/,
				use: {
					loader: 'html-loader'
				}
			},
			{
				test: /\.css$/,
				exclude: /node_modules/,
				use: {
					loader: 'css-loader'
				}
			},
		]
	},
  plugins: [
    new HtmlWebpackPlugin()
  ],
  optimization: {
    minimize: process.env.BANG_PROD ? true : false,
	},
  target: "browserslist:last 2 versions",
};
