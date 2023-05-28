#!/bin/sh

port=$1
if [ -z $port ]; then
  port=443
  echo "Supply port, defaulting to 443"
fi

cd public/uploads
./clean.sh
cd ../..
node index.js $port
