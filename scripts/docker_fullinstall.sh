#!/bin/bash

# works on Debian 10

sudo apt update && sudo apt -y upgrade
sudo apt install -y curl git wget

# Docker


sudo apt install -y apt-transport-https ca-certificates curl gnupg2 software-properties-common

sudo apt-key adv --fetch-keys https://download.docker.com/linux/debian/gpg

sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"

sudo apt update

sudo apt install -y docker-ce

git clone https://github.com/dosyago/BrowserBox
cd BrowserBox
./build_docker.sh
./run_docker.sh
