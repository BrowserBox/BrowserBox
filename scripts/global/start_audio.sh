#!/usr/bin/env bash

if [[ -z "${BB_POOL}" ]]; then
  ./scripts/global/parec-server.sh $1
else
  sudo -g browsers ./scripts/global/parec-server.sh $1
fi

