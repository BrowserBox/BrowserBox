#!/bin/bash

sudo apt install -y apt-utils wget curl
cd zombie-lord
sudo ./scripts/audio.deps
sudo ./scripts/deb.deps
sudo ./scripts/font.deps
sudo ./scripts/dlchrome.sh
cd ..
sudo npm i -g node-dev
sudo apt install -y libvips libjpeg-dev
./scripts/install_bundle_deps.sh
./scripts/global_install_bundle_deps.sh
echo "Installing pulse audio scripts..."
sudo cp -r ./src/parec-server/pulse/* /etc/pulse/
sudo groupadd browsers
echo "(if you're not on a linux system don't worry about this step)"
echo "You need to edit sudoers file with visudo to add"
echo "ALL ALL=(:browsers) NOPASSWD:ALL"
read -p "Press enter to continue to visudo "
sudo visudo

