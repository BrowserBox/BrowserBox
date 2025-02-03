#!/usr/bin/env bash

INSTALL_DIR="${1:-$(pwd)}"
SUDO=""
COMMAND_DIR=""

if [[ -f ~/.nvm/nvm.sh ]]; then
  source ~/.nvm/nvm.sh
fi

if command -v sudo &> /dev/null; then
  SUDO="sudo -n"
fi

# Check if /usr/local/bin is in the PATH and is writable
if [[ ":$PATH:" == *":/usr/local/bin:"* ]] && sudo test -w /usr/local/bin; then
  COMMAND_DIR="/usr/local/bin"
  $SUDO mkdir -p $COMMAND_DIR
elif sudo test -w /usr/bin; then
  COMMAND_DIR="/usr/bin"
  $SUDO mkdir -p $COMMAND_DIR
else
  COMMAND_DIR="$HOME/.local/bin"
  mkdir -p $COMMAND_DIR
fi

if [[ -f /etc/os-release ]]; then
  . /etc/os-release
  if [[ $ID == *"bsd" ]]; then
    echo "Skipping build step as on a bsd flavor" >&2
  fi
else
  bundle="$(cd src; node -e "import('./common.js').then(({DEBUG}) => console.log(DEBUG.bundleClientCode))")"
  if [[ "$bundle" != "false" ]]; then
    npm run parcel
  fi
fi

echo "INSTALL_DIR: $INSTALL_DIR"
echo -n "Copying bbpro application files to /usr/local/share/dosyago/ ..."
$SUDO mkdir -p /usr/local/share/dosyago

$SUDO cp -r $INSTALL_DIR /usr/local/share/dosyago
INSTALL_NAME=$(basename $INSTALL_DIR)
$SUDO rm -rf /usr/local/share/dosyago/$INSTALL_NAME/.git

echo "Copied!"

echo -n "Setting correct permissions for installation ... "

$SUDO chmod -R 755 /usr/local/share/dosyago/*

echo "Permissions set!"

cd $INSTALL_DIR

./deploy-scripts/cp_commands_only.sh

