#!/usr/bin/env bash

if [[ ! -d node_modules ]]; then
  yes | npm i
fi
npm run parcel
DOCKER_BUILDKIT=1 docker buildx build --platform linux/amd64 -t bbpro . > artefacts/build.log 2>&1 &
docker tag bbpro ghcr.io/browserbox/browserbox:latest
tail -f artefacts/build.log


