#!/bin/bash

rm -rf typetests
rm -rf node_modules
cd zombie-lord 
rm -rf node_modules
cd ../public/voodoo
rm -rf node_modules
cd ../../public
rm -f *bundle*.js
cd ../zombie-lord/custom-launcher
rm -rf node_modules


