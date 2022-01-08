#!/bin/sh

cd public
npx eslint . --ext .js
cd ../zombie-lord/injections
npx eslint . --ext .js
cd ../../plugins/projector
npx eslint --env browser injections.js
cd ../../
npx eslint . --ext .js

