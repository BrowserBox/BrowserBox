#!/usr/bin/env bash

# Check if the directory is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <directory>"
  exit 1
fi

# Check if the directory exists
if [ ! -d "$1" ]; then
  echo "Error: Directory '$1' doesn't exist."
  exit 1
fi

# Check if inotify-tools is installed
if ! command -v inotifywait &> /dev/null; then
  echo "Error: inotifywait could not be found. Attempting to install..."
  sudo $APT install inotify-tools
  if ! command -v inotifywait &> /dev/null; then
    echo "Error: failed to install inotify-tools. Please install manually."
    exit 1
  fi
fi

# Watch the directory
echo "Watching directory: $1"
inotifywait -m -r -e create,delete --format '%w %e %f' "$1" | while read DIR EVENT FILE; do
  echo "Event detected:"
  echo "  Directory: $DIR"
  echo "  Event: $EVENT"
  echo "  File: $FILE"
done

