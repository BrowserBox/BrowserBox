#!/bin/sh

count=$1
#IFS=$'\n';
base=https://$(./scripts/get_hostname.sh)/uploads/

if [ -z $count ]; then
  count=10
fi

for file in $(ls -t file*html | head -$count); do
  echo $base$file;
done;
 


