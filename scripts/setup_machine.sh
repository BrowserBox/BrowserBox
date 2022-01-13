#!/usr/bin/env bash

echo "Install requires sudo."
sudo apt install -y apt-utils 
cd ./src/zombie-lord
sudo ./audio.deps
sudo ./deb.deps
sudo ./font.deps
sudo ./dlchrome.sh
cd ../../
echo "Installing pulse audio scripts..."
sudo cp -r ./src/parec-server/pulse/* /etc/pulse/
echo "Adding browsers group..."
sudo groupadd browsers
echo "(if you're not on a linux system don't worry about this step)"
echo "You need to edit sudoers file with visudo to add"
echo "ALL ALL=(:browsers) NOPASSWD:ALL"
echo "Adding automatically"
sudo grep "ALL ALL=(:browsers) NOPASSWD:ALL" /etc/sudoers || sudo tee -a /etc/sudoers > /dev/null <<EOT
ALL ALL=(:browsers) NOPASSWD:ALL
EOT
echo "Done"
