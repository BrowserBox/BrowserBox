#!/usr/bin/env bash

if [[ ! -d node_modules ]]; then
  echo "no" | npm i
fi
npm run parcel
docker buildx build --platform linux/amd64 -t bbpro-v4 . > artefacts/build.log 2>&1 &
tail -f artefacts/build.log
