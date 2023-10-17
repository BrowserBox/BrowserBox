#!/bin/bash

output=""

# Define the path to the SSL certificates
ssl_dir="$HOME/sslcerts"

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

echo $username $filename >> ../dl.log.txt

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
curl -k -F secret="$secret" -F pdf=@"$filename" $provider > $file
stdbuf --output=0 echo $(cat $file)
rm $file
#curl -s -F pdf=@"$filename" $provider

