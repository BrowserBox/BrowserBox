#!/usr/bin/env bash

if [[ ! -d node_modules ]]; then
  echo "no" | npm i
fi
npm run parcel
DOCKER_BUILDKIT=1 docker buildx build --platform linux/amd64 -t bbpro-v5 . > artefacts/build.log 2>&1 &
tail -f artefacts/build.log
