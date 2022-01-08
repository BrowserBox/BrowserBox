#!/bin/sh

description=$1
latest_tag=$(git describe --abbrev=0)
grel release -u i5ik -r Viewfinder --tag $latest_tag --name "Release new binary build" --description '"'"$description"'"'
grel upload -u i5ik -r Viewfinder --tag $latest_tag --name "Viewfinder.exe" --file ./build/viewfinder-regular-win.exe
grel upload -u i5ik -r Viewfinder --tag $latest_tag --name "Viewfinder.macos" --file ./build/viewfinder-regular-macos
grel upload -u i5ik -r Viewfinder --tag $latest_tag --name "Viewfinder.linux" --file ./build/viewfinder-regular-linux
#grel upload -u i5ik -r Viewfinder --tag $latest_tag --name "Viewfinder.linx32" --file Viewfinder.nix32
#grel upload -u i5ik -r Viewfinder --tag $latest_tag --name "Viewfinder.win32.exe" --file Viewfinder.win32.exe



