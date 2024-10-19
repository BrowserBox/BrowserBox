#!/usr/bin/env bash

source $HOME/.bashrc
source $HOME/.nvm/nvm.sh
nvm install --lts
npm i -g npm@latest
which pm2 || npm i -g pm2@latest

sudo memfree
sudo pkill watcher.sh

sleep 1

sudo killall chrome cpulimit

cwd=$(pwd)
pm2=$(which pm2)

$pm2 delete all

sudo killall node

cp /home/$USER/sslcerts/* /home/$USER/paid-remote-browsers/sslcerts/
cp /home/$USER/sslcerts/* /home/$USER/free-remote-browsers/sslcerts/

cd /home/$USER/paid-remote-browsers/
chown $USER:browsers .
$pm2 start ./test-paid.sh

cd /home/$USER/free-remote-browsers/
$pm2 start ./test-pool.sh

#cd /home/$USER/vf/capi.click
#pm2 start ./start.sh

$pm2 save
$pm2 logs
$pm2 startup
