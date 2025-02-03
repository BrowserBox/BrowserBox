#!/usr/bin/env bash

set -x

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


if [[ -n "${TORBB}" ]]; then
  output="localhost"
fi

# we don't need to change this for tor because even if we did curl and node fetch for example
# cannot call onion addresses hahaha 
provider="https://${output}:${DOCS_PORT}/very-secure-manifest-convert"

echo "provider: $provider" >&2

username=$(whoami)
filename=$2
secret=$3
downloading="crdownload"
maxwaitsteps=30
waitstepseconds=3
step=0

#groups=$(grep '^Groups' /proc/$$/status)
#echo $groups > ./file_transfer_groups

echo $username $filename >> $HOME/dl.log.txt

# would be good to get this programmatically (maybe node -p "some node script to get the value from common.js"?)
cd $HOME/.config/dosyago/bbpro/browser-downloads/

while [ $step -lt $maxwaitsteps ]; do
  if [ -f "$filename.$downloading" ]; then
    sleep $waitstepseconds 
  fi
  if [ -f "$filename" ]; then
    break
  fi
  sleep $waitstepseconds
  let step=step+1
done

file=$(LC_ALL=C head /dev/urandom | tr -dc A-Za-z0-9 | head -c 13 ; echo)
curl -s -k -F secret="$secret" -F pdf=@'"'"$filename"'"' $provider > $file
# echo the file without buffering so node's child_process definitely gets it
stdbuf --output=0 echo $(cat $file)
rm $file

