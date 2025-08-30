#!/usr/bin/env bash

# Kill existing processes
bbx stop

export WIN9X_COMPATIBILITY_MODE="true"
export BBX_DONT_KILL_CHROME_ON_STOP="true"

#bbx run
npm test >&2

echo "Waiting for server..." >&2
sleep 8

# Extract current login link
ll="$(cat ~/.config/dosyago/bbpro/login.link)"

# Extract port and path from login link
port="$(echo "$ll" | sed -E 's|https?://[^:/]+:([0-9]+).*|\1|')"
rest="$(echo "$ll" | sed -E 's|https?://[^/]+(/.*)|\1|')"

# Replace /login? with /win9x/? in the path
rest="$(echo "$rest" | sed 's|/login?|/win9x/?|')"

# Function to test if an IP is reachable on the given port
test_ip() {
  local ip=$1
  local port=$2
  # Use curl with a 2-second timeout to test HTTP connectivity
  if curl --silent --connect-timeout 2 "http://$ip:$port" &>/dev/null; then
    echo "$ip"
    return 0
  fi
  return 1
}

# Get all IPv4 addresses, excluding loopback initially
if command -v ip >/dev/null 2>&1; then
  # Linux: Use `ip addr show` to get IPv4 addresses
  IPS=$(ip addr show | grep 'inet ' | awk '{print $2}' | cut -d'/' -f1 | grep -v '^127\.0\.0\.1')
elif command -v ifconfig >/dev/null 2>&1; then
  # macOS/BSD: Use `ifconfig` to get IPv4 addresses
  IPS=$(ifconfig | grep 'inet ' | awk '{print $2}' | grep -v '^127\.0\.0\.1')
else
  echo "Could not determine local IP: neither 'ip' nor 'ifconfig' found" >&2
  exit 1
fi

# Append 127.0.0.1 last to prioritize LAN IPs
IPS="$IPS 127.0.0.1"

# Test each IP and use the first one that works
local_ip=""
for ip in $IPS; do
  if test_ip "$ip" "$port" &>/dev/null; then
    local_ip="$ip"
    break
  fi
done

# Check if we found a connectable IP
if [[ -z "$local_ip" ]]; then
  echo "No connectable IP found on port $port" >&2
  exit 1
fi

# Replace domain with connectable IP in login link
new_ll="http://${local_ip}:${port}${rest}"

echo "Win 9x/XP Compatibility Client Login Link:" >&2

echo "$new_ll"

# Optionally save the new link
# echo "$new_ll" > ~/.config/dosyago/bbpro/login.link
exit 0
