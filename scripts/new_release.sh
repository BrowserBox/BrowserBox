#!/bin/bash

time="$(date)"

source ~/.nvm/nvm.sh
nvm use v12.10.0

exit

description=$1

gbranch nexe-build

echo $time > RELEASE_TIME.txt

npm run build
chmod +x BrowsreBox.js

gpush minor "New release"

latest_tag=$(git describe --abbrev=0)

grel release -u c9fe -r BrowsreBox --tag $latest_tag --name "New release" --description '"'"$description"'"'
grel upload -u c9fe -r BrowsreBox --tag $latest_tag --name "BrowsreBox.exe" --file BrowsreBox.exe
grel upload -u c9fe -r BrowsreBox --tag $latest_tag --name "BrowsreBox.macos" --file BrowsreBox.macos
grel upload -u c9fe -r BrowsreBox --tag $latest_tag --name "BrowsreBox.linux" --file BrowsreBox.nix
grel upload -u c9fe -r BrowsreBox --tag $latest_tag --name "BrowsreBox.linx32" --file BrowsreBox.nix32
grel upload -u c9fe -r BrowsreBox --tag $latest_tag --name "BrowsreBox.win32.exe" --file BrowsreBox.win32.exe



