#!/bin/sh

cd public
npx eslint . --ext .js
cd ../zombie-lord/injections
npx eslint . --ext .js
cd ../../
npx eslint . --ext .js

