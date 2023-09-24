#!/usr/bin/env bash

set -x

# Wrapper script to run another script with its arguments
# If on macOS and running under Rosetta, switch to native arm64

# Function to get the platform
get_platform() {
  uname_str=$(uname -s)
  case "${uname_str}" in
      Linux*)     echo "Linux";;
      Darwin*)    echo "Mac";;
      *)          echo "Unknown";;
  esac
}

# Function to check if running under Rosetta on macOS
is_rosetta() {
  if [[ $(arch) == "i386" ]]; then
    return 0  # True, is Rosetta
  else
    return 1  # False, is not Rosetta
  fi
}

# Main part of the script

# Check platform
platform=$(get_platform)

# Original script and its arguments
original_script="$1"
shift  # Remove the first argument to get only the remaining arguments

if [[ "${platform}" != "Mac" ]]; then
  # If not on macOS, just execute the original script with its arguments
  "${original_script}" "$@"
else
  # If on macOS
  bash_location=$(command -v bash)
  if is_rosetta; then
    echo "Rosetta on Mac so executing with right arch" >&2
    # If running under Rosetta, switch to arm64
    arch -arm64 "${bash_location}" -c "source $HOME/.bashrc; source $HOME/.profile; \"${original_script}\" \"$@\""
  else
    # Otherwise, run normally
    "${original_script}" "$@"
  fi
fi

