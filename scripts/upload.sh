#!/bin/sh

description=$1
latest_tag=$(git describe --abbrev=0)
grel release -u crisdosyago -r BrowserBox --tag $latest_tag --name "Release new binary build" --description '"'"$description"'"'
grel upload -u crisdosyago -r BrowserBox --tag $latest_tag --name "BrowserBox.exe" --file ./build/viewfinder-regular-win.exe
grel upload -u crisdosyago -r BrowserBox --tag $latest_tag --name "BrowserBox.macos" --file ./build/viewfinder-regular-macos
grel upload -u crisdosyago -r BrowserBox --tag $latest_tag --name "BrowserBox.linux" --file ./build/viewfinder-regular-linux
#grel upload -u crisdosyago -r BrowserBox --tag $latest_tag --name "BrowserBox.linx32" --file BrowserBox.nix32
#grel upload -u crisdosyago -r BrowserBox --tag $latest_tag --name "BrowserBox.win32.exe" --file BrowserBox.win32.exe



