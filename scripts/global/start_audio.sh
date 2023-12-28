#!/usr/bin/env bash

# Get the platform using Node.js
node=$(command -v node.exe)
PLATFORM_IS=$("$node" -p "process.platform")

# Check for PulseAudio only if not on Windows
if [[ $PLATFORM_IS != win* ]] && ! command -v pulseaudio &>/dev/null; then
  echo "Sorry, we are not on Windows and PulseAudio is not installed. Audio will not work." >&2
  echo "Therefore, we will not try the audio service." >&2
  echo "Exiting..." >&2
  exit 0
fi

if [[ -z "${BB_POOL}" ]] || [[ $PLATFORM_IS == win* ]]; then
  if [[ $PLATFORM_IS == win* ]]; then
    . "$1"
    pwsh=$(command -v pwsh || command -v powershell)
    $pwsh -Command "taskkill /F /IM $AUDIO_PORT"
    ./src/services/instance/parec-server/parec-server.sh "$1"
  else 
    ./scripts/global/parec-server.sh "$1"
  fi
else
  sudo -g browsers ./scripts/global/parec-server.sh "$1"
fi

