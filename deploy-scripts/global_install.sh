#!/usr/bin/env bash

#set -x

unset npm_config_prefix

# flush any partial
read -p "Enter to continue" -r
REPLY=""

read_input() {
  if [ -t 0 ]; then  # Check if it's running interactively
    read -p "$1" -r REPLY
  else
    read -r REPLY
    REPLY=${REPLY:0:1}  # Take the first character of the piped input
  fi
  echo  # Add a newline for readability
  echo
}

get_latest_dir() {
  # Find potential directories containing .bbpro_install_dir
  pwd="$(pwd)"
  install_path1=$(find $pwd -name .bbpro_install_dir -print 2>/dev/null)
  current_version=$(jq -r '.version' ./package.json)

  # Loop through each found path to check if node_modules also exists in the same directory
  IFS=$'\n'  # Change Internal Field Separator to newline for iteration
  for path in $install_path1; do
    dir=$(dirname $path)
      # Get the version of the found directory's package.json
      found_version=$(jq -r '.version' "${dir}/package.json")

      # Check if the found version is the same or later than the current version
      if [[ $(echo -e "$current_version\n$found_version" | sort -V | tail -n1) == "$found_version" ]]; then
        echo "$dir"
        return 0
      fi
  done

  install_path2=$(find $HOME -name .bbpro_install_dir -print 2>/dev/null)
  IFS=$'\n'  # Change Internal Field Separator to newline for iteration
  for path in $install_path2; do
    dir=$(dirname $path)
      # Get the version of the found directory's package.json
      found_version=$(jq -r '.version' "${dir}/package.json")

      # Check if the found version is the same or later than the current version
      if [[ $(echo -e "$current_version\n$found_version" | sort -V | tail -n1) == "$found_version" ]]; then
        echo "$dir"
        return 0
      fi
  done

  echo "No valid install directory found." >&2
  return 1
}

os_type() {
  case "$(uname -s)" in
    Darwin*) echo "macOS";;
    Linux*)  echo "Linux";;
    MING*)   echo "win";;
    *)       echo "unknown";;
  esac
}

install_nvm() {
  source ~/.nvm/nvm.sh
  if ! command -v nvm &>/dev/null; then
    echo "Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
    source ~/.nvm/nvm.sh
    nvm install stable
  fi
}

SUDO=""

if command -v sudo; then
  SUDO="sudo"
fi

echo -e "\n\n"
echo "Welcome to the BrowserBox Pro installation."
echo "Before proceeding, please note the following:"
echo -e "\n"
echo "Summary: without a validly purchased and current commercial license, this product is only valid for noncommercial use or under the terms of the AGPL."
echo "By proceeding with this installation, you confirm your agreement to the terms and conditions contained within the LICENSE file (https://github.com/dosyago/BrowserBoxPro/blob/boss/LICENSE.md), as well as the terms at https://dosyago.com/terms.txt and https://dosyago.com/privacy.txt."
echo -e "\n"
echo "If you foresee using BrowserBoxPro for commercial purposes without complying with AGPL, you must purchase a license."
echo "Small volume licenses can be purchased on GumRoad (yearly or perpetual): https://dosy.gumroad.com/"
echo "For large volume purchases, please visit our website: https://dosyago.com"
echo -e "\n"
echo "For other inquiries, you may contact sales@dosyago.com."
echo -e "\n"
read_input "By proceeding with the installation, you confirm your acceptance of these terms and conditions and that you have purchased a license if your use of BrowserBoxPro is intended for commercial applications that do not comply with AGPL-3.0. Do you agree to these terms? (yes/no): " 

case ${REPLY:0:1} in
    y|Y )
        echo "You have agreed to the terms. Proceeding with the installation..."
    ;;
    * )
        echo "You did not agree to the terms. Exiting the installation..."
        exit 1
    ;;
esac

#!/bin/bash

