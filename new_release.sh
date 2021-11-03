#!/bin/bash

time="$(date)"

source ~/.nvm/nvm.sh
nvm install v12.10.0
nvm use v12.10.0

description=$1

gbranch nexe-build

echo $time > RELEASE_TIME.txt

npm run build
chmod +x ViewFinder.js

gpush minor "New release"

latest_tag=$(git describe --abbrev=0)

grel release -u c9fe -r ViewFinder --tag $latest_tag --name "New release" --description '"'"$description"'"'
grel upload -u c9fe -r ViewFinder --tag $latest_tag --name "ViewFinder.exe" --file ViewFinder.exe
grel upload -u c9fe -r ViewFinder --tag $latest_tag --name "ViewFinder.macos" --file ViewFinder.macos
grel upload -u c9fe -r ViewFinder --tag $latest_tag --name "ViewFinder.linux" --file ViewFinder.nix
grel upload -u c9fe -r ViewFinder --tag $latest_tag --name "ViewFinder.linx32" --file ViewFinder.nix32
grel upload -u c9fe -r ViewFinder --tag $latest_tag --name "ViewFinder.win32.exe" --file ViewFinder.win32.exe



