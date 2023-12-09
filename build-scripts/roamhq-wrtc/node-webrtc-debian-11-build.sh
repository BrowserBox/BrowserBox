#!/bin/bash

sudo apt install ninja-build cmake build-essential python pkg-config
git clone https://github.com/dosyago/node-webrtc.git
cd node-webrtc
npm i
npm run build

