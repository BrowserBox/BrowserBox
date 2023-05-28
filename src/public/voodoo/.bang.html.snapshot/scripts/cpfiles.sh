#!/usr/bin/env bash

cp -r src/* docs/
cp -r src/* docs/7guis/
cp -r src/* docs/ctr/
cp -r src/* docs/cellophane/
cp -r src/* docs/infinite/
cp dist/pack.bang.js docs/bang.js || :
cp dist/pack.bang.js docs/7guis/bang.js || :
cp dist/pack.bang.js docs/ctr/bang.js || :
cp dist/pack.bang.js docs/cellophane/bang.js || :
cp dist/pack.bang.js docs/infinite/bang.js || :


