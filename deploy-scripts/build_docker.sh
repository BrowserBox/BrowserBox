#!/usr/bin/env bash

# ensure you use containerd for storage (Docker settings) for better performance and stability

if [[ ! -d node_modules ]]; then
  yes | npm i
fi
npm run bundle
DOCKER_BUILDKIT=1 
docker buildx create --use
docker buildx build --push --platform linux/amd64,linux/arm64 -t ghcr.io/browserbox/browserbox:latest -t dosyago/browserbox:latest . 