# If on macOS
if [[ "$(uname)" == "Darwin" ]]; then
    # Check the machine architecture
    ARCH="$(uname -m)"
    if [[ "$ARCH" == "arm64" ]]; then
        echo "This script is not compatible with the MacOS ARM architecture at this time"
        echo "due to some dependencies having no pre-built binaries for this architecture."
        echo "Please re-run this script under Rosetta."
        #exit 1
    fi
fi

if [ "$(os_type)" == "Linux" ]; then
  $SUDO apt update && $SUDO apt -y upgrade
  $SUDO apt -y install net-tools ufw
  $SUDO ufw disable
fi

if [ "$#" -eq 2 ] || [[ "$1" == "localhost" ]]; then
  hostname="$1"
  export BB_USER_EMAIL="$2"

  amd64=""

  if [ "$hostname" == "localhost" ]; then
    if ! command -v mkcert &>/dev/null; then
      if [ "$(os_type)" == "macOS" ]; then
        brew install nss mkcert
      elif [ "$(os_type)" == "win" ]; then
        choco install mkcert || scoop bucket add extras && scoop install mkcert
      else
        amd64=$(dpkg --print-architecture || uname -m)
        $SUDO apt -y install libnss3-tools
        curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/$amd64"
        chmod +x mkcert-v*-linux-$amd64
        $SUDO cp mkcert-v*-linux-$amd64 /usr/local/bin/mkcert
        rm mkcert-v*
      fi
    fi
    mkcert -install
    if [[ ! -f "$HOME/sslcerts/privkey.pem" || ! -f "$HOME/sslcerts/fullchain.pem" ]]; then
      mkdir -p $HOME/sslcerts
      pwd=$(pwd)
      cd $HOME/sslcerts
      mkcert --cert-file fullchain.pem --key-file privkey.pem localhost 127.0.0.1
      cd $pwd
    else 
      echo "IMPORTANT: sslcerts already exist in $HOME/sslcerts directory. We are not overwriting them."
    fi
  else
    ip=$(getent hosts "$hostname" | awk '{ print $1 }')

    if [ -n "$ip" ]; then
      ./deploy-scripts/tls "$hostname"
    else
      echo "The provided hostname could not be resolved. Please ensure that you've added a DNS A/AAAA record pointing from the hostname to this machine's public IP address."
      exit 1
    fi
  fi
else
  if [[ "$1" = "localhost" ]]; then
    echo ""
    echo "Usage: $0 <hostname>"
    echo "Please provide a hostname as an argument. This hostname will be where a running bbpro instance is accessible." >&2
    echo "Note that user email is not required as 2nd parameter when using localhost as we do not use Letsencrypt in that case." >&2
  else 
    echo ""
    echo "Usage: $0 <hostname> <your_email>"
    echo "Please provide a hostname as an argument. This hostname will be where a running bbpro instance is accessible." >&2
    echo "Please provide an email as argument. This email will be used to agree to the Letsencrypt TOS for cert provisioning" >&2
  fi
  exit 1
fi

echo -n "Finding bbpro directory..."

INSTALL_DIR=$(get_latest_dir)

echo "Found bbpro at: $INSTALL_DIR"

read_input "GO?"

echo "Ensuring fully installed..."

cd $INSTALL_DIR

echo "Ensuring nvm installed..."
install_nvm

echo "Running npm install..."

npm i

echo "npm install complete"

if [ "$IS_DOCKER_BUILD" = "true" ]; then
  echo "In docker, not running parcel (it hangs sometimes!)"
else 
  npm run parcel
fi

if [ "$(os_type)" == "macOS" ]; then
  if brew install gnu-getopt; then
    brew link --force gnu-getopt
  fi
else
  if ! command -v getopt &>/dev/null; then
    echo "Installing gnu-getopt for Linux..."
    $SUDO apt-get update
    $SUDO apt-get install -y gnu-getopt
  fi
fi

read_input "Continue?"

echo "Fully installed!"

./deploy-scripts/copy_install.sh "$INSTALL_DIR"

echo -n "Setting up deploy system ..."

cd $INSTALL_DIR/src/services/pool/deploy/
./scripts/setup.sh

echo "Install complete!"

