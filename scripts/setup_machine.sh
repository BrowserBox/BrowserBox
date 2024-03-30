#!/bin/bash

#set -x 

SUDO=""
if command -v sudo &>/dev/null; then
  # we set -n here because setup_bbpro is designed to be used both non-interactively and by non-privileged users
  if sudo -n true &>/dev/null; then
    SUDO="sudo -n"
  else
    SUDO="sudo"
  fi
fi

if [[ "$OSTYPE" == darwin* ]]; then
  echo "On macOS we don't need to run the setup_machine script. Exiting..." >&2
  exit 0
fi

if command -v dnf &>/dev/null; then
  $SUDO $APT install -y wget curl jq unzip bc psmisc psutils tuned
else
  $SUDO $APT install -y apt-utils wget curl jq unzip bc psmisc psutils tuned
fi

source ~/.nvm/nvm.sh

cd src/zombie-lord
$SUDO -E ./video.deps
$SUDO -E ./audio.deps
$SUDO -E ./deb.deps
$SUDO -E ./font.deps
$SUDO -E ./pptr.deps
$SUDO -E ./dlchrome.sh
if which google-chrome-stable; then
	echo "chrome installed"
else
	echo "chrome failed to install. you need to run setup again"
	exit 1
fi
cd ../..
$SUDO $APT install -y libvips libjpeg-dev
./scripts/install_bundle_deps.sh
./scripts/install_global_bundle_deps.sh
$SUDO ./scripts/install_webp.sh
bash ./scripts/audio_setup.sh

echo Installing audio config to /etc/pulse/
$SUDO cp -r src/services/instance/parec-server/pulse/* /etc/pulse/
mkdir -p ~/.config/pulse/
cp -r src/services/instance/parec-server/pulse/* ~/.config/pulse/ 
$SUDO loginctl enable-linger
$SUDO mkdir -p /usr/local/lib/systemd/logind.conf.d
$SUDO echo "KillUserProcesses=no" > /usr/local/lib/systemd/logind.conf.d/nokill.conf

$SUDO groupadd browsers
$SUDO groupadd scripters
# Edit the sudoers file to allow members of the "renice" group to run the "renice" command
if ! $SUDO grep -q "%renice ALL=NOPASSWD:" /etc/sudoers; then
  $SUDO groupadd renice >&2
  echo "%renice ALL=NOPASSWD: /usr/bin/renice, /usr/bin/loginctl, /usr/bin/id" | $SUDO tee -a /etc/sudoers >&2
fi
if ! $SUDO grep -q "%browsers ALL=NOPASSWD:" /etc/sudoers; then
  $SUDO groupadd browsers >&2
  echo "%browsers ALL=NOPASSWD: /usr/bin/pulseaudio --start" | $SUDO tee -a /etc/sudoers >&2
  echo "%browsers ALL=NOPASSWD: /usr/bin/pulseaudio --start --use-pid-file=true --log-level=debug, /usr/bin/pulseaudio --check" | $SUDO tee -a /etc/sudoers >&2
fi

$SUDO ufw disable
which pm2 || npm i -g pm2@latest || sudo npm i -g pm2@latest
$SUDO setcap 'cap_net_bind_service=+ep' $(which node)
