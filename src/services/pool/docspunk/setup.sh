#!/bin/sh

sudo mkdir -p /etc/ImageMagick
sudo cp policy.xml /etc/ImageMagick
sudo cp policy.xml /etc/ImageMagick-6
sudo ./install_deps.sh
sudo ./nix_install_deps.sh
sudo setcap 'cap_net_bind_service=+ep' $(which node)
mkdir -p pdfs/
echo "[]" > pdfs/hashes.json
cwd=$(pwd)
cd $HOME
npm i -g pm2
sudo npm i -g pm2
cd $crd
