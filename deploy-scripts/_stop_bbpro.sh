#!/usr/bin/env bash

source ~/.nvm/nvm.sh

command -v pm2 &>/dev/null || npm i -g pm2@latest
pm2 delete all
killall node chrome

exit 0 
