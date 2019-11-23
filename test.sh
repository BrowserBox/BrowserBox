#!/bin/bash

trap 'sudo kill $BGPID; exit' SIGINT 

username=$(whoami)
cd parec-server
node index.js &
BGPID=$!
cd ..
node-dev index.js 5002 8002 xxxcookie $username token2
