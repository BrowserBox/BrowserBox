#!/bin/bash

# killing bundling for now until work out babel issue
# "Cannot find preset babel/env relative to directory public"
#./install_bundle_deps.sh

rm -rf node_modules && rm package-lock.json && npm upgrade
cd zombie-lord 
rm -rf node_modules && rm package-lock.json && npm upgrade
cd ../public/voodoo
rm -rf node_modules && rm package-lock.json && npm upgrade
# cd ../../endbacker
# rm -rf node_modules && rm package-lock.json && npm upgrade
cd ../../zombie-lord/custom-launcher
rm -rf node_modules && rm package-lock.json && npm upgrade

#./make_bundle.sh

