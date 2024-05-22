#!/usr/bin/env bash

source ~/.nvm/nvm.sh

command -v pm2 &>/dev/null || npm i -g pm2@latest
pm2 delete basic-bb-main-service
pm2 delete run-docspark
pm2 delete devtools-server
pm2 delete start_audio
if [[ -z "$DO_NOT_KILL_NODE" ]]; then
  pkill -u $(whoami) node 
fi
pkill -u $(whoami) chrome
pulseaudio -k
pm2 save --force
if [[ "$(pm2 jlist)" == "[]" ]]; then
  pm2 kill
fi

exit 0 
