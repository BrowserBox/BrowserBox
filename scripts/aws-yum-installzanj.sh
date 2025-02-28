#!/usr/bin/env bash

ssh_priv_key_file=$1
ssh-keyscan -H github.com >> ~/.ssh/known_hosts
ssh-keyscan -H gitlab.com >> ~/.ssh/known_hosts
sudo yum install -y git
sudo echo "$(cat $ssh_priv_key_file)" > .ssh/id_ed25519
sudo chmod 400 .ssh/id_ed25519
git clone git@github.com:/crislin2046/environments.git
cd environments
./basic_setup
cd ..
gclone git@gitlab.com:/dosycorp/zanj.git
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.0/install.sh | bash
export NVM_DIR=$HOME/.nvm
source $HOME/.nvm/nvm.sh
nvm install 8.12.0
nvm install-latest-npm
curl https://intoli.com/install-google-chrome.sh | bash
sudo yum install -y google-noto*
npm i -g pm2
cd zanj
npm i
pm2 start index.js
pm2 startup
# the following line may change depending on pm2 startup output
# but I don't know how to select then execute that output line
sudo env PATH=$PATH:/home/ec2-user/.nvm/versions/node/v8.12.0/bin /home/ec2-user/.nvm/versions/node/v8.12.0/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user
