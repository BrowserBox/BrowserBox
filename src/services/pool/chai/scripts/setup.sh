#!/bin/sh

. ~/.nvm/nvm.sh

OS=$(uname)
if [ "$OS" = "Darwin" ]; then
  # Mac OS X
  ./scripts/mac_install_deps.sh
   cp policy.xml /opt/homebrew/etc/ImageMagick-*/
elif [ "$OS" = "FreeBSD" ]; then
  # FreeBSD
  sudo ./scripts/install_deps.sh
  sudo mkdir -p /etc/ImageMagick
  sudo cp policy.xml /etc/ImageMagick/
  sudo cp policy.xml /etc/ImageMagick-*/
else
  sudo ./scripts/nix_install_deps.sh
  sudo mkdir -p /etc/ImageMagick
  sudo cp policy.xml /etc/ImageMagick/
  sudo cp policy.xml /etc/ImageMagick-*/
  sudo apt-get update
  sudo apt-get install libcap2-bin
  sudo setcap 'cap_net_bind_service=+ep' $(command -v node)
fi


mkdir -p pdfs
if [ ! -f "pdfs/hashes.json" ]; then
  echo "[]" > pdfs/hashes.json
fi

npm i
which pm2 || npm i -g pm2

if [ ! -f ./secrets/key.js ]; then
  echo "You need to fill in ./secrets/key.js to set your app secret."
  exit 1
fi

