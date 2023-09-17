#!/usr/bin/env bash

INSTALL_DIR="${1:-$(pwd)}"

SUDO=""

if command -v sudo; then
  SUDO="sudo"
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

echo -n "Copying bbpro command to /usr/local/bin/ ..."

$SUDO cp $INSTALL_DIR/deploy-scripts/_bbpro.sh /usr/local/bin/bbpro

echo "Copied!"

echo -n "Copying setup_bbpro command to /usr/local/bin/ ..."

$SUDO cp $INSTALL_DIR/deploy-scripts/_setup_bbpro.sh /usr/local/bin/setup_bbpro

echo "Copied!"

echo -n "Copying monitoring commands to /usr/local/bin/ ..."

$SUDO cp $INSTALL_DIR/monitor-scripts/* /usr/local/bin/

echo "Copied!"

echo -n "Copying sslcerts to /usr/local/share/dosyago/sslcerts ..."

$SUDO mkdir -p /usr/local/share/dosyago/sslcerts/
$SUDO rm -rf /usr/local/share/dosaygo/sslcerts/*
$SUDO cp $HOME/sslcerts/* /usr/local/share/dosyago/sslcerts/
$SUDO chmod -R 755 /usr/local/share/dosyago/sslcerts/*

echo "Copied!"
