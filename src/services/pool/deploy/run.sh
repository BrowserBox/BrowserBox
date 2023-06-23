#!/usr/bin/env bash

if [ ! -d "./node_modules" ]; then
 npm i
fi
pm2 stop deploy-start
pm2 delete deploy-start
pm2 start ./scripts/deploy-start.sh -k 60000
pm2 save

