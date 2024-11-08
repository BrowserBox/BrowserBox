#!/usr/bin/env bash

set -x

. /etc/os-release
if [[ $ID != *"bsd" ]]; then
  source $HOME/.nvm/nvm.sh
  if ! nvm use v22; then
    nvm install v22 && nvm use v22
    npm remove -g parcel
    npm i -g parcel@latest
  fi
else
  if ! command -v node &>/dev/null || ! command -v npm &>/dev/null; then
    ./deploy-scripts/install_node.sh 20
  fi
fi
if [[ $ID == *"bsd" ]]; then
  npm i parcel@2.0.0-alpha.1
else
  npm i parcel@latest
fi

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

