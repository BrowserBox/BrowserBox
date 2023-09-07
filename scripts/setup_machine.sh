#!/bin/bash

sudo apt install -y apt-utils wget curl jq unzip bc psmisc psutils
cd src/zombie-lord
sudo ./video.deps
sudo ./audio.deps
sudo ./deb.deps
sudo ./font.deps
sudo ./pptr.deps
sudo ./dlchrome.sh
if which google-chrome-stable; then
	echo "chrome installed"
else
	echo "chrome failed to install. you need to run setup again"
	exit 1
fi
cd ../..
sudo apt install -y libvips libjpeg-dev
./scripts/install_bundle_deps.sh
./scripts/install_global_bundle_deps.sh
sudo ./scripts/install_webp.sh
sudo ./scripts/audio_setup.sh

echo Installing audio config to /etc/pulse/
sudo cp -r src/services/instance/parec-server/pulse/* /etc/pulse/
mkdir -p ~/.config/pulse/
sudo cp -r src/services/instance/parec-server/pulse/* ~/.config/pulse/ 
sudo loginctl enable-linger
sudo mkdir -p /usr/local/lib/systemd/logind.conf.d
sudo echo "KillUserProcesses=no" > /usr/local/lib/systemd/logind.conf.d/nokill.conf

sudo groupadd browsers
sudo groupadd scripters
# Edit the sudoers file to allow members of the "renice" group to run the "renice" command
if ! sudo grep -q "%renice ALL=(ALL) NOPASSWD:" /etc/sudoers;
then
  sudo groupadd renice >&2
  echo "%renice ALL=NOPASSWD: /usr/bin/renice, /usr/bin/loginctl, /usr/bin/id" | sudo tee -a /etc/sudoers >&2
fi


sudo ufw disable
which pm2 || npm i -g pm2@latest || sudo npm i -g pm2@latest
sudo setcap 'cap_net_bind_service=+ep' $(which node)
