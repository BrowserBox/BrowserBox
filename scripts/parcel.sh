#!/bin/bash

rm -rf .parcel-cache/*
rm -rf dist/
mkdir dist/ 
cp -r src/public/* dist/ 
rm dist/image.html
sleep 1
CONFIG_DIR=./config/ npx parcel build src/public/image.html --no-optimize --config=./config/parcelrc 
cp -r src/public/voodoo/node_modules dist/node_modules

