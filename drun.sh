#!/bin/bash

# Source NVM to ensure Node.js is available
source ~/.nvm/nvm.sh

# Start BrowserBox
echo "Starting BrowserBox..."
echo "$(setup_bbpro --port ${PORT:-8080})" > login_link.txt
export LICENSE_KEY="${LICENSE_KEY}"
bbcertify
export LICENSE_KEY=""
bbpro

# Store the bbpro PID
BBPRO_PID="$(pgrep -x browserbox)"

# Define shutdown function
shutdown() {
  echo "Shutting down BrowserBox..."
  stop_bbpro  # Call stop_bbpro to release the license
  timeout 8 wait "$BBPRO_PID" 2>/dev/null # Wait for it to fully stop
  echo "BrowserBox stopped."
  exit 0
}

# Trap SIGTERM and SIGINT signals to trigger shutdown
trap 'shutdown' SIGTERM SIGINT

# Keep container running by waiting on the bbpro process
wait "$BBPRO_PID"
