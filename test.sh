#!/bin/bash

username=$(whoami)
trap 'sudo kill $BGPID; exit' SIGINT 

pulseaudio -k
pulseaudio --start

username=$(whoami)
cd parec-server
node index.js 8003 &
BGPID=$!
cd ..
node-dev index.js 5002 8002 xxxcookie $username token2
