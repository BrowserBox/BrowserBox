#!/bin/bash

# Create an ARM (aarch64) Ubuntu 23.10 VM on Azure and then run

sudo apt update && sudo apt -y upgrade
source ~/.nvm/nvm.sh
command -v nvm || curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
sudo apt install -y cmake build-essential python-is-python3 pkg-config clang gn ninja-build
nvm install v20
nvm use v20
git clone https://github.com/dosyago/node-webrtc.git
cd node-webrtc
npm i
npm run build
sudo cp $(which gn) $HOME/node-webrtc/build/external/libwebrtc/download/src/buildtools/linux64/gn
cd build/external/libwebrtc/download/src/
build/linux/sysroot_scripts/install-sysroot.py --arch=arm64
cd $HOME/node-webrtc
# running into issue with googletest
# so needed to 
# patch BUILD.gn
cp $HOME/BrowserBox/build-scripts/ubuntu-arm-patch/gtest-BUILD.gn ./build/external/libwebrtc/download/src/third_party/googletest/BUILD.gn
# also patch clang with correct exec 
cp $(which clang++) ./build/external/libwebrtc/download/src/third_party/llvm-build/Release+Asserts/bin/clang++
npm run build
