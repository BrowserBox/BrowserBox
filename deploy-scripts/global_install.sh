#!/usr/bin/env bash

get_install_dir() {
  install_path=$(find $HOME -name .bbpro_install_dir -print -quit 2>/dev/null)
  install_dir=$(dirname $install_path)
  echo $install_dir
}

os_type() {
  case "$(uname -s)" in
    Darwin*) echo "macOS";;
    Linux*)  echo "Linux";;
    *)       echo "unknown";;
  esac
}

install_nvm() {
  source ~/.nvm/nvm.sh
  if ! command -v nvm &>/dev/null; then
    echo "Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
    source ~/.nvm/nvm.sh
    nvm install node
  fi
}

echo -e "\n\n"
echo "Welcome to the BrowserBox Pro installation."
echo "Before proceeding, please note the following:"
echo -e "\n"
echo "Without a commercial license, this product is only valid for noncommercial use."
echo "By proceeding with this installation, you confirm your agreement to the terms and conditions contained within the LICENSE file (https://github.com/dosyago/BrowserBoxPro/blob/boss/LICENSE), as well as the terms at https://dosyago.com/terms.txt and https://dosyago.com/privacy.txt."
echo -e "\n"
echo "If you foresee using BrowserBoxPro for commercial purposes, you must purchase a license."
echo "Small volume licenses can be purchased on GumRoad (yearly or perpetual): https://dosy.gumroad.com/"
echo "For large volume purchases, please visit our website: https://dosyago.com"
echo -e "\n"
echo "For other inquiries, you may contact sales@dosyago.com."
echo -e "\n"
read -p "By proceeding with the installation, you confirm your acceptance of these terms and conditions and that you have purchased a license if your use of BrowserBoxPro is intended for commercial applications. Do you agree to these terms? (yes/no): " answer

case ${answer:0:1} in
    y|Y )
        echo "You have agreed to the terms. Proceeding with the installation..."
    ;;
    * )
        echo "You did not agree to the terms. Exiting the installation..."
        exit 1
    ;;
esac


if [ "$(os_type)" == "Linux" ]; then
  sudo apt -y install net-tools ufw
  sudo ufw disable
fi

if [ "$#" -eq 1 ]; then
  hostname="$1"

  if [ "$hostname" == "localhost" ]; then
    if ! command -v mkcert &>/dev/null; then
      if [ "$(os_type)" == "macOS" ]; then
        brew install mkcert
      else
        curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
        chmod +x mkcert-v*-linux-amd64
        sudo cp mkcert-v*-linux-amd64 /usr/local/bin/mkcert
      fi
    fi
    mkcert -install
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
  echo "Usage: $0 <hostname>"
  echo "Please provide a hostname as an argument. This hostname will be where a running bbpro instance is accessible."
  exit 1
fi

echo -n "Finding bbpro directory..."

INSTALL_DIR=$(get_install_dir)

echo "Found bbpro at: $INSTALL_DIR"

echo "Ensuring fully installed..."

cd $INSTALL_DIR

install_nvm
npm i
npm run parcel

if [ "$(os_type)" == "macOS" ]; then
  if brew install gnu-getopt; then
    brew link --force gnu-getopt
  fi
else
  if ! command -v getopt &>/dev/null; then
    echo "Installing gnu-getopt for Linux..."
    sudo apt-get update
    sudo apt-get install -y gnu-getopt
  fi
fi

read -p "Continue?"

echo "Fully installed!"

echo -n "Copying bbpro application files to /usr/local/share/dosyago/ ..."
sudo mkdir -p /usr/local/share/dosyago

sudo cp -r $INSTALL_DIR /usr/local/share/dosyago
INSTALL_NAME=$(basename $INSTALL_DIR)
sudo rm -rf /usr/local/share/dosyago/$INSTALL_NAME/.git

echo "Copied!"

echo -n "Setting correct permissions for installation ... "

sudo chmod -R 755 /usr/local/share/dosyago/*

echo "Permissions set!"

echo -n "Copying bbpro command to /usr/local/bin/ ..."

sudo cp $INSTALL_DIR/deploy-scripts/_bbpro.sh /usr/local/bin/bbpro

echo "Copied!"

echo -n "Copying setup_bbpro command to /usr/local/bin/ ..."

sudo cp $INSTALL_DIR/deploy-scripts/_setup_bbpro.sh /usr/local/bin/setup_bbpro

echo "Copied!"

echo -n "Copying monitoring commands to /usr/local/bin/ ..."

sudo cp $INSTALL_DIR/monitor-scripts/* /usr/local/bin/

echo "Copied!"

echo -n "Copying sslcerts to /usr/local/share/dosyago/sslcerts ..."

sudo mkdir -p /usr/local/share/dosyago/sslcerts/
sudo rm -rf /usr/local/share/dosaygo/sslcerts/*
sudo cp $HOME/sslcerts/* /usr/local/share/dosyago/sslcerts/
sudo chmod -R 555 /usr/local/share/dosyago/sslcerts/*

echo "Copied!"

echo -n "Setting up deploy system ..."

cd $INSTALL_DIR/deploy/
./scripts/setup.sh

echo "Install complete!"

