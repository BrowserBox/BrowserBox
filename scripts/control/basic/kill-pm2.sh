#!/usr/bin/env bash

pm2 delete start_audio basic-bb-main-service

sleep 1
killall node npm chrome
sleep 1
killall -9 node npm chrome


