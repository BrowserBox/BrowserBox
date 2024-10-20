#!/usr/bin/env bash

# Usage: ./install_node.sh <version>
usage() {
  echo "Usage: $0 <version>"
  echo "Example: $0 22"
  exit 1
}

# Check if a version is provided
if [ -z "$1" ]; then
  usage
fi

VERSION=$1

# Detect if the system is FreeBSD
if [ "$(uname)" = "FreeBSD" ]; then
  echo "Detected FreeBSD. Installing Node.js version $VERSION using pkg..."

  # Update the package repository
  sudo pkg update

  # Search and install the requested Node.js version
  if ! sudo pkg install -y "node$VERSION" "npm-node$VERSION"; then
    echo "Error: Failed to install Node.js version $VERSION via pkg."
    exit 1
  fi

  echo "Node.js version $VERSION installed successfully on FreeBSD."
else
  # Download and install nvm
  if ! command -v nvm &>/dev/null; then
    echo "Not a FreeBSD system. Installing nvm and using it to install Node.js..."

    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

    # Load nvm into the current shell session
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 
  fi

  # Install the requested Node.js version using nvm
  nvm install "$VERSION"

  echo "Node.js version $VERSION installed successfully using nvm."
fi

