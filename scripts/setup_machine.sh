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

initialize_package_manager() {
  local package_manager

  if [[ "$OSTYPE" == darwin* ]]; then
    package_manager=$(command -v brew)
  elif command -v apt &>/dev/null; then
    package_manager=$(command -v apt)
    if command -v apt-get &>/dev/null; then
      source ./deploy-scripts/non-interactive.sh
    fi
    # Check if the system is Debian and the version is 11
    if [[ "$ID" == "debian" && "$VERSION_ID" == "11" ]]; then
      $SUDO apt -y install wget tar
      mkdir -p $HOME/build/Release
      echo "Installing Custom Build of WebRTC Node for Debian 11..."
      wget https://github.com/dosyago/node-webrtc/releases/download/v1.0.0/debian-11-wrtc.node
      chmod +x debian-11-wrtc.node
      mv debian-11-wrtc.node $HOME/build/Release/wrtc.node
      $SUDO mkdir -p /usr/local/share/dosyago/build/Release
      $SUDO cp $HOME/build/Release/wrtc.node /usr/local/share/dosyago/build/Release/
    fi
  elif command -v dnf >/dev/null; then
    package_manager="$(command -v dnf) --best --allowerasing --skip-broken"
    $SUDO dnf config-manager --set-enabled crb
    $SUDO dnf -y upgrade --refresh
    $SUDO dnf install https://download1.rpmfusion.org/free/el/rpmfusion-free-release-$(rpm -E %rhel).noarch.rpm
    $SUDO dnf install https://download1.rpmfusion.org/nonfree/el/rpmfusion-nonfree-release-$(rpm -E %rhel).noarch.rpm
    $SUDO firewall-cmd --permanent --zone="$ZONE" --add-service=http
    $SUDO firewall-cmd --permanent --zone="$ZONE" --add-service=https
    $SUDO firewall-cmd --reload
    $SUDO dnf -y install wget tar
    mkdir -p $HOME/build/Release
    if [ "$ID" = "almalinux" ] && [[ "$VERSION_ID" == 8* ]]; then
      echo "Installing Custom Build of WebRTC Node for Almalinux 8 like..."
      wget https://github.com/dosyago/node-webrtc/releases/download/v1.0.0/almalinux-8-wrtc.node
      chmod +x almalinux-8-wrtc.node
      mv almalinux-8-wrtc.node $HOME/build/Release/wrtc.node
    elif ([ "$ID" = "centos" ] || [ "$ID" = "rhel" ]) && [[ "$VERSION_ID" == 8* ]]; then
      echo "Installing Custom Build of WebRTC Node for CentOS 8 or RedHat Enterprise Linux 8..."
      wget https://github.com/dosyago/node-webrtc/releases/download/v1.0.0/centos-8-wrtc.node
      chmod +x centos-8-wrtc.node
      mv centos-8-wrtc.node $HOME/build/Release/wrtc.node
    else
      echo "Installing Custom Build of WebRTC Node for CentOS 9 like..."
      wget https://github.com/dosyago/node-webrtc/releases/download/v1.0.0/centos-9-wrtc.node
      chmod +x centos-9-wrtc.node
      mv centos-9-wrtc.node $HOME/build/Release/wrtc.node
    fi
    $SUDO mkdir -p /usr/local/share/dosyago/build/Release
    $SUDO cp $HOME/build/Release/wrtc.node /usr/local/share/dosyago/build/Release/
  else
    echo "No supported package manager found. Exiting."
    return 1
  fi

  echo "Using package manager: $package_manager"
  export APT=$package_manager
}

initialize_package_manager

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
