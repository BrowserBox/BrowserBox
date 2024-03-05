#!/bin/bash

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
cd src/zombie-lord 
rm -rf node_modules
rm -rf package-lock*
cd ../public/voodoo
rm -rf node_modules
rm -rf package-lock*
cd ../../public
rm -f *bundle*.js
rm -rf node_modules
rm -rf package-lock*
cd ../zombie-lord/custom-launcher
rm -rf node_modules
rm -rf package-lock*
cd ../../../
cd audio/
rm -rf node_modules
rm -rf package-lock*
cd ../
cd chai/
rm -rf node_modules
rm -rf package-lock*
cd ../
cd devtools/
rm -rf node_modules
rm -rf package-lock*




