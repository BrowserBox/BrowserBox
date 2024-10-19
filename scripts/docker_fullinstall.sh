#!/usr/bin/env bash

# works on Debian 10

sudo $APT update && sudo $APT -y upgrade
sudo $APT install -y curl git wget

# Docker


sudo $APT install -y apt-transport-https ca-certificates curl gnupg2 software-properties-common

sudo apt-key adv --fetch-keys https://download.docker.com/linux/debian/gpg

sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"

sudo $APT update

sudo $APT install -y docker-ce

git clone https://github.com/dosyago/BrowserBox
cd BrowserBox
./build_docker.sh
./run_docker.sh
