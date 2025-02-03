#!/usr/bin/env bash

#pkill -u cris node && pkill -u cris chrome && pkill -u cris node-dev && pkill -u cris nodemon

pm2 stop parec-server 
pm2 stop devtools-server 
pm2 stop pptr-console-server 
pm2 stop chat-server 
pm2 stop main-vf-service

pm2 delete parec-server 
pm2 delete devtools-server 
pm2 delete pptr-console-server 
pm2 delete chat-server 
pm2 delete main-vf-service

sleep 1
pkill -u $(whoami) node 
pkill -u $(whoami) npm 
pkill -u $(whoami) chrome
sleep 1
pkill -9 -u $(whoami) node 
pkill -9 -u $(whoami) npm 
pkill -9 -u $(whoami) chrome 

