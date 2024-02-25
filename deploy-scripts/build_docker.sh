#!/usr/bin/env bash

# Check for node_modules and install dependencies if they're missing
if [[ ! -d node_modules ]]; then
  yes | npm i
fi

# Bundle your application
npm run parcel

# Set up Docker to use BuildKit for building images
export DOCKER_BUILDKIT=1

# Create and use a new buildx builder which will enable multi-platform builds
docker buildx create --use

# Start the multi-platform build
# This includes both linux/amd64 and linux/arm64 (for macOS Apple Silicon)
docker buildx build --platform linux/amd64,linux/arm64 -t dosyago/browserbox --push . > artefacts/build.log 2>&1 &

# Note: The '--push' flag is necessary for multi-platform builds as they cannot be loaded directly into the Docker daemon.
# Ensure you're logged into the Docker registry where you're pushing the image.

# Tagging the image for a specific platform after a multi-platform build isn't directly supported
# because the image manifest now contains references for all the platforms.
# If you need to tag and push the image for a specific platform, consider separate build commands or handle tagging in your CI/CD pipeline.

# Follow the build log
tail -f artefacts/build.log


