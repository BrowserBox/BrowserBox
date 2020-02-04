#!/bin/bash

rollup public/image-start-app.js -c rollup.config.js --format iife --file public/bundle_start_i.js --name App
babel public/bundle_start_i.js --presets=@babel/env > public/bundle_image_start.js

rollup public/meta.js -c rollup.config.js --format iife --file public/meta_bundle_i.js --name Meta
babel public/meta_bundle_i.js --presets=@babel/env > public/meta_bundle.js

