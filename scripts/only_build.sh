#!/usr/bin/env bash


mkdir -p dist/plugins
mkdir -p dist/zombie-lord
cp -r src/plugins/* dist/plugins/
cp -r src/zombie-lord/injections dist/zombie-lord/
./node_modules/.bin/esbuild src/server.js --bundle --loader:.node=copy --outfile=dist/BrowserBox.cjs --platform=node --minify 
./node_modules/.bin/esbuild src/server.js --bundle --loader:.node=copy --outfile=dist/BrowserBox.mjs --format=esm --banner:js="import { createRequire } from 'module';const require = createRequire(import.meta.url);" --platform=node --minify
./node_modules/.bin/esbuild src/server.js --bundle --loader:.node=copy --outfile=dist/test.cjs --platform=node --analyze
echo "#!/usr/bin/env node" > dist/bbpro.cjs
cat dist/BrowserBox.cjs >> dist/bbpro.cjs
chmod +x dist/bbpro.cjs


