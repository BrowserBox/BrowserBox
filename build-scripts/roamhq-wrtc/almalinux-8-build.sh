#!/usr/bin/env bash

sudo dnf install cmake gcc gcc-c++ python39 pkgconf-pkg-config clang
pip3 install --user ninja
sudo ln -s $(which python3.9) /bin/python
git clone https://github.com/dosyago/node-webrtc
cd node-webrtc
npm i
npm run build



