#!/usr/bin/env bash

USERNAME="$1"

if [[ -z "$USERNAME" ]]; then
  echo "Provide your GitHub username" >&2
  echo "Usage: $0 <github_username>" >&2
  exit 1
fi

if [[ -z "$CR_PAT" ]]; then
  echo "set your GH token to CR_PAT environment variable" >&2
  exit 1
fi

tag="$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.1")"

echo $CR_PAT | docker login ghcr.io -u $USERNAME --password-stdin
docker login
docker push dosyago/browserbox:latest ghcr.io/browserbox/browserbox:latest
docker push "dosyago/browserbox:${tag}" "ghcr.io/browserbox/browserbox:${tag}"

