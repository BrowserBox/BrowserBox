#!/bin/bash

source $HOME/.nvm/nvm.sh
if ! nvm use v20; then
  nvm install v20 && nvm use v20
  npm remove -g parcel
  npm i -g parcel@latest
fi
command -v parcel || npm i -g parcel@latest

rm -rf .parcel-cache/*

if [ "$IS_DOCKER_BUILD" = "true" ]; then
  echo "In docker, not running parcel (it hangs sometimes!)"
  cp -r src/public/* dist/ 
else
  echo "Cleaning dist directories..."
  rm -rf dist/
  mkdir dist/ 
  cp -r src/public/* dist/ 
  rm dist/image.html
  echo "Waiting for OS to catch up. We are too fast..."
  sleep 1
  echo "Running parcel clientless remote browser isolation build step..."
  CONFIG_DIR=./config/ npx parcel build src/public/image.html --no-source-maps --config=./config/parcelrc 
fi
echo "Ensuring client has access to framework..."
cp -r src/public/voodoo/node_modules dist/node_modules
echo "Client build done!"

