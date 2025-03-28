#!/usr/bin/env bash

sudo su -c "echo 'kernel.unprivileged_userns_clone=1' > /etc/sysctl.d/00-local-userns.conf"
sudo su -c "echo 'net.ipv4.ip_forward=1' > /etc/sysctl.d/01-network-ipv4.conf"
sudo sysctl -p
sudo docker run -d -p 8000:8000 -p 8002:8002 -d --security-opt seccomp=$(pwd)/config/chrome.json viewfinder-regular:latest
