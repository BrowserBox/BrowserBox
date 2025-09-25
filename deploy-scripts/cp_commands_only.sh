#!/usr/bin/env bash

echo "Copying commands and certs only for bbpro..." 

INSTALL_DIR="${1:-$(pwd)}"
SUDO=""
COMMAND_DIR=""

if command -v sudo &> /dev/null; then
  SUDO="sudo -n"
fi

# Check if /usr/local/bin is in the PATH and is writable
if [[ ":$PATH:" == *":/usr/local/bin:"* ]] && $SUDO test -w /usr/local/bin; then
  COMMAND_DIR="/usr/local/bin"
  $SUDO mkdir -p $COMMAND_DIR
elif $SUDO test -w /usr/bin; then
  COMMAND_DIR="/usr/bin"
  $SUDO mkdir -p $COMMAND_DIR
else
  COMMAND_DIR="$HOME/.local/bin"
  mkdir -p $COMMAND_DIR
fi

echo "Copying commands to $COMMAND_DIR..."

commands=(
  "setup_bbpro"
  "bbpro"
  "stop_bbpro"
  "torbb"
  "setup_tor"
  "bbcertify"
  "bbrevalidate"
  "bbclear"
  "bbupdate"
  "msgme"
  "win9x_bbpro"
  "setup_nginx"
  "setup_zerotier"
)

for cmd in "${commands[@]}"; do
  if [[ -f "./deploy-scripts/_${cmd}.sh" ]]; then
    echo -n "Copying ${cmd}..."
    $SUDO cp "./deploy-scripts/_${cmd}.sh" "${COMMAND_DIR}/${cmd}"
    $SUDO chmod +x "${COMMAND_DIR}/${cmd}"
    echo "Copied!"
  else
    echo "Warning: Script for command '${cmd}' not found at ./deploy-scripts/_${cmd}.sh"
  fi
done

echo -n "Copying bbx CLI..."
$SUDO cp "./bbx.sh" "${COMMAND_DIR}/bbx"
echo "Copied!"

echo "Commands copied successfully."

echo -n "Copying sslcerts to /usr/local/share/dosyago/sslcerts ..."

$SUDO rm -rf /usr/local/share/dosaygo/sslcerts/*
$SUDO mkdir -p /usr/local/share/dosyago/sslcerts/
$SUDO cp $HOME/sslcerts/* /usr/local/share/dosyago/sslcerts/
$SUDO chmod -R 755 /usr/local/share/dosyago/sslcerts/*

echo "Copied!"

