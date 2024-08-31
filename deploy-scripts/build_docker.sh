#!/usr/bin/env bash

# ensure you use containerd for storage (Docker settings) for better performance and stability

if [[ ! -d node_modules ]]; then
  yes | npm i
fi

# build the client (because this sometimes does not work inside a container)
npm run bundle

#DOCKER_BUILDKIT=1 
#export BUILDKIT_PROGRESS=plain

# check if any builder supports our platforms

if ! docker buildx ls | grep -q "linux/amd64.*linux/arm64\|linux/arm64.*linux/amd64"; then
  docker buildx create --use
fi

tag="$(git tag | tail -n 1)"

docker buildx build --push --platform linux/amd64,linux/arm64 -t ghcr.io/browserbox/browserbox:latest -t "ghcr.io/browserbox/browserbox:${tag}" -t dosyago/browserbox:latest -t "dosyago/browserbox:${tag}" . 

