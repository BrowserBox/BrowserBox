#!/usr/bin/env bash

loginctl enable-linger
sudo mkdir -p /usr/local/lib/systemd/logind.conf.d/
sudo echo "KillUserProcesses=no" > /usr/local/lib/systemd/logind.conf.d/nokill.conf
sudo cp -r ./src/services/instance/parec-server/pulse/* /etc/pulse/
cp -r ./src/services/instance/parec-server/pulse/* ~/.config/pulse/


