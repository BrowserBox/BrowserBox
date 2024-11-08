#!/usr/bin/env bash

#sudo $APT install -y nodejs npm
sudo npm i -g npm node-dev serve 
sudo $APT install -y ethtool lshw psmisc htop libvips libjpeg-dev
./installstats.sh
./install_bundle_deps.sh
./install_global_bundle_deps.sh
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
# not sure if we need it and it could be security risk 
# as seems to give every app user sudo ability with browsers ? 
#echo "You need to edit sudoers file with visudo to add"
#echo "%browsers ALL=(ALL:browsers) NOPASSWD: /usr/bin/pulseaudio"
#read -p "Press enter to continue to visudo"
#read | sudo visudo
sudo $APT install cpulimit cgroup-tools
./cgroup-create.sh
./traffic-control.sh
./make_bundle.sh
