#!/bin/bash

which pm2 || npm i -g pm2@latest
pm2 delete start_audio basic-bb-main-service devtools-server
exit 0
