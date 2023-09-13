#!/bin/sh

port=$1
if [ -z $port ]; then
  port=443
  echo "Supply port, defaulting to 443"
fi

mkdir -p pdfs
if [ ! -f "./pdfs/hashes.json" ]; then
  echo "[]" > pdfs/hashes.json
fi
if [ ! -f "./pdfs/links.json" ]; then
  echo "[]" > pdfs/links.json
fi

./public/uploads/clean.sh
node src/index.js $port
