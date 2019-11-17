#!/bin/bash

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
