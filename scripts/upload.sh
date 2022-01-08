#!/bin/sh

description=$1
latest_tag=$(git describe --abbrev=0)
grel release -u cris691 -r ViewFinder --tag $latest_tag --name "New release" --description '"'"$description"'"'
grel upload -u cris691 -r ViewFinder --tag $latest_tag --name "ViewFinder.exe" --file ViewFinder.exe
grel upload -u cris691 -r ViewFinder --tag $latest_tag --name "ViewFinder.macos" --file ViewFinder.macos
grel upload -u cris691 -r ViewFinder --tag $latest_tag --name "ViewFinder.linux" --file ViewFinder.nix
grel upload -u cris691 -r ViewFinder --tag $latest_tag --name "ViewFinder.linx32" --file ViewFinder.nix32
grel upload -u cris691 -r ViewFinder --tag $latest_tag --name "ViewFinder.win32.exe" --file ViewFinder.win32.exe



