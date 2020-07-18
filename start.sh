#!/bin/bash

username=$(whoami)
let audio=$2-2
trap 'sudo kill $BGPID; exit' SIGINT 
trap 'sudo kill $BGPID; exit' SIGKILL 

pulseaudio -k
pulseaudio --start

username=$(whoami)
cd parec-server
node -r esm index.js $audio &
BGPID=$!
cd ..
node index.js $1 $2 $3 $username $5
