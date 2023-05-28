#!/bin/sh

description=$1
latest_tag=$(git describe --abbrev=0)
grel release -u cris691 -r BrowsreBox --tag $latest_tag --name "New release" --description '"'"$description"'"'
grel upload -u cris691 -r BrowsreBox --tag $latest_tag --name "BrowsreBox.exe" --file BrowsreBox.exe
grel upload -u cris691 -r BrowsreBox --tag $latest_tag --name "BrowsreBox.macos" --file BrowsreBox.macos
grel upload -u cris691 -r BrowsreBox --tag $latest_tag --name "BrowsreBox.linux" --file BrowsreBox.nix
grel upload -u cris691 -r BrowsreBox --tag $latest_tag --name "BrowsreBox.linx32" --file BrowsreBox.nix32
grel upload -u cris691 -r BrowsreBox --tag $latest_tag --name "BrowsreBox.win32.exe" --file BrowsreBox.win32.exe



