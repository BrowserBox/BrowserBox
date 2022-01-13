#!/bin/bash

./scripts/setup_machine.sh

echo Running npm install for backend, front-end, chrome-launcher and sound server...
cd ./src/zombie-lord 
npm i --no-optional &> /dev/null   
cd ../../
cd ./src/public/voodoo
npm i --no-optional &> /dev/null  
cd ../../../
cd ./src/zombie-lord/custom-launcher
npm i --no-optional &> /dev/null   
cd ../../../
cd ./src/parec-server
npm i --no-optional &> /dev/null   
cd ../../
