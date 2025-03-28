#!/bin/sh

description=$1
latest_tag=$(git describe --abbrev=0)
grel release -u cris691 -r BrowserBox --tag $latest_tag --name "New release" --description '"'"$description"'"'
grel upload -u cris691 -r BrowserBox --tag $latest_tag --name "BrowserBox.exe" --file BrowserBox.exe
grel upload -u cris691 -r BrowserBox --tag $latest_tag --name "BrowserBox.macos" --file BrowserBox.macos
grel upload -u cris691 -r BrowserBox --tag $latest_tag --name "BrowserBox.linux" --file BrowserBox.nix
grel upload -u cris691 -r BrowserBox --tag $latest_tag --name "BrowserBox.linx32" --file BrowserBox.nix32
grel upload -u cris691 -r BrowserBox --tag $latest_tag --name "BrowserBox.win32.exe" --file BrowserBox.win32.exe



