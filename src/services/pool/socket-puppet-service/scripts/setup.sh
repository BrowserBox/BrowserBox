#!/usr/bin/env bash


function add_sudoers {
dest=/etc/sudoers.d/sudoers-001
t1=$(mktemp)
trap 'rm -f "$t1"' RETURN
if sudo grep -R "%sudoers" /etc/sudoers.d/*; then
  echo "sudoers group already enabled with sudo"
else 
  echo "%sudoers ALL=(ALL) NOPASSWD:ALL" > $t1
  if sudo visudo -c -q -f $t1; then
    sudo cp $t1 $dest
    sudo chmod 0440 $dest
  else
    echo "Invalid sudoers temp file"
    cat $1
    exit 1
  fi
fi
}

function ibbpro {
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi

BRANCH=$1
DOMAIN=$2

if [[ -z "$BRANCH" ]]; then
  echo "Supply branch as first argument"
  return 1
fi
echo "Updating system"
sudo apt update && apt -y upgrade

echo "Installing base tools"
sudo apt install git curl wget psmisc moreutils

echo "Creating user"
addgroup browsers
addgroup appusers
addgroup sudoers
update-alternatives --set editor $(which vim.basic)

adduser cris
usermod --lock cris
usermod -aG appusers,browsers,sudoers cris
cd /home/cris
sudo -u cris mkdir -p .ssh/
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIM1YUqFiCPt1GGpP9gwqxYV+T7zXVbiKpGhQphEFY+mB cris
" > /home/cris/.ssh/authorized_keys
echo "-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBDqEQovxAUrz0WmyrMErrRRoTr/9tzDNicIJu0rulv8gAAAJi3B59Xtwef
VwAAAAtzc2gtZWQyNTUxOQAAACBDqEQovxAUrz0WmyrMErrRRoTr/9tzDNicIJu0rulv8g
AAAECCL1AjvvjHWKIuDRz57Jz8hWz4669z8pM2KQ/R+b1lj0OoRCi/EBSvPRabKswSutFG
hOv/23MM2Jwgm7Su6W/yAAAADmNyaXNAbG9jYWxob3N0AQIDBAUGBw==
-----END OPENSSH PRIVATE KEY-----
" > /home/cris/.ssh/id_ed25519
echo "|1|1IElE0ImS9gaD3DGEfD2UZsbMvM=|tluVpWI2qzGwT980f9Fpgk+4LUw= ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBEmKSENjQEezOmxkZMy7opKgwFB9nkt5YRrYMjNuG5N87uRgg6CLrbo5wAdT/y6v0mKV0U2w0WZ2YB/++Tpockg=
|1|8b2k5bFiuWqv5GS9UyrqFkYWXuk=|psxT1RinEmdQq39ynEZ2NrENXKU= ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBEmKSENjQEezOmxkZMy7opKgwFB9nkt5YRrYMjNuG5N87uRgg6CLrbo5wAdT/y6v0mKV0U2w0WZ2YB/++Tpockg=
|1|3fDLFmxvuVyNzpNpJLhHA5l73J0=|WaRfATasBLlfTlKB8dNhcX4BBtY= ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBEmKSENjQEezOmxkZMy7opKgwFB9nkt5YRrYMjNuG5N87uRgg6CLrbo5wAdT/y6v0mKV0U2w0WZ2YB/++Tpockg=
|1|QyAPCaqmfXkNkWbsrU8fNobZ0u8=|efDfj62bQ5hMm632rEbtwTVXNho= ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBEmKSENjQEezOmxkZMy7opKgwFB9nkt5YRrYMjNuG5N87uRgg6CLrbo5wAdT/y6v0mKV0U2w0WZ2YB/++Tpockg=
|1|ZUD9ZFZDA27fk79ytmoDM1pgw2o=|kdK7Da3jQYcUA83vKElY0GeKWrw= ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBFSMqzJeV9rUzU4kWitGjeR4PWSa29SPqJ1fVkhtj3Hw9xjLVXVYrU9QlYWrOLXBpQ6KWjbjTDTdDkoohFzgbEY=
|1|PH2D3q9/jq/HlmOfyLEzX43Yjpo=|U0JO8tucfzsZi0x4Z/nDHJn/VS8= ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBFSMqzJeV9rUzU4kWitGjeR4PWSa29SPqJ1fVkhtj3Hw9xjLVXVYrU9QlYWrOLXBpQ6KWjbjTDTdDkoohFzgbEY=
" > /home/cris/.ssh/known_hosts
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEOoRCi/EBSvPRabKswSutFGhOv/23MM2Jwgm7Su6W/y cris@localhost
" > /home/cris/.ssh/id_ed25519.pub

read -p "Enter to continue to install environment"
sudo -i -u cris bash <<EOF
yes | git clone git@github.com:crisdosyago/environments.git
cd environments
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

read -p "Enter to continue to install socket-puppet-frontend"
sudo -i -u cris bash <<EOF
source .profile
source .nvm/nvm.sh
yes | gclone git@github.com:crisdosyago/socket-puppet-landing.git
cd socket-puppet-landing
gbranch $BRANCH
yes | npm i
cd ..
EOF

read -p "Enter to continue to install socket-puppet-service"
sudo -i -u cris bash <<EOF
source .profile
source .nvm/nvm.sh
yes | gclone git@github.com:crisdosyago/socket-puppet-service.git
cd socket-puppet-service
gbranch $BRANCH
yes | npm i
cd ..
EOF
}


ibbpro $1 $2
