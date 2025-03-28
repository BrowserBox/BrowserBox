#!/usr/bin/env bash

if [[ -f ~/.config/dosyago/bbpro/test.env ]]; then
  source ~/.config/dosyago/bbpro/test.env
fi

# Define the path to the SSL certificates
ssl_dir="${SSLCERTS_DIR:-"${HOME}/sslcerts"}"

output=""

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

# Check if the SSL certificates exist
if [[ -f "$ssl_dir/privkey.pem" && -f "$ssl_dir/fullchain.pem" ]]; then
  # Extract the Common Name (hostname) from the certificate
  hostname=$(openssl x509 -in "${ssl_dir}/fullchain.pem" -noout -text | grep -A1 "Subject Alternative Name" | tail -n1 | sed 's/DNS://g; s/, /\n/g' | head -n1 | awk '{$1=$1};1')
  echo "Hostname: $hostname" >&2
  output="$hostname"
else
  # Get the IP address (you can also use other methods to get the IP)
  ip_address=$(get_external_ip)
  echo "IP Address: $ip_address" >&2
  output="$ip_address"
fi

echo "$output"

