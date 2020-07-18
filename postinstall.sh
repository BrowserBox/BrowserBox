#!/bin/bash

# killing bundling for now until work out babel issue
# "Cannot find preset babel/env relative to directory public"
#./install_bundle_deps.sh

npm rebuild --quiet
cd zombie-lord 
npm i --quiet && npm rebuild --quiet
cd ../public/voodoo
npm i --quiet && npm rebuild --quiet
# cd ../../endbacker
# npm i --quiet && npm rebuild --quiet
cd ../../zombie-lord/custom-launcher
npm i --quiet && npm rebuild --quiet
cd ../../


