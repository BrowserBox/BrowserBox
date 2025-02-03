#!/usr/bin/env bash

# do not kill *other* node js processes besides ones pm2 can kill and control for browserbox
export DO_NOT_KILL_NODE=true
stop_bbpro ; npm test && pm2 logs basic-bb-main-service

