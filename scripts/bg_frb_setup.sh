#!/bin/bash

#sudo apt install -y nodejs npm
sudo npm i -g npm node-dev serve 
sudo apt install -y ethtool lshw psmisc htop libvips libjpeg-dev
./installstats.sh
./install_bundle_deps.sh
./global_install_bundle_deps.sh
cd zombie-lord
sudo ./deb.deps
sudo ./font.deps
sudo ./dlchrome.sh
cd ..
npm i
cd zombie-lord
sudo ./dlchrome.sh
cd ..
sudo adduser submanager --shell=/usr/sbin/nologin
sudo usermod -L submanager
cd endbacker
./auth_as.rb.install.sh
cd ..
sudo groupadd browsers
echo "You need to edit sudoers file with visudo to add"
echo "ALL ALL=(:browsers) NOPASSWD:ALL"
read -p "Press enter to continue to visudo"
sudo visudo
sudo apt install cpulimit cgroup-tools
./cgroup-create.sh
./traffic-control.sh
./make_bundle.sh
