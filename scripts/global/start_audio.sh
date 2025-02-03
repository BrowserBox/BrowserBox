#!/usr/bin/env bash

# Get the platform using Node.js (for Windows only)
node="$(command -v node.exe)"
PLATFORM_IS=$("$node" -p "process.platform")

# Check for PulseAudio only if not on Windows
if [[ $PLATFORM_IS == win* ]]; then
	echo "Windows"
  #if ! command -v pulseaudio.exe &>/dev/null; then
  #  echo "Sorry, PulseAudio for Windows by Patrick Gaskin is not installed. Audio will not work." >&2
  #  echo "(ensure you add the PulseAudio bin\ directory to the system path)" >&2
  #  echo "Therefore, we will not try the audio service." >&2
  #  echo "Exiting..." >&2
  #  exit 1
  #fi
else 
  if ! command -v pulseaudio &>/dev/null; then
    echo "Sorry, PulseAudio is not installed. Audio will not work." >&2
    echo "Therefore, we will not try the audio service." >&2
    echo "Exiting..." >&2
    exit 1
  fi
fi

if [[ -z "${BB_POOL}" ]] || [[ $PLATFORM_IS == win* ]]; then
  if [[ $PLATFORM_IS == win* ]]; then
    . "$1"
    pwsh="$(command -v pwsh || command -v powershell)"
    "$pwsh" -Command "taskkill /F /IM $AUDIO_PORT"
    exec ./src/services/instance/parec-server/parec-server.sh "$1"
  else 
    exec ./scripts/global/parec-server.sh "$1"
  fi
else
  exec sudo -g browsers ./scripts/global/parec-server.sh "$1"
fi

