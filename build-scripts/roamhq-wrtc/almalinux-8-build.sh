#!/bin/bash

sudo dnf install cmake gcc gcc-c++ python3 pkgconf-pkg-config clang
sudo pip3 install ninja
git clone https://github.com/dosyago/node-webrtc
cd node-webrtc
npm i
npm run build



