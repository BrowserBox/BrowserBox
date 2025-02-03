#!/usr/bin/env bash

pm2 delete start_audio basic-bb-main-service
sudo killall node npm chrome
sudo killall -9 node npm chrome
