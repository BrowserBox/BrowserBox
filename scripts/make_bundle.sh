#!/bin/bash

rollup ./src/public/image-start-app.js -c ./config/rollup.config.js --format iife --file ./src/public/bundle_start_i.js --name App
babel ./src/public/bundle_start_i.js --presets=@babel/env > ./src/public/bundle_image_start.js || npx babel ./src/public/bundle_start_i.js --presets=@babel/env > ./src/public/bundle_image_start.js 

rollup ./src/public/meta.js -c ./config/rollup.config.js --format iife --file ./src/public/meta_bundle_i.js --name Meta
babel ./src/public/meta_bundle_i.js --presets=@babel/env > ./src/public/meta_bundle.js || npx babel ./src/public/meta_bundle_i.js --presets=@babel/env > ./src/public/meta_bundle.js

