#!/bin/bash

username="$1"

cd /home/$username/dosy-browser
sudo -u $username npm i

