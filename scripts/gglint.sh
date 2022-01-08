#!/bin/sh

cd ./src/public
npx eslint . --ext .js
cd ../../
cd ./src/zombie-lord/injections
npx eslint . --ext .js
cd ../../../
cd ./src/plugins/projector
npx eslint --env browser injections.js
cd ../../../
npx eslint --config ./config/.eslintrc.cjs . --ext .js

