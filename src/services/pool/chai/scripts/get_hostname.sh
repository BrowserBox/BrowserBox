#!/bin/bash

# Define the path to the SSL certificates
ssl_dir="$HOME/sslcerts"

output=""

# Check if the SSL certificates exist
if [[ -f "$ssl_dir/privkey.pem" && -f "$ssl_dir/fullchain.pem" ]]; then
  # Extract the Common Name (hostname) from the certificate
  hostname=$(openssl x509 -in "${ssl_dir}/fullchain.pem" -noout -text | grep -A1 "Subject Alternative Name" | tail -n1 | sed 's/DNS://g; s/, /\n/g' | head -n1 | awk '{$1=$1};1')
  echo "Hostname: $hostname" >&2
  output="$hostname"
else
  # Get the IP address (you can also use other methods to get the IP)
  ip_address=$(hostname -I | awk '{print $1}')
  echo "IP Address: $ip_address" >&2
  output="$ip_address"
fi

echo "$output"

