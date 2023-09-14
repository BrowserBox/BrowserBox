#!/bin/bash

provider="https://${DOMAIN}:${DOCS_PORT}/very-secure-manifest-convert"

username=$1
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
cd /home/$username/.config/dosyago/bbpro/browser-downloads/

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
curl -F secret="$secret" -F pdf=@"$filename" $provider > $file
stdbuf --output=0 echo $(cat $file)
rm $file
#curl -s -F pdf=@"$filename" $provider

