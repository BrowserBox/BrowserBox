#!/usr/bin/env bash

if ps -C glances > /dev/null; then
  echo http://$(curl -s ifconfig.me):14999/
  exit 0
else
  which glances >&2 || curl -L https://bit.ly/glances | /usr/bin/env bash
  sudo killall glances
  sudo -u nobody nohup glances -1 -w -p 14999 -t 2 &> $(mktemp) &
  echo http://$(curl -s ifconfig.me):14999/
fi

