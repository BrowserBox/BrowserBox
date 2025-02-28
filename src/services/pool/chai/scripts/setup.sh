#!/usr/bin/env bash

if [ "$GITHUB_ACTIONS" == "true" ]; then
  echo "we are in github action, and the doc viewer will not be accessible, so we don't set it up. This is normal."
  exit 0
fi

sudo="$(command -v sudo)"

. ~/.nvm/nvm.sh

. ./scripts/config.sh

OS=$(uname)
if [ "$OS" = "Darwin" ]; then
  # Mac OS X
  ./scripts/mac_install_deps.sh
   cp policy.xml /opt/homebrew/etc/ImageMagick-*/
elif [ "$OS" = "FreeBSD" ]; then
  # FreeBSD
  $sudo -E ./scripts/install_deps.sh
  $sudo mkdir -p /etc/ImageMagick
  $sudo cp policy.xml /etc/ImageMagick/
  $sudo cp policy.xml /etc/ImageMagick-*/
else
  $sudo -E ./scripts/nix_install_deps.sh
  $sudo mkdir -p /etc/ImageMagick
  $sudo cp policy.xml /etc/ImageMagick/
  $sudo cp policy.xml /etc/ImageMagick-*/
  $sudo $APT update
  $sudo $APT install libcap2-bin
  $sudo setcap 'cap_net_bind_service=+ep' "$(command -v node)"
fi


mkdir -p "${pdfs}"
if [ ! -f "${pdfs}/hashes.json" ]; then
  echo "[]" > "${pdfs}/hashes.json"
fi
if [ ! -f "${pdfs}/links.json" ]; then
  echo "[]" > "${pdfs}/links.json"
fi

npm i

if ! command -v pm2 &>/dev/null; then
  . /etc/os-release

  if [[ $ID == *"bsd" ]]; then
    sudo -n npm i -g pm2@latest || echo "Could not install pm2" >&2
  else
    npm i -g pm2@latest
  fi
fi

