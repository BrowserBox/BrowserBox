#!/usr/bin/env bash

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
  apt-get update && apt-get install -y jq
fi

# Define Docker daemon configuration file path
DOCKER_CONFIG="/etc/docker/daemon.json"

# Backup existing daemon.json if it exists
if [[ -f "$DOCKER_CONFIG" ]]; then
  sudo cp "$DOCKER_CONFIG" "${DOCKER_CONFIG}.bak_$(date +%F_%T)"
  echo "Backup of existing daemon.json created at ${DOCKER_CONFIG}.bak_$(date +%F_%T)"
fi

# Ensure containerd-snapshotter is enabled in daemon.json
if [[ -f "$DOCKER_CONFIG" ]]; then
  # Use jq to update the configuration and write back to the file
  contents="$(jq '.features["containerd-snapshotter"] = true' "$DOCKER_CONFIG")" && \
  echo -E "${contents}" | sudo tee "$DOCKER_CONFIG"
else
  # Create new daemon.json with required configuration
  sudo mkdir -p /etc/docker
  echo '{
    "features": {
      "containerd-snapshotter": true
    }
  }' | sudo tee "$DOCKER_CONFIG"
fi

echo "Docker daemon configuration updated successfully."

# Restart Docker to apply changes
echo "Restarting Docker daemon..."
sudo systemctl restart docker
echo "Docker daemon restarted."

# Ensure you use containerd for storage (Docker settings) for better performance and stability

# Install npm dependencies if node_modules directory does not exist
if [[ ! -d node_modules ]]; then
  echo "Installing npm dependencies..."
  npm install
fi

# Build the client (because this sometimes does not work inside a container)
echo "Building client bundle..."
npm run bundle

# Set up Docker build context for ARM64
echo "Setting up Docker context for ARM64..."
docker context create arm64-build --docker "host=ssh://${USER}@${HOST}" --default-stack-orchestrator swarm || echo "Docker context 'arm64-build' already exists."

# Create and use a custom builder with docker-container driver
echo "Creating and configuring Docker buildx builder..."
docker buildx create \
  --name container-builder \
  --driver docker-container \
  --use \
  --bootstrap \
  arm64-build || echo "Docker buildx builder 'container-builder' already exists."

# Check if the builder supports the required platforms
echo "Ensuring builder supports linux/amd64 and linux/arm64 platforms..."
SUPPORTED_PLATFORMS=$(docker buildx inspect --bootstrap | grep -Eo 'linux/amd64|linux/arm64' | sort | uniq)
if [[ "$SUPPORTED_PLATFORMS" != *"linux/amd64"* ]] || [[ "$SUPPORTED_PLATFORMS" != *"linux/arm64"* ]]; then
  echo "Builder does not support required platforms. Reconfiguring builder..."
  docker buildx rm container-builder
  docker buildx create \
    --name container-builder \
    --driver docker-container \
    --platform linux/amd64,linux/arm64 \
    --use \
    --bootstrap \
    arm64-build
fi

# Retrieve the latest git tag
tag="$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.1")"

# Build and push multi-platform Docker images
echo "Building and pushing Docker images with tag: $tag"
docker buildx build \
  --push \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/browserbox/browserbox:latest \
  -t ghcr.io/browserbox/browserbox:"${tag}" \
  -t dosyago/browserbox:latest \
  -t dosyago/browserbox:"${tag}" \
  .

echo "Docker images built and pushed successfully."

