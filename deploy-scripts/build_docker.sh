#!/usr/bin/env bash

# ensure you use containerd for storage (Docker settings) for better performance and stability

if [[ ! -d node_modules ]]; then
  yes | npm i
fi
npm run bundle
DOCKER_BUILDKIT=1 docker buildx build --load --platform linux/amd64 -t bbpro . 
docker tag bbpro ghcr.io/browserbox/browserbox:latest
docker tag bbpro dosyago/browserbox:latest

