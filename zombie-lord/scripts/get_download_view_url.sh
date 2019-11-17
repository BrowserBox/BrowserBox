#!/bin/bash

provider="https://secureview.cloudbrowser.xyz/very-secure-manifest-convert"
username=$1
filename=$2

#groups=$(grep '^Groups' /proc/$$/status)
#echo $groups > ./file_transfer_groups

cd /home/$username/browser-downloads/
file=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 13)
curl -F pdf=@"$filename" $provider > $file
cat $file
rm $file

