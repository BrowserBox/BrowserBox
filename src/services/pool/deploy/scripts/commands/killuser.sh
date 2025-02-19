#!/usr/bin/env bash

# check if running with sudo privileges and exit if not
if [ $(id -u) != 0 ]
then
    # Script is not running with sudo privileges
    echo "This script must be run with sudo privileges"
    exit 1
fi

# Set the username of the user to delete
username="$1"
filesystem=$(mount | grep " on / " | awk '{print $1}')

if [ -z "$username" ]; then
  echo "Username argument required"
  exit 1
fi

sudo -u $username pm2 kill
sudo -u $username pulseaudio -k
pkill -u $username

# Check if any processes belonging to the user are still running
processes=$(ps -u $username | wc -l)

# If any processes are still running, send a SIGKILL signal to force them to terminate
if [ $processes -gt 0 ]
then
    pkill -KILL -u $username
fi

# Turn off quotas for the user
setquota -u $username 0 0 0 0 $filesystem

# Delete the user and their home directory
userdel -r -f $username
