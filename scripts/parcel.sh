#!/bin/bash

rm -rf .parcel-cache/dist/ 
mkdir dist/ 
cp -r src/public/* dist/ 
rm dist/image.html 
CONFIG_DIR=./config/ npx parcel build src/public/image.html --config=./config/parcelrc 
cp -r src/public/voodoo/node_modules dist/node_modules

