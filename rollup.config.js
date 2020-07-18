import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

export default {
  plugins: [
		{
      transform ( code, id ) {
        console.log( id );
        console.log( code );
        // not returning anything, so doesn't affect bundle
      }
    },
    commonjs(),
    resolve(),
    babel({
      "babelrc": false,
      "exclude": ['node_modules/@babel/runtime/**', 'public/voodoo/node_modules/@babel/runtime/**'],
      "babelHelpers": "runtime",
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
