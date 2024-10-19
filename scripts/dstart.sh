#!/usr/bin/env bash

username=$(whoami)
trap 'sudo kill $BGPID; exit' SIGINT 

pulseaudio -k
pulseaudio --start

username=$(whoami)
cd parec-server
node -r esm index.js 8000 &
BGPID=$!
cd ..
node index.js 5002 8002 xxxcookie $username token2
