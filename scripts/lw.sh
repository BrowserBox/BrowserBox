#!/usr/bin/env bash

trap 'sudo kill $BGPID; exit' SIGINT 

sudo su -c 'killall npm node chrome || :'
sudo su -c 'memfree || :'

cd endbacker
sudo npm test &
BGPID=$!
cd ..
sudo npm start -- 5001 443 cookie $USER token signup
