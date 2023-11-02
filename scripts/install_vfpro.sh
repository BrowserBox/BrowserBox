#!/usr/bin/env bash

function ibbpro {
BRANCH=$1
DOMAIN=$2
if [[ -z "$BRANCH" ]]; then
  echo "Supply branch as first argument"
  return 1
fi
sudo $APT update && apt -y upgrade
sudo $APT install git curl wget psmisc moreutils
addgroup browsers
addgroup appusers
addgroup sudoers
update-alternatives --set editor $(which vim.basic)
echo "Add"
echo "%sudoers ALL=(ALL) NOPASSWD:ALL"
echo "to sudoers"
sleep 5

read -p "Enter to continue"

read | visudo

stty sane

adduser cris
usermod --lock cris
usermod -aG appusers,browsers,sudoers cris
cd /home/cris
sudo -u cris mkdir -p .ssh/
cp $HOME/.ssh/authorized_keys /home/cris/.ssh/authorized_keys
chown cris:cris /home/cris/.ssh/authorized_keys
sudo -i -u cris bash <<EOF
echo PWD $(pwd)
if ls .ssh/id_ed25519*; then
  echo "SSH key exists"
else 
  echo "
  
  
  " | ssh-keygen -t ed25519
fi
EOF
echo "add below above to GitHub and GitLab"
cat /home/cris/.ssh/id_ed25519.pub
read -p "Enter to confirm you have done this and continue to install the base environment"
sleep 1
sudo -i -u cris bash <<EOF
yes | git clone git@github.com:crisdosyago/environments.git
cd environments
./basic_setup
./debian_setup_node_server.sh $DOMAIN
cd ..
EOF

read -p "Enter to continue to install bbpro"
sudo -i -u cris bash <<EOF
source .profile
source .nvm/nvm.sh
yes | gclone git@github.com:crisdosyago/bbpro.git
cd bbpro
gbranch $BRANCH
yes | npm i
cd ..
EOF

read -p "Enter to continue to install paid-remote-browsers"
sudo -i -u cris bash <<EOF
source .profile
source .nvm/nvm.sh
yes | gclone git@gitlab.com:dosycorp/paid-remote-browsers.git
cd paid-remote-browsers
gbranch $BRANCH
yes | npm i
cd ..
EOF

read -p "Enter to continue to install free-remote-browsers"
sudo -i -u cris bash <<EOF
source .profile
source .nvm/nvm.sh
yes | gclone git@gitlab.com:dosycorp/free-remote-browsers.git
cd free-remote-browsers
gbranch $BRANCH
yes | npm i 
cd ..

EOF
echo "Your VFPRO machine is set up!"
}

ibbpro $1 $2
