#!/bin/bash

provider="https://secureview.isolation.site/very-secure-manifest-convert"
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

cd /home/$username/browser-downloads/

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

file=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 13)
curl -s -F secret="$secret" -F pdf=@"$filename" $provider > $file
echo $(cat $file)
rm $file
#curl -s -F pdf=@"$filename" $provider

