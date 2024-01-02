#!/bin/bash

echo "Cleaning dist directories..."
rm -rf .parcel-cache/*
rm -rf dist/
mkdir dist/ 
cp -r src/public/* dist/ 
rm dist/image.html
echo "Waiting for OS to catch up. We are too fast..."
sleep 1
echo "Running parcel clientless remote browser isolation build step..."
CONFIG_DIR=./config/ npx parcel build src/public/image.html --no-optimize --config=./config/parcelrc 
echo "Ensuring client has access to framework..."
cp -r src/public/voodoo/node_modules dist/node_modules
echo "Client build done!"

