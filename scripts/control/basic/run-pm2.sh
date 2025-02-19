#!/usr/bin/env bash

#set -x

username=$(whoami)
echo "Starting viewfinder service cluster as $username"

get_install_dir() {
  # Find potential directories containing .bbpro_install_dir
  pwd="$(pwd)"
  install_path1=$(find $pwd -name .bbpro_install_dir -print 2>/dev/null)
  current_version=$(jq -r '.version' ./package.json)

  # Loop through each found path to check if node_modules also exists in the same directory
  IFS=$'\n'  # Change Internal Field Separator to newline for iteration
  for path in $install_path1; do
    dir=$(dirname $path)
    if [ -d "$dir/node_modules" ]; then
      # Get the version of the found directory's package.json
      found_version=$(jq -r '.version' "${dir}/package.json")

      # Check if the found version is the same or later than the current version
      if [[ $(echo -e "$current_version\n$found_version" | sort -V | tail -n1) == "$found_version" ]]; then
        echo "$dir"
        return 0
      fi
    fi
  done

  install_path2=$(find "${HOME}/BrowserBox" -name .bbpro_install_dir -print 2>/dev/null)
  IFS=$'\n'  # Change Internal Field Separator to newline for iteration
  for path in $install_path2; do
    dir=$(dirname $path)
    if [ -d "$dir/node_modules" ]; then
      # Get the version of the found directory's package.json
      found_version=$(jq -r '.version' "${dir}/package.json")

      # Check if the found version is the same or later than the current version
      if [[ $(echo -e "$current_version\n$found_version" | sort -V | tail -n1) == "$found_version" ]]; then
        echo "$dir"
        return 0
      fi
    fi
  done

  echo "No valid install directory found."
  return 1
}

INSTALL_DIR=$(get_install_dir)

node="$(command -v node)"
echo Using "$node"

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



