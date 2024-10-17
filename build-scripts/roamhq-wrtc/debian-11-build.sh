#!/usr/bin/env bash

sudo apt install ninja-build cmake build-essential python pkg-config clang++
git clone https://github.com/dosyago/node-webrtc.git
cd node-webrtc
npm i
npm run build

