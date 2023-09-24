#!/bin/bash

#npm cache clean --force
rm -rf .parcel-cache/dist/ 
rm BrowserBox.js
rm BrowserBox.*
rm *.node
rm -rf build/
rm -rf dist/
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


