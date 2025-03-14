#!/usr/bin/env bash

set -eox

# Default values
USER=""
HOST=""

cd BrowserBox

VERSION=$(git describe --tags --abbrev=0 2>/dev/null || true)

if [[ -z "$VERSION" ]]; then
  VERSION="v$(jq -r .version package.json 2>/dev/null || true)"
fi

if [[ -z "$VERSION" || "$VERSION" == "vnull" ]]; then
  VERSION="v0.0.1"
fi

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

if [[ -n "$restart" ]]; then
  # Restart Docker to apply changes
  echo "Restarting Docker daemon..."
  sudo systemctl restart docker
  echo "Docker daemon restarted."
  echo "Docker daemon configuration updated successfully."
fi

git switch main; git pull;
ssh ${USER}@${HOST} bash -cl 'cd; cd BrowserBox; git switch main; git pull;'

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

REPOS=("ghcr.io/browserbox/browserbox" "dosaygo/browserbox")
TAGS=("latest" "${VERSION}")
ANNOTATIONS=(
  "--annotation" "index:org.opencontainers.image.title=BrowserBox"
  "--annotation" "index:org.opencontainers.image.description=Embeddable remote browser isolation with vettable source - https://dosaygo.com"
  "--annotation" "index:org.opencontainers.image.version=${VERSION}"
  "--annotation" "index:org.opencontainers.image.authors=DOSAYGO BrowserBox Team <browserbox@dosaygo.com>"
  "--annotation" "index:org.opencontainers.image.source=https://github.com/BrowserBox/BrowserBox"
)

# Build and push multi-arch images
build_and_push() {
  echo "Building and pushing multi-arch images..."
  docker buildx build \
    --push \
    --platform linux/amd64,linux/arm64 \
    -t "${REPOS[0]}:latest" \
    -t "${REPOS[0]}:${VERSION}" \
    -t "${REPOS[1]}:latest" \
    -t "${REPOS[1]}:${VERSION}" \
    .
}

# Annotate manifest
annotate_manifest() {
  local tag="$1"
  echo "Annotating manifest for ${tag}..."
  if ! docker buildx imagetools inspect "${tag}" &> /dev/null; then
    echo "Error: Manifest list for ${tag} does not exist."
  fi
  docker buildx imagetools create \
    "${ANNOTATIONS[@]}" \
    --tag "${tag}" \
    "${tag}"
}

# Execute
build_and_push
for repo in "${REPOS[@]}"; do
  for tag in "${TAGS[@]}"; do
    annotate_manifest "${repo}:${tag}"
  done
done

echo "All done! Docker images and manifests built, annotated, and pushed successfully."
echo ""
exit 0
