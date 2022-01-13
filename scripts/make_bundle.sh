#!/bin/bash

npx rollup ./src/public/image-start-app.js -c ./config/rollup.config.js --format iife --file ./src/public/bundle_image_start.js --name App
#babel --config-file ./config/babel.config.json ./src/public/bundle_start_i.js > ./src/public/bundle_image_start.js || npx babel --config-file ./config/babel.config.json  ./src/public/bundle_start_i.js > ./src/public/bundle_image_start.js 

npx rollup ./src/public/meta.js -c ./config/rollup.config.js --format iife --file ./src/public/meta_bundle.js --name Meta
#babel --config-file ./config/babel.config.json ./src/public/meta_bundle_i.js > ./src/public/meta_bundle.js || npx babel --config-file ./config/babel.config.json  ./src/public/meta_bundle_i.js > ./src/public/meta_bundle.js

