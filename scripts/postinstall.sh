#!/bin/bash

./scripts/setup_machine.sh

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

