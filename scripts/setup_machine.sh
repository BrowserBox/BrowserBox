#!/bin/bash

echo "Install requires sudo."
sudo apt install -y apt-utils wget curl
cd ./src/zombie-lord
sudo ./audio.deps
sudo ./deb.deps
sudo ./font.deps
sudo ./dlchrome.sh
cd ../../
./scripts/install_bundle_deps.sh
./scripts/global_install_bundle_deps.sh
echo "Installing pulse audio scripts..."
sudo cp -r ./src/parec-server/pulse/* /etc/pulse/
echo "Adding browsers group..."
sudo groupadd browsers
echo "(if you're not on a linux system don't worry about this step)"
echo "You need to edit sudoers file with visudo to add"
echo "ALL ALL=(:browsers) NOPASSWD:ALL"
read -p "Press enter to continue to visudo "
sudo visudo
echo "Done"
