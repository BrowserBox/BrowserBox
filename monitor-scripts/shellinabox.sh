#!/usr/bin/env bash

if ps -C shellinaboxd > /dev/null; then
  echo http://$(curl -s ifconfig.me):13888/htop_app/
else
  which shellinaboxd >&2 || sudo $APT install -y shellinabox >&2
  sudo killall shellinaboxd
  sudo update-rc.d -f shellinaboxd remove
  sudo update-rc.d -f shellinabox remove
  sudo systemctl stop shellinabox
  sudo -u nobody nohup timeout 60m shellinaboxd -t -b -p 13888 --no-beep        -s '/htop_app/:nobody:nogroup:/:htop -d 70' > $(mktemp) 2>&1 &
  echo http://$(curl -s ifconfig.me):13888/htop_app/
fi

