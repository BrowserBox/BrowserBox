#!/bin/bash

username="$1"
group="appusers"
appgroup="$2"
password="$3"

groupadd --force $group
groupadd --force $appgroup

if su -c "useradd $username -s /usr/sbin/nologin -m -g $group -G $appgroup"; then
  ./scripts/users/force_change_password.sh $username $password
else
  echo "Could not create user"
  exit 1
fi

