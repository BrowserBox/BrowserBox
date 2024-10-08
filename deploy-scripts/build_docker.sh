#!/usr/bin/env bash

set -eox

# Default values
USER=""
HOST=""

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
  key="$1"

  case $key in
    --user)
      USER="$2"
      shift # past argument
      shift # past value
      ;;
    --host)
      HOST="$2"
      shift # past argument
      shift # past value
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate input
if [[ -z "$USER" || -z "$HOST" ]]; then
  echo "Error: --user and --host arguments are required."
  exit 1
fi

read -p "Are you logged in to Docker and GHCR? Enter to continue if so. Otherwise CTRL-C to exit and log in now."

# Test SSH connection to the ARM64 host
echo "Testing SSH connection to ${USER}@${HOST}..."
if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "${USER}@${HOST}" exit; then
  echo "Error: SSH connection to ${USER}@${HOST} failed."
  exit 1
else
  echo "SSH connection to ${USER}@${HOST} successful."
fi

# Ensure jq is installed
if ! command -v jq &> /dev/null; then
  echo "jq is not installed. Installing jq..."
  sudo apt-get update && sudo apt-get install -y jq
fi

# Define Docker daemon configuration file path
DOCKER_CONFIG="/etc/docker/daemon.json"

restart=""

# Ensure containerd-snapshotter is enabled in daemon.json
if [[ -f "$DOCKER_CONFIG" ]]; then
  # Check if containerd-snapshotter is already set to true
  if jq -e '.features["containerd-snapshotter"] == true' "$DOCKER_CONFIG" > /dev/null; then
    echo "containerd-snapshotter is already enabled in $DOCKER_CONFIG"
  else
    echo "Enabling containerd-snapshotter in $DOCKER_CONFIG"
    # Use jq to update the configuration and write back to the file
    contents="$(jq '.features["containerd-snapshotter"] = true' "$DOCKER_CONFIG")" && \
    echo -E "${contents}" | sudo tee "$DOCKER_CONFIG"
    restart=true
  fi
else
  echo "$DOCKER_CONFIG does not exist, creating with containerd-snapshotter enabled"
  # Create new daemon.json with required configuration
  sudo mkdir -p /etc/docker
  echo '{
    "features": {
      "containerd-snapshotter": true
    }
  }' | sudo tee "$DOCKER_CONFIG"
  restart=true
fi

if [[ -n "$restart" ]];then
  # Restart Docker to apply changes
  echo "Restarting Docker daemon..."
  sudo systemctl restart docker
  echo "Docker daemon restarted."
  echo "Docker daemon configuration updated successfully."
fi

# Step 0: Remove any old ones
docker buildx rm container-builder || true

# Step 1: Create the builder
echo "Creating Docker buildx builder..."
docker buildx create --name container-builder --driver docker-container --use

# Step 3: Append the remote arm64 node
echo "Appending remote arm64 build node to the builder..."
docker buildx create \
  --append \
  --name container-builder \
  --node remote_arm64_builder \
  --platform linux/arm64 \
  ssh://${USER}@${HOST} \
  --driver-opt env.BUILDKIT_STEP_LOG_MAX_SIZE=10000000 \
  --driver-opt env.BUILDKIT_STEP_LOG_MAX_SPEED=10000000

# Step 4: Inspect and bootstrap the builder
echo "Inspecting and bootstrapping the builder..."
docker buildx inspect --bootstrap

# Build and push multi-platform Docker images
echo "Building and pushing Docker images..."
docker buildx build \
  --push \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/browserbox/browserbox:latest \
  -t ghcr.io/browserbox/browserbox:"$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.1")" \
  -t dosyago/browserbox:latest \
  -t dosyago/browserbox:"$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.1")" \
  .

echo "Docker images built and pushed successfully."
