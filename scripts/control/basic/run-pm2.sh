#!/usr/bin/env bash

username=$(whoami)
echo "Starting viewfinder service cluster as $username"

get_install_dir() {
  echo "Finding bbpro installation..." >&2
  install_path1=$(find $HOME -name .bbpro_install_dir -print -quit 2>/dev/null)
  install_path2=$(find /usr/local/share -name .bbpro_install_dir -print -quit 2>/dev/null)
  install_dir=$(dirname $install_path1)
  if [ -z "$install_dir" ]; then 
    install_dir=$(dirname $install_path2)
  fi
  if [ -z "$install_dir" ]; then
    echo "Could not find bppro. Purchase a license and run deploy-scripts/global_install.sh first" >&2
    exit 1
  fi
  echo "Found bbpro at: $install_dir" >&2

  echo $install_dir
}

INSTALL_DIR=$(get_install_dir)

node=$(which node)
echo Using $node

echo "Starting audio service..."
pm2 start ./scripts/global/start_audio.sh -- $1

echo "Starting main bbpro service..."
echo "Install dir: $INSTALL_DIR"
cd "$INSTALL_DIR"
pm2 start ./scripts/basic-bb-main-service.sh -- $1

echo "Starting secure remote devtools service..."
cd src/services/pool/crdp-secure-proxy-server
pm2 start ./devtools-server.sh -- $1

echo "Starting secure document viewer service..."
cd "$INSTALL_DIR"
cd src/services/pool/chai
./scripts/restart.sh $1



