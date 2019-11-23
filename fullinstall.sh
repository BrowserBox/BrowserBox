
#!/bin/bash

sudo apt update && sudo apt -y upgrade
sudo apt install curl git wget

# Docker


sudo apt install apt-transport-https ca-certificates curl gnupg2 software-properties-common

curl -fsSL https://download.docker.com/linux/debian/gpg | sudo apt-key add -

sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"

sudo apt update

git clone https://github.com/dosycorp/browsergap.ce.git
cd browsergap.cd
./build_docker.sh
./run_docker.sh

