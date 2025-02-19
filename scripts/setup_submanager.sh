#!/usr/bin/env bash

me=$(whoami)
sudo groupadd scripters
sudo groupadd browsers
sudo groupadd appusers
sudo usermod -aG browsers,scripters,appusers $me
sudo adduser submanager --shell=/usr/sbin/nologin
sudo usermod -L submanager
sudo mkdir /home/submanager/scripts
sudo chgrp scripters /home/submanager/scripts
sudo chmod g+w-r /home/submanager/scripts
sudo chmod o-r /home/submanager/scripts


