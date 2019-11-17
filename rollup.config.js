import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';

export default {
  plugins: [
    commonjs(),
    resolve(),
    babel({
      "babelrc": false,
      "exclude": ['node_modules/@babel/runtime/**', 'public/voodoo/node_modules/@babel/runtime/**'],
      "runtimeHelpers": true,
      "plugins": [
        "@babel/plugin-transform-runtime"
      ],
      "presets": [
        [ 
          "@babel/preset-env",
          {
            targets: {
              browsers: [ "safari >= 9" ]
            }
          }
        ]
      ]
    }),
  ],
  context: {
    [require.resolve('whatwg-fetch')]: 'fetch'
  }
};
