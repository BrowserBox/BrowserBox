#!/usr/bin/env bash

INSTALL_DIR="${1:-$(pwd)}"
SUDO=""
COMMAND_DIR=""

if [[ -f ~/.nvm/nvm.sh ]]; then
  source ~/.nvm/nvm.sh
fi

if command -v sudo &> /dev/null; then
  SUDO="sudo -n"
fi

# Check if /usr/local/bin is in the PATH and is writable
if [[ ":$PATH:" == *":/usr/local/bin:"* ]] && $SUDO test -w /usr/local/bin; then
  COMMAND_DIR="/usr/local/bin"
  $SUDO mkdir -p $COMMAND_DIR
elif $SUDO test -w /usr/bin; then
  COMMAND_DIR="/usr/bin"
  $SUDO mkdir -p $COMMAND_DIR
else
  COMMAND_DIR="$HOME/.local/bin"
  mkdir -p $COMMAND_DIR
fi

# Function to check and install rsync
ensure_rsync() {
  if command -v rsync &> /dev/null; then
    echo "rsync is already installed." >&2
    return 0
  fi

  echo "rsync not found, attempting to install..." >&2
  if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    case "$ID" in
      ubuntu|debian)
        $SUDO apt-get update && $SUDO apt-get install -y rsync || {
          echo "ERROR: Failed to install rsync on $ID!" >&2
          exit 1
        }
        ;;
      fedora)
        $SUDO dnf install -y rsync || {
          echo "ERROR: Failed to install rsync on $ID!" >&2
          exit 1
        }
        ;;
      centos|rhel)
        $SUDO yum install -y rsync || {
          echo "ERROR: Failed to install rsync on $ID!" >&2
          exit 1
        }
        ;;
      *)
        echo "ERROR: Unsupported Linux distro ($ID) - please install rsync manually!" >&2
        exit 1
        ;;
    esac
  elif [[ "$(uname)" == "Darwin" ]]; then
    if command -v brew &> /dev/null; then
      brew install rsync || {
        echo "ERROR: Failed to install rsync via Homebrew!" >&2
        exit 1
      }
    else
      echo "ERROR: Homebrew not found - please install rsync manually on macOS!" >&2
      exit 1
    }
  else
    echo "ERROR: Unsupported OS - please install rsync manually!" >&2
    exit 1
  fi
  echo "rsync installed successfully!" >&2
}

# Ensure rsync is available before proceeding
ensure_rsync

echo "INSTALL_DIR: $INSTALL_DIR"
echo -n "Copying bbpro application files to /usr/local/share/dosyago/ ..."

# Ensure the destination directory exists
$SUDO mkdir -p /usr/local/share/dosyago

# Use rsync to copy files and delete anything in destination not in source
$SUDO rsync -a --delete "$INSTALL_DIR/" "/usr/local/share/dosyago/$INSTALL_NAME/"
INSTALL_NAME=$(basename "$INSTALL_DIR")

# Remove .git directory if it exists in the destination
$SUDO rm -rf "/usr/local/share/dosyago/$INSTALL_NAME/.git"

echo "Copied and synchronized!"

echo -n "Setting correct permissions for installation ..."

$SUDO chmod -R 755 "/usr/local/share/dosyago/"*

echo "Permissions set!"

cd "$INSTALL_DIR"

./deploy-scripts/cp_commands_only.sh
