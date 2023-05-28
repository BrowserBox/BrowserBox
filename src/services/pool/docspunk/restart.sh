#!/bin/sh

pm2=$(which pm2)
$pm2 stop run
$pm2 delete run
./rebuild_hashes.js
$pm2 start ./run.sh
