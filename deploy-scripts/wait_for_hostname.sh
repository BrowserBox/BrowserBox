#!/bin/bash

hostname=$1
timeout=900 # Timeout in seconds (e.g., 900 seconds = 15 minutes)
interval=10 # Interval in seconds to check the hostname

flush_dns() {
  case "$(uname -s)" in
    Linux*)
      # For Linux systems
      if command -v systemd-resolve &>/dev/null; then
        sudo systemd-resolve --flush-caches
      elif command -v service &>/dev/null && service nscd status; then
        sudo service nscd restart
      elif command -v systemctl &>/dev/null && systemctl is-active --quiet dnsmasq; then
        sudo systemctl restart dnsmasq
      else
        echo "DNS flushing method not found for this Linux distribution"
      fi
      ;;
    Darwin*)
      # For macOS
      sudo killall -HUP mDNSResponder
      ;;
    CYGWIN*|MINGW32*|MSYS*|MINGW*)
      # For Windows using Git Bash or similar
      ipconfig /flushdns
      ;;
    *)
      echo "Operating system not supported"
      ;;
  esac
}

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
    flush_dns
    sleep "$interval"
    elapsed=$((elapsed + interval))
    if [ "$elapsed" -ge "$timeout" ]; then
      echo "Timeout reached. Hostname not resolved: $hostname" >&2 
      exit 1
    fi
  fi
done

