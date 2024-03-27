const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: "./src/cat.bang.js",
  mode: process.env.BANG_PROD ? "production" : "development",
  output: {
    path: path.resolve('.', '.build-temp'),
    /*publicPath: 'auto',*/
    filename: "bang.js"
  },
  /*
  module: {
		rules: [
			{
				test: /\.js$/,
        use: { 
          loader: 'babel-loader',
          options: {
            parserOpts: {
              strictMode: false,
            },
            presets: [
              ['@babel/preset-env', {}]
            ],
            plugins: [
              ["@babel/plugin-proposal-private-methods", {}],
            ]
          }
        }
			}
		]
	},
  */
  optimization: {
    minimize: process.env.BANG_PROD ? true : false,
    /*
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_fnames: false,
        },
      }),
    ],
    */
	},
  target: "browserslist:last 2 versions",
};
