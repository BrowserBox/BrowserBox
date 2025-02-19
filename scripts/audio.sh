#!/usr/bin/env bash


if [[ ! -z $1 ]]; then
  if [[ -z "${BB_POOL}" ]]; then
    pulseaudio -k  
  else
    sudo -g browsers pulseaudio -k
  fi
fi

pm2 restart start_audio 

sleep 1 

pm2 logs start_audio --nostream

pactl list sources

pactl list sinks



