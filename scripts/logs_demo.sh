#!/usr/bin/env bash

pm2=$(which pm2)
sudo su -c "$pm2 logs"
