#!/bin/bash

username=$(whoami)
echo "Starting viewfinder service cluster as $username"

echo "Trapping SIGINT to kill 1 child-processes: parec-server"
trap 'sudo -g browsers kill $BGPID1; exit' SIGINT

node -v

node=$(which node)

echo "Starting pulseaudio"
sudo -g browsers pulseaudio -k
sudo -g browsers pulseaudio --start

echo "Starting parec-server"
cd ./src/parec-server
sudo -g browsers $node ./index.js 8000 rtp.monitor xxxcookie bhvNDh6XYZ &
BGPID1=$!
cd ../../

echo "Starting main process, viewfinder, in foreground"
echo "Token: bhvNDh6XYZ"
$node ./src/server.js 5002 8002 xxxcookie $username bhvNDh6XYZ


