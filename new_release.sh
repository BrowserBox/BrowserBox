#!/bin/bash

time="$(date)"

source ~/.nvm/nvm.sh
nvm use v12.10.0

description=$1

gbranch nexe-build

echo $time > RELEASE_TIME.txt

npm run build
chmod +x BrowserGap.js

gpush minor "New release"

latest_tag=$(git describe --abbrev=0)
grel release -u dosyago -r BrowserGap --tag $latest_tag --name "New release" --description '"'"$description"'"'
grel upload -u dosyago -r BrowserGap --tag $latest_tag --name "BrowserGap.exe" --file BrowserGap.exe
grel upload -u dosyago -r BrowserGap --tag $latest_tag --name "BrowserGap.macos" --file BrowserGap.macos
grel upload -u dosyago -r BrowserGap --tag $latest_tag --name "BrowserGap.linux" --file BrowserGap.nix
grel upload -u dosyago -r BrowserGap --tag $latest_tag --name "BrowserGap.linx32" --file BrowserGap.nix32
grel upload -u dosyago -r BrowserGap --tag $latest_tag --name "BrowserGap.win32.exe" --file BrowserGap.win32.exe



