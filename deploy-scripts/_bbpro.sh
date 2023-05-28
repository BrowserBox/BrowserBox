#!/usr/bin/env bash

get_install_dir() {
  echo "Finding bbpro installation..." >&2
  install_path1=$(find /usr/local/share -name .bbpro_install_dir -print -quit 2>/dev/null)
  install_path2=$(find $HOME -name .bbpro_install_dir -print -quit 2>/dev/null)
  install_dir=$(dirname $install_path1)
  if [ -z "$install_dir" ]; then
    install_dir=$(dirname $install_path2)
  fi
  if [ -z "$install_dir" ]; then
    echo "Could not find bppro. Purchase a license and run deploy-scripts/global_install.sh first">&2
    exit 1
  fi
  echo "Found bbpro at: $install_dir">&2

  echo $install_dir
}

INSTALL_DIR=$(get_install_dir)

echo Running bbpro for user $USER... >&2

#source $HOME/.nvm/nvm.sh

#nvm install stable

echo "Install dir: " $INSTALL_DIR >&2

cd $INSTALL_DIR

./scripts/run-test.sh

