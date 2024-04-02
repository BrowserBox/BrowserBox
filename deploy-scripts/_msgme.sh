#!/bin/bash

# Function to show usage information
show_usage() {
  echo "Usage: $0 <username> <message>"
  echo "Writes a message to a user's notices and signals their app to display it."
}

# Ensure we have the correct number of arguments
if [[ $# -ne 2 ]]; then
  show_usage >&2
  exit 1
fi

USERNAME="$1"
MESSAGE="$2"
NOTICES_PATH="/home/$USERNAME/.config/dosyago/bbpro/notices/text"
PID_FILE_PATH="/home/$USERNAME/.config/dosyago/bbpro/app-\$PORT.pd"
LOGIN_LINK_FILE="/home/$USERNAME/.config/dosyago/bbpro/login.link"

# Check for root or sudo access if the script user is not the target user
if [[ $USERNAME != "$(whoami)" ]]; then
  if [[ $EUID -ne 0 ]]; then
    if ! sudo -n true &>/dev/null; then
      echo "This script requires being root (or having passwordless sudo capability) to write messages for other users." >&2
      exit 2
    fi
  fi
fi

# Write the message
echo "$MESSAGE" > "$NOTICES_PATH" 2>/dev/null || { echo "Failed to write message. Check permissions and user existence." >&2; exit 3; }

# Extract port and update PID_FILE_PATH
PORT=$(grep -Po '(?<=://)[^:/]+' "$LOGIN_LINK_FILE" | cut -d':' -f2) 2>/dev/null
if [[ -z "$PORT" ]]; then
  echo "Failed to extract port from login link." >&2
  exit 4
fi

PID_FILE_PATH=${PID_FILE_PATH/\$PORT/$PORT}

# Read the PID
PID=$(cat "$PID_FILE_PATH" 2>/dev/null)
if [[ -z "$PID" ]]; then
  echo "Failed to read PID from $PID_FILE_PATH. Check if the app is running." >&2
  exit 5
fi

# Send SIGPIPE to the process
kill -SIGPIPE "$PID" 2>/dev/null || { echo "Failed to send SIGPIPE to process $PID. Check permissions and if the process exists." >&2; exit 6; }

echo "Message delivered successfully to $USERNAME." >&2

