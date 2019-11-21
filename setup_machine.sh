#!/bin/bash

sudo apt install -y nodejs npm
sudo npm i -g npm
./install_bundle_deps.sh
./global_install_bundle_deps.sh
cd zombie-lord
sudo ./dlchrome.sh
sudo ./deb.deps
sudo ./font.deps
cd ..
npm i
