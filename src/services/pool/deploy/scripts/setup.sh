#!/usr/bin/env bash

if which node; then
  echo "node installed"
else
  curl -fsSL https://deb.nodesource.com/setup_19.x | sudo -E bash - 
  sudo apt-get install -y nodejs
fi

sudo which pm2 || bash -c "sudo npm i -g pm2@latest"

echo -n "Set up quota user to have 5G 5G and 2m 2m block and inode limit."
read -p " Enter to continue "
sudo cp ./scripts/commands/* /usr/local/bin/

# Edit the sudoers file to allow members of the "renice" group to run the "renice" command
if ! sudo grep -q "%renice ALL=(ALL) NOPASSWD:" /etc/sudoers;
then
  sudo groupadd renice >&2
  echo "%renice ALL=NOPASSWD: /usr/bin/renice, /usr/bin/loginctl, /usr/bin/id" | sudo tee -a /etc/sudoers >&2
fi

sudo ./scripts/commands/newuser.sh quotauser

