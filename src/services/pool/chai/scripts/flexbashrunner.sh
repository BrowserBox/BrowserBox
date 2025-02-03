#!/usr/bin/env bash

#set -x

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

file_checks() {
  file_path="$1"
  # Check file size (assuming file size is in bytes)
  file_size=$(stat -c "%s" "${file_path}") # For Linux
  [[ "$(get_platform)" == "Mac" ]] && file_size=$(stat -f "%z" "${file_path}") # For macOS

  if [[ ${file_size} -gt 104857600 ]]; then  # 100MB = 104857600 bytes
    echo "File is larger than 100MB. Exiting." >&2
    exit 1 
  fi

  # Check file type based on extension
  file_ext="${file_path##*.}"
  disallowed_types=("exe" "com" "apk" "deb" "rpm" "msi" "dmg" "jar" "iso" "bin")
  for ext in "${disallowed_types[@]}"; do
    if [[ "${file_ext}" == "${ext}" ]]; then
      echo "File type ${file_ext} is not allowed. Exiting." >&2
      exit 1
    fi
  done
}

# Main part of the script

# Check platform
platform=$(get_platform)

# Original script and its arguments
original_script="$1"
shift  # Remove the first argument to get only the remaining arguments

# We do these checks in the calling node process now
# file_checks "$1"

if [[ "${platform}" != "Mac" ]]; then
  # If not on macOS, just execute the original script with its arguments
  "${original_script}" "$1" "$2" "$3"
else
  # If on macOS
  bash_location=$(command -v bash)
  if is_rosetta; then
    echo "Rosetta on Mac so executing with right arch" >&2
    # If running under Rosetta, switch to arm64
    arch -arm64 "${bash_location}" -c "source $HOME/.bashrc; source $HOME/.profile; \"${original_script}\" \"$1\" \"$2\" \"$3\""
  else
    # Otherwise, run normally
    "${original_script}" "$1" "$2" "$3"
  fi
fi

