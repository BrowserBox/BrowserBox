#!/bin/bash

# killing bundling for now until work out babel issue
# "Cannot find preset babel/env relative to directory public"
#./install_bundle_deps.sh

npm rebuild
cd zombie-lord 
npm i && npm rebuild
cd ../public/voodoo
npm i && npm rebuild
cd ../../endbacker
npm i && npm rebuild

#./make_bundle.sh

