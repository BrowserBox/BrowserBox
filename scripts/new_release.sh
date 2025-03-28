#!/usr/bin/env bash

time="$(date)"

source ~/.nvm/nvm.sh
nvm use v12.10.0

exit

description=$1

gbranch nexe-build

echo $time > RELEASE_TIME.txt

npm run build
chmod +x BrowserBox.js

gpush minor "New release"

latest_tag=$(git describe --abbrev=0)

grel release -u c9fe -r BrowserBox --tag $latest_tag --name "New release" --description '"'"$description"'"'
grel upload -u c9fe -r BrowserBox --tag $latest_tag --name "BrowserBox.exe" --file BrowserBox.exe
grel upload -u c9fe -r BrowserBox --tag $latest_tag --name "BrowserBox.macos" --file BrowserBox.macos
grel upload -u c9fe -r BrowserBox --tag $latest_tag --name "BrowserBox.linux" --file BrowserBox.nix
grel upload -u c9fe -r BrowserBox --tag $latest_tag --name "BrowserBox.linx32" --file BrowserBox.nix32
grel upload -u c9fe -r BrowserBox --tag $latest_tag --name "BrowserBox.win32.exe" --file BrowserBox.win32.exe



