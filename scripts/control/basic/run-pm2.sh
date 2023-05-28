#!/usr/bin/env bash

username=$(whoami)
echo "Starting viewfinder service cluster as $username"

get_install_dir() {
  echo "Finding bbpro installation..."
  install_path1=$(find /usr/local/share -name .bbpro_install_dir -print -quit 2>/dev/null)
  install_path2=$(find $HOME -name .bbpro_install_dir -print -quit 2>/dev/null)
  install_dir=$(dirname $install_path1)
  if [ -z "$install_dir" ]; then 
    install_dir=$(dirname $install_path2)
  fi
  if [ -z "$install_dir" ]; then
    echo "Could not find bppro. Purchase a license and run deploy-scripts/global_install.sh first"
    exit 1
  fi
  echo "Found bbpro at: $install_dir"

  echo $install_dir
}

INSTALL_DIR=$(get_install_dir)

node=$(which node)
echo Using $node

pm2 start ./scripts/global/start_audio.sh -- $1

echo "Starting main process, viewfinder, in foreground"
cd $INSTALL_DIR
pm2 start ./scripts/basic-bb-main-service.sh -- $1

echo "Starting crdp-secure-proxy-server"
cd src/services/pool/crdp-secure-proxy-server
pm2 start ./devtools-server.sh -- $1


