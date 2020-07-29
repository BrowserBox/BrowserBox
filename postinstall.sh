#!/bin/bash

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

./make_bundle.sh

