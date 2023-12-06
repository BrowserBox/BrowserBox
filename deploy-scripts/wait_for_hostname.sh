#!/bin/bash

hostname=$1
timeout=19 # Timeout in seconds (e.g., 900 seconds = 15 minutes)
interval=10 # Interval in seconds to check the hostname

if [[ -z "$hostname" ]]; then
  echo "Requires hostname as first argument" >&2
  exit 1
fi

elapsed=0
while true; do
  if host "$hostname" > /dev/null 2>&1; then
    echo "Hostname resolved: $hostname" >&2
    exit 0
  else
    echo "Waiting for hostname to resolve..." >&2
    sleep "$interval"
    elapsed=$((elapsed + interval))
    if [ "$elapsed" -ge "$timeout" ]; then
      echo "Timeout reached. Hostname not resolved: $hostname" >&2 
      exit 1
    fi
  fi
done

