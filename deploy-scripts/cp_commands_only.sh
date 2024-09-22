#!/usr/bin/env bash

echo "Copying commands and certs only for bbpro..." 

INSTALL_DIR="${1:-$(pwd)}"
SUDO=""
COMMAND_DIR=""

source ~/.nvm/nvm.sh

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

echo -n "Copying bbpro command to $COMMAND_DIR/ ..."

$SUDO cp $INSTALL_DIR/deploy-scripts/_bbpro.sh $COMMAND_DIR/bbpro

echo "Copied!"

echo -n "Copying setup_bbpro and stop_bbpro commands to $COMMAND_DIR/ ..."

$SUDO cp $INSTALL_DIR/deploy-scripts/_setup_bbpro.sh $COMMAND_DIR/setup_bbpro
$SUDO cp $INSTALL_DIR/deploy-scripts/_stop_bbpro.sh $COMMAND_DIR/stop_bbpro

echo "Copied!"

echo -n "Copying msgme command to $COMMAND_DIR/ ..."

$SUDO cp $INSTALL_DIR/deploy-scripts/_msgme.sh $COMMAND_DIR/msgme

echo "Copied!"

echo -n "Copying bbclear command to $COMMAND_DIR/ ..."

$SUDO cp $INSTALL_DIR/deploy-scripts/_bbclear.sh $COMMAND_DIR/bbclear

echo "Copied!"

echo -n "Copying torbb command to $COMMAND_DIR/ ..."

$SUDO cp $INSTALL_DIR/deploy-scripts/_torbb.sh $COMMAND_DIR/torbb

echo "Copied!"

echo -n "Copying setup_tor command to $COMMAND_DIR/ ..."

$SUDO cp $INSTALL_DIR/deploy-scripts/_setup_tor.sh $COMMAND_DIR/setup_tor

echo "Copied!"

echo -n "Copying non-interactive.sh config to $COMMAND_DIR/ ..."

$SUDO cp $INSTALL_DIR/deploy-scripts/non-interactive.sh $COMMAND_DIR/

echo "Copied!"

echo -n "Copying monitoring commands to $COMMAND_DIR/ ..."

$SUDO cp $INSTALL_DIR/monitor-scripts/* $COMMAND_DIR/

echo "Copied!"

echo -n "Copying sslcerts to /usr/local/share/dosyago/sslcerts ..."

$SUDO mkdir -p /usr/local/share/dosyago/sslcerts/
$SUDO rm -rf /usr/local/share/dosaygo/sslcerts/*
$SUDO cp $HOME/sslcerts/* /usr/local/share/dosyago/sslcerts/
$SUDO chmod -R 755 /usr/local/share/dosyago/sslcerts/*

echo "Copied!"

