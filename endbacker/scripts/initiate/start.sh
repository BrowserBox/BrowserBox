#!/bin/bash

username="$1"
cport="$2"
aport="$3"
cookie="$4"
token="$5"

cd /home/$username/dosy-browser
sudo -u $username npm start $cport $aport $cookie $username $token

