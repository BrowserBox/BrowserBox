#!/bin/bash

which pm2 || npm i -g pm2@latest
pm2 delete start_audio 
pm2 delete basic-bb-main-service 
pm2 delete devtools-server 
pm2 delete run-docspark
exit 0
