#!/bin/bash

sudo apt install -y apt-utils wget curl apt-utils xvfb 
# sudo ./scripts/dpkg_dlchrome.sh
npm i puppeteer
cd ./src/zombie-lord
sudo ./audio.deps
sudo ./deb.deps
sudo ./font.deps
cd ../../
echo "Installing pulse audio scripts..."
sudo cp -r ./src/parec-server/pulse/* /etc/pulse/
sudo groupadd browsers
