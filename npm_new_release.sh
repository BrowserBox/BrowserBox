#!/bin/bash

time="$(date)"

source ~/.nvm/nvm.sh
nvm use v12.10.0

description=$1

gbranch npm-build-2

echo $time > RELEASE_TIME.txt

npx webpack server.js
chmod +x BrowserGap.js

gpush patch "New npm release"




