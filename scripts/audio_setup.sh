#!/usr/bin/env bash

sudo loginctl enable-linger
sudo mkdir -p /usr/local/lib/systemd/logind.conf.d/
echo "KillUserProcesses=no" | sudo tee -a /usr/local/lib/systemd/logind.conf.d/nokill.conf
sudo mkdir -p /etc/pulse
sudo cp -r ./src/services/instance/parec-server/pulse/* /etc/pulse/
mkdir -p ~/.config/pulse
cp -r ./src/services/instance/parec-server/pulse/* ~/.config/pulse/


