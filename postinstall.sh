#!/bin/bash

# killing bundling for now until work out babel issue
# "Cannot find preset babel/env relative to directory public"
#./install_bundle_deps.sh

npm rebuild
sleep 1

cd zombie-lord 
npm i && npm rebuild
sleep 1

cd ../public/voodoo
npm i && npm rebuild
sleep 1

cd ../../zombie-lord/custom-launcher
npm i && npm rebuild
sleep 1

