#!/usr/bin/env bash

# Function to show usage
usage() {
  echo "Usage: $0 <extension_name> <extension_id>" >&2
  echo "Example: $0 google-translate aapbdbdomjkkjkaonfhkkikfgjllcleb" >&2
  exit 1
}

# Check if both extension name and ID are provided
if [ "$#" -ne 2 ]; then
  usage
fi

EXT_NAME=$1
EXT_ID=$2

# Determine the OS
OS="$(uname -s)"

# Set the Chrome user extension directory based on the OS
case "$OS" in
  Darwin) # macOS
    EXT_DIR="$HOME/Library/Application Support/Google/Chrome/External Extensions"
    ;;
  Linux)
    if [ -f /etc/redhat-release ]; then
      EXT_DIR="$HOME/.config/google-chrome/External Extensions" # RHEL/CentOS
    else
      EXT_DIR="$HOME/.config/google-chrome/External Extensions" # Ubuntu/Debian
    fi
    ;;
  *)
    echo "Unsupported OS: $OS" >&2
    exit 1
    ;;
esac

# Ensure the directory exists for the current user
if [[ ! -d "$EXT_DIR" ]]; then
  echo "Creating Chrome External Extensions directory at $EXT_DIR..." >&2
  mkdir -p "$EXT_DIR"
fi

# Create the JSON file with the extension's update URL
EXT_JSON_PATH="${EXT_DIR}/${EXT_ID}.json"
echo '{"external_update_url": "https://clients2.google.com/service/update2/crx"}' > "$EXT_JSON_PATH"

# Verify the installation
if [ -f "$EXT_JSON_PATH" ]; then
  echo "$EXT_NAME $EXT_ID" # Only this line is output to stdout if success
else
  echo "Failed to install the extension $EXT_NAME." >&2
  exit 1
fi

