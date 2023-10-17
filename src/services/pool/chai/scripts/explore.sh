#!/bin/bash

#set -euo pipefail

#set -x

IFS=$'\n\t'

# Cleanup and error message in case of unexpected errors
handle_error() {
  echo "An unexpected error occurred." >&2
  # Custom cleanup code here
  exit 1
}

trap 'handle_error' ERR

# Default environment variable values
: "${MAX_ARCHIVE_SIZE:=104857600}"
: "${MAX_EXECUTION_TIME:=30}"
: "${EXTRACTION_ROOT:=${CHAI_PATH}/archives}"

mkdir -p "$EXTRACTION_ROOT"

# Function to check and install required utilities
install_guard() {
  local utility_name="$1" 
  local install_name="${2:-$utility_name}"
  echo "install name: $install_name"
  if ! command -v "$utility_name" > /dev/null; then
    echo "Error: $utility_name is not installed. Installing..." >&2
    sudo apt install -y "$install_name"
    if ! command -v "$utility_name" > /dev/null; then
      echo "Error: Could not install $utility_name..." >&2
      exit 1
    fi
  fi
}

# Function to estimate uncompressed archive size for tar-based formats
estimate_uncompressed_size() {
  local archive_path="$1"
  echo $(tar -tvf "$archive_path" 2>/dev/null | awk '{total+=$3} END {print total}')
}

# Function to decompress an archive securely
decompress_anything() {
  local archive_path="$1"
  local mime_type="$2"
  local extraction_directory="$3"

  case "$mime_type" in
    "application/gzip")
      install_guard "gzip"
      gzip -t "$archive_path" || { echo "Error: Archive integrity check failed."; exit 1; }
      tar xzf "$archive_path" -C "$extraction_directory"
      ;;
    "application/x-bzip2")
      install_guard "bzip2"
      bzip2 -t "$archive_path" || { echo "Error: Archive integrity check failed."; exit 1; }
      tar xjf "$archive_path" -C "$extraction_directory"
      ;;
    "application/zip")
      install_guard "unzip"
      unzip -tq "$archive_path" || { echo "Error: Archive integrity check failed."; exit 1; }
      unzip -o -d "$extraction_directory" "$archive_path"
      ;;
    "application/x-xz")
      install_guard "xz"
      xz -t "$archive_path" || { echo "Error: Archive integrity check failed."; exit 1; }
      tar xJf "$archive_path" -C "$extraction_directory"
      ;;
    "application/x-lzma")
      install_guard "xz"
      xz -t "$archive_path" || { echo "Error: Archive integrity check failed."; exit 1; }
      tar --lzma -xf "$archive_path" -C "$extraction_directory"
      ;;
    "application/x-lz4")
      install_guard "lz4"
      lz4 -t "$archive_path" || { echo "Error: Archive integrity check failed."; exit 1; }
      tar --lz4 -xf "$archive_path" -C "$extraction_directory"
      ;;
    "application/x-rar")
      install_guard "unar"
      unrar t "$archive_path" >/dev/null 2>&1 || { echo "Error: Archive integrity check failed."; exit 1; }
      unrar x "$archive_path" "$extraction_directory"
      ;;
    "application/x-7z-compressed")
      install_guard "7z" "p7zip"
      7z t "$archive_path" >/dev/null 2>&1 || { echo "Error: Archive integrity check failed."; exit 1; }
      7z x "$archive_path" -o"$extraction_directory"
      ;;
    "application/x-tar")
      tar -tf "$archive_path" >/dev/null 2>&1 || { echo "Error: Archive integrity check failed."; exit 1; }
      tar xf "$archive_path" -C "$extraction_directory"
      ;;
    *)
      echo "Unsupported archive type: $mime_type"
      exit 1
      ;;
  esac
}

# Function to securely extract an archive
extract_securely() {
  local archive_path="$1"
  local file_name=$(basename "$archive_path")

  # Estimate the uncompressed size and exit if too large
  local estimated_size=$(estimate_uncompressed_size "$archive_path")
  if [[ "$estimated_size" -gt "$MAX_ARCHIVE_SIZE" ]]; then
    echo "Error: Estimated uncompressed size exceeds maximum limit." >&2
    exit 1
  fi

  # Get the UUID from the file name using awk
  local uuid=$(basename "$archive_path" | awk -F'.' '{gsub("file", "", $1); print $1}')
  local mime_type=$(file --mime-type -b "$archive_path")

  # Create a unique extraction directory for this UUID
  local extraction_directory="$EXTRACTION_ROOT/${file_name}/"
  mkdir -p "$extraction_directory"

  # Copy the original archive to the unique extraction directory
  cp "$archive_path" "$extraction_directory"

  # Start the decompression and catch timeout failures
  export -f decompress_anything
  export -f install_guard
  if ! timeout "$MAX_EXECUTION_TIME" bash -c "decompress_anything \"$archive_path\" \"$mime_type\" \"$extraction_directory\""; then
    echo "Error: Decompression operation timed out." >&2
    exit 1
  fi

  # Delete the original archive file and its copy
  rm "$extraction_directory/${file_name}"
  rm "$archive_path"

  # Echo the extraction directory for the calling application
  echo "$extraction_directory"
}

# Verify that an archive file argument is provided
if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <path_to_archive_file>" >&2
  exit 1
fi

# Call the secure extraction function
extract_securely "$1"

