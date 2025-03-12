#!/usr/bin/env bash

cp -r node_modules/bang.html/* .bang.html.snapshot/

# Find and delete all LICENSE files in .bang.html.snapshot to avoid any excuse for confusion with BB license as we save this useful view library in BB repo for posterity (DOSAYGO owns the library)
find .bang.html.snapshot -type f -name "LICENSE" -delete

cp node_modules/simple-peer/simplepeer.min.js src/ 
cp node_modules/lucide-static/icons/*.svg assets/icons/
