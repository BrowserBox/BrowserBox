#!/bin/bash

hostname=$1
timeout=3600 # Timeout in seconds (e.g., 3600 seconds = 1 hour to set up your DNS)
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

#!/bin/bash

# Function to get the current external IPv4 address
get_external_ip() {
  local ip

  # List of services to try
  local services=(
    "https://icanhazip.com"
    "https://ifconfig.me"
    "https://api.ipify.org"
  )

  # Try each service in turn
  for service in "${services[@]}"; do
    ip=$(curl -4s --connect-timeout 5 "$service")
    if [[ -n "$ip" ]]; then
      echo "$ip"
      return
    fi
  done

  echo "Failed to obtain external IP address" >&2
  return 1
}

# Check if hostname is provided
if [[ -z "$hostname" ]]; then
  echo "Requires hostname as first argument" >&2
  exit 1
fi

external_ip=$(get_external_ip)
if [[ -z "$external_ip" ]]; then
  echo "Failed to obtain external IP address" >&2
  exit 1
fi

elapsed=0
while true; do
  resolved_ip=$(dig +short "$hostname" @8.8.8.8) # Using Google's DNS for resolution
  if [[ "$resolved_ip" == "$external_ip" ]]; then
    echo "Hostname resolved to current IP: $hostname -> $resolved_ip" >&2
    exit 0
  else
    echo "Waiting for hostname to resolve to current IP ($external_ip)..." >&2
    flush_dns
    sleep "$interval"
    elapsed=$((elapsed + interval))
    if [ "$elapsed" -ge "$timeout" ]; then
      echo "Timeout reached. Hostname not resolved or not matching current IP: $hostname" >&2
      exit 1
    fi
  fi
done

