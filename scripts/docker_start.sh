#!/usr/bin/env bash

username=$(whoami)
trap 'sudo kill $BGPID; exit' SIGINT 

sudo -g browsers pulseaudio -k
sudo -g browsers pulseaudio --start

node=$(which node)
username=$(whoami)
cd ./src/services/instance/parec-server
sudo -g browsers $node index.js 8000 rtp.monitor xxxcookie token2 &
BGPID=$!
cd ../../../
$node ./src/server.js 5002 8002 xxxcookie $username token2
