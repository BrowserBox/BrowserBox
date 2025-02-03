#!/usr/bin/env bash

#npm cache clean --force
rm -rf .parcel-cache/dist/ 
rm BrowserBox.js
rm BrowserBox.*
rm *.node
rm -rf build/
if [ "$IS_DOCKER_BUILD" = "true" ]; then
  echo "Not removing dist folder as we don't rebuild in docker."
else
  rm -rf dist/
fi
rm -rf typetests
rm -rf node_modules 
rm -rf package-lock*
cd src/services/pool/socket-puppet-service/ ; pwd
rm -rf node_modules
rm -rf package-lock*
cd ../../../../ ; pwd
cd deploy ; pwd
rm -rf node_modules
rm -rf package-lock*
cd ../ ; pwd
cd src/zombie-lord ; pwd
rm -rf node_modules
rm -rf package-lock*
cd ../public/voodoo ; pwd
rm -rf node_modules
rm -rf package-lock*
cd ../../public ; pwd
rm -f *bundle*.js
rm -rf node_modules
rm -rf package-lock*
cd ../zombie-lord/custom-launcher ; pwd
rm -rf node_modules
rm -rf package-lock*
cd ../../../ ; pwd
cd audio/ ; pwd
rm -rf node_modules
rm -rf package-lock*
cd ../ ; pwd
cd chai/ ; pwd
rm -rf node_modules
rm -rf package-lock*
cd ../ ; pwd
cd devtools/ ; pwd
rm -rf node_modules
rm -rf package-lock*




