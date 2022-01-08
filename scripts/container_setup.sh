#!/bin/bash

sudo apt install -y apt-utils wget curl
cd ./src/zombie-lord
sudo ./audio.deps
sudo ./deb.deps
sudo ./font.deps
sudo ./dlchrome.sh
cd ../../
echo "Installing pulse audio scripts..."
sudo cp -r ./src/parec-server/pulse/* /etc/pulse/
sudo groupadd browsers

