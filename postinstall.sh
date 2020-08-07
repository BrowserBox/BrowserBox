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
  ./setup_machine.sh
fi


npm rebuild &> /dev/null 
cd zombie-lord 
npm i &> /dev/null  && npm rebuild &> /dev/null 
cd ../public/voodoo
npm i &> /dev/null  && npm rebuild &> /dev/null 
# cd ../../endbacker
# npm i &> /dev/null  && npm rebuild &> /dev/null 
cd ../../zombie-lord/custom-launcher

npm i &> /dev/null  && npm rebuild &> /dev/null 
cd ../../

# ./make_bundle.sh &> /dev/null


