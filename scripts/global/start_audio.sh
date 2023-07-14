#!/usr/bin/env bash

if ! which pulseaudio; then
  echo "Sorry pulseaudio is not installed. Audio will not work."
  echo "Therefore we will not try the audio service."
  exit 0
fi

if [[ -z "${BB_POOL}" ]]; then
  ./scripts/global/parec-server.sh $1
else
  sudo -g browsers ./scripts/global/parec-server.sh $1
fi

