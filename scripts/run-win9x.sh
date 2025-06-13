#!/usr/bin/env bash

bpid="$(pgrep -x browserbox -u "$(whoami)")"
if [[ -n "$bpid" ]]; then
  kill -HUP $bpid
fi

pm2 delete run-docspark
pm2 delete devtools-server
pm2 delete start_audio

sleep 1

pm2 stop basic-bb-main-service 

sleep 1

pm2 delete basic-bb-main-service
pm2 save --force

export WIN9X_COMPATIBILITY_MODE="true"
npm test
