#!/usr/bin/env bash

set -e

# check if running with sudo privileges and exit if not
if [ $(id -u) != 0 ]
then
  # Script is not running with sudo privileges
  echo "This script must be run with sudo privileges"
  exit 1
fi

# Generate a random string
random_string=$(LC_ALL=C tr -dc 'a-zA-Z0-9' </dev/urandom | head -c 8 ; echo)

# Set the username to "user" followed by the random string
username="user$random_string"

if [ -z "$1" ]; then
  username="user$random_string"
else
  username="$1"
fi


if id -u $username > /dev/null 2>&1
then
  # User exists
  echo "User $username exists" >&2
  exit 1
else
  # User does not exist
  echo "User $username does not exist. Creating..." >&2
fi

filesystem=$(mount | grep " on / " | awk '{print $1}')

# Generate a random password
password=$(LC_ALL=C tr -dc 'a-zA-Z0-9' </dev/urandom | head -c 16 ; echo)

# Create the user
useradd -m -s /usr/sbin/nologin $username >&2


# Set the password for the user
echo "$username:$password" | chpasswd >&2

# Set the user's password to expire
chage -d 0 $username >&2

# Lock the user account
usermod -L $username >&2

# Add the user to the "renice" group
usermod -a -G renice $username >&2

quota_limit=5000000000

# Set the quota limit for the user
setquota -u $username -p quotauser $filesystem >&2

# Enable linger
loginctl enable-linger $username >&2

userhome=$(sudo -u $username bash -c 'cd $HOME; pwd')

sudo mkdir -p $userhome/sslcerts >&2
sudo rm -rf $userhome/sslcerts/* >&2
sudo cp -f /usr/local/share/dosyago/sslcerts/* $userhome/sslcerts >&2
sudo chown -R $username:$username $userhome/sslcerts >&2
sudo chmod 500 $userhome/sslcerts/* >&2

echo "User $username has been created with a temporary password. The password will expire on the next login and the user account is locked. The user is also a member of the 'renice' group, which has sudo access to the 'renice' command. Their disk quota has been set to 5GB, and long running (linger) processes have been enabled." >&2

echo $username
