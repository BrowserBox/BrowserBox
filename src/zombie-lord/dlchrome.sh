#!/usr/bin/env bash

amd64=$(dpkg --print-architecture || uname -m)
rm google-chrome-stable_current_$amd64.deb || :
wget https://dl.google.com/linux/direct/google-chrome-stable_current_$amd64.deb
if [[ -f google-chrome-stable_current_$amd64.deb ]]; then
  sudo dpkg -i google-chrome-stable_current_$amd64.deb 
  sudo $APT --fix-broken -y install
  rm google-chrome-stable_current_$amd64.deb || :
  #sudo $APT -y install google-chrome-stable
  #sudo $APT --fix-broken install
else
  sudo $APT install -y chromium
fi

