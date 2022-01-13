#!/usr/bin/env bash

rm google-chrome-stable_current_amd64.deb || :
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb 
sudo apt --fix-broken -y install
rm google-chrome-stable_current_amd64.deb || :
