#!/usr/bin/env bash

docker buildx build --platform linux/amd64 -t bbpro-v4 . > artefacts/build.log 2>&1 &
tail -f artefacts/build.log
