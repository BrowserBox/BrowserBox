#!/usr/bin/env bash

pm2 delete all
killall chrome node npm
echo "Now run"
echo "./deploy-scripts/global_install.sh <domain name> "
echo "again"


