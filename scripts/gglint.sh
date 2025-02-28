#!/bin/sh

cd src/public
npx eslint . --ext .js
cd ../zombie-lord/injections
npx eslint .
cd ../../
npx eslint . 

