#!/usr/bin/env bash

pm2 stop deploy-start
pm2 delete deploy-start
pm2 start ./scripts/deploy-start.sh -k 60000
pm2 save

