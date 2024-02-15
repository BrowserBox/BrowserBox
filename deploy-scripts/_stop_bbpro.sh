#!/usr/bin/env bash

source ~/.nvm/nvm.sh

pm2 delete all
killall node chrome

exit 0 
