#!/usr/bin/env bash

time="$(date)"

source ~/.nvm/nvm.sh
nvm use v12.10.0

description=$1

gbranch npm-build-2

./make_bundle.sh

echo $time > RELEASE_TIME.txt

npx webpack server.js
chmod +x BrowserBox.js

gpush minor "New npm release"




