#!/usr/bin/env bash

vim $1.mjs
esbuild $1.mjs --bundle --platform=node --outfile=$1.cjs 
pkg -t node18-macos-x64 --out-path=dist/ $1.cjs
./dist/$1


