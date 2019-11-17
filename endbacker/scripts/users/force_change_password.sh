#!/bin/bash

username="$1"
new_password="$2"

hash=$(echo $new_password | openssl passwd -1 -stdin)

usermod --pass="$hash" $username

