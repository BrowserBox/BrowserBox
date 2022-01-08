#!/bin/bash

echo 
echo
read -p "Want to run setup_machine script? (you only need to do this the first time you install BG, or when you update new version) y/n " -n 1 -r
echo
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
  echo "Not running full setup...Just doing npm install..."
else 
  echo "Running full setup..."
  ./scripts/setup_machine.sh
fi


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

echo Install rollup global
npm i --no-optional -g rollup
./scripts/make_bundle.sh 


