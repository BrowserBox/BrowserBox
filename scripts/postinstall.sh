#!/bin/bash

echo Running npm install for backend, front-end, chrome-launcher and sound server...
cd ./src/zombie-lord 
npm i
cd ../../
cd ./src/public/voodoo
npm i 
cd ../../../
cd ./src/zombie-lord/custom-launcher
npm i 
cd ../../../
cd ./src/parec-server
npm i 
cd ../../
npm run bundle
