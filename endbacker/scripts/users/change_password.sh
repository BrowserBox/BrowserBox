#!/bin/bash

username="$1"
password="$2"
new_password="$3"

hash=$(echo $new_password | openssl passwd -1 -stdin)

if ./../authin/auth_as.rb $username $password ; then
  usermod --pass="$hash" $username
else
  echo "Invalid password"
  exit 1
fi

