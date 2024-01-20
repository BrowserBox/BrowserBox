#!/bin/bash

if [[ "$OSTYPE" == darwin* ]]; then
  echo "On macOS we don't need to run the setup_machine script. Exiting..." >&2
  exit 0
fi

if command -v dnf; then
  sudo $APT install -y wget curl jq unzip bc psmisc psutils tuned
else
  sudo $APT install -y apt-utils wget curl jq unzip bc psmisc psutils tuned
fi

source ~/.nvm/nvm.sh

cd src/zombie-lord
sudo -E ./video.deps
sudo -E ./audio.deps
sudo -E ./deb.deps
sudo -E ./font.deps
sudo -E ./pptr.deps
sudo -E ./dlchrome.sh
if which google-chrome-stable; then
	echo "chrome installed"
else
	echo "chrome failed to install. you need to run setup again"
	exit 1
fi
cd ../..
sudo $APT install -y libvips libjpeg-dev
./scripts/install_bundle_deps.sh
./scripts/install_global_bundle_deps.sh
sudo ./scripts/install_webp.sh
bash ./scripts/audio_setup.sh

echo Installing audio config to /etc/pulse/
sudo cp -r src/services/instance/parec-server/pulse/* /etc/pulse/
mkdir -p ~/.config/pulse/
cp -r src/services/instance/parec-server/pulse/* ~/.config/pulse/ 
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
