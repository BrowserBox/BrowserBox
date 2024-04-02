const esbuild = require('esbuild');
const {htmlPlugin} = require('@craftamap/esbuild-plugin-html');

esbuild.build({
  entryPoints: ['src/public/image.html'], // Your JavaScript entry point
  bundle: true,
  outdir: 'dist',
  plugins: [
    htmlPlugin({
      files: [
        'src/index.html' // Your HTML file(s)
      ]
    })
  ],
}).catch(() => process.exit(1));

