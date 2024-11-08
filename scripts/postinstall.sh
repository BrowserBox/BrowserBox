#!/usr/bin/env bash

#set -x

unset npm_config_prefix
export node=$(command -v node)
export SUDO=$(command -v sudo)
export sudo=$(command -v sudo)

if "$sudo" -n true &>/dev/null; then
  sudo="\"$SUDO\" -n"
  SUDO="\"$SUDO\" -n"
fi
if command -v node.exe &>/dev/null; then
  node=$(command -v node.exe)
fi

export PLAT="$("$node" -p process.platform)"

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
      $SUDO apt install -y wget tar
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
    $SUDO dnf install -y wget tar
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

if [[ $PLAT == win* ]]; then
  winpty nvm install v22
  winpty nvm use latest
else
  source ~/.nvm/nvm.sh;
  nvm install v22
fi

if ! command -v pm2 &>/dev/null; then
  . /etc/os-release

  if [[ $ID == *"bsd" ]]; then
    sudo -n npm i -g pm2@latest || echo "Could not install pm2" >&2
  else
    npm i -g pm2@latest
  fi
fi

# flush any partial
if [[ $PLAT != win* ]]; then
  read -p "Enter to continue" -r
fi
REPLY=""

read_input() {
  if [[ $PLAT != win* ]]; then
    if [ -t 0 ]; then  # Check if it's running interactively
      read -p "$1" -r REPLY
    else
      read -r REPLY
      REPLY=${REPLY:0:1}  # Take the first character of the piped input
    fi
    echo  # Add a newline for readability
    echo
  else
    REPLY="y"
  fi
}

if [[ "$(uname -s)" == "Darwin" ]]; then
  if [[ "$(arch)" != "i386" ]]; then
    >&2 echo "Please run this script under Rosetta (i386 architecture)."
    #exit 1
  fi
fi

echo "Copying custom @roamhq/wrtc/lib/binding.js file..." >&2
cp ./config/roamhq-wrtc-lib-binding.js ./node_modules/@roamhq/wrtc/lib/binding.js

echo
echo

if [[ $PLAT != win* ]]; then
  read_input "Want to run setup_machine script? (you only need to do this the first time you install BG, or when you update new version) y/n "
  echo
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]];
  then
    echo "Not running full setup...Just doing npm install..."
  else
    echo "Running full setup..."
    bash ./scripts/setup_machine.sh
  fi
fi

mkdir -p src/public/voodoo/assets/icons

echo "Installing packages for zombie lord..."
cd src/zombie-lord
npm i
npm audit fix
echo "Installing packages for client..."
cd ../public/voodoo
npm i
npm audit fix

echo "Installing packages for custom chrome launcher..."
cd ../../zombie-lord/custom-launcher
npm i
npm audit fix
cd ../../

echo "Installing packages for audio service..."
cd services/instance/parec-server
npm i
npm audit fix
cd ../

#Not installing pptr console and websocket chat
  #echo "Installing packages for pptr console service..."
  #cd pptr-console-server
  #export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=True
  #npm i
  #npm audit fix
  #
  #rm -rf node_modules/puppeteer/.local-chromium
  #
  #echo "Installing packages for real time chat service..."
  #cd websocket_chat_app
  #npm i
  #npm audit fix
  #cd ../
  #cd ../

echo "Installing packages for remote devtools service..."
cd ../pool/crdp-secure-proxy-server
npm i
npm audit fix

echo "Installing packages for secure document viewer..."
cd ../chai
npm i
npm audit fix

if [[ $PLAT != win* ]]; then
  echo
  yes_docs="false"

  if [[ "$IS_DOCKER_BUILD" == "true" ]] && [[ "$(echo "$INSTALL_DOC_VIEWER" | tr '[:upper:]' '[:lower:]')" == "true" ]]; then
    yes_docs="true"
  elif [[ "$(echo "$INSTALL_DOC_VIEWER" | tr '[:upper:]' '[:lower:]')" == "false" ]]; then
    yes_docs="false"
  else
    read_input "Do you want to add the secure document viewer for PDFs, DOCX and more? (lengthy install because of all the fonts and TeX related packages) y/n "
    if [[ "$REPLY" =~ ^[Yy]$ ]]; then
      yes_docs="true"
    else
      yes_docs="false"
    fi
  fi

  if [[ "$yes_docs" != "false" ]]; then
    # Unless we are in docker then
    # Change to background install to speed things up
    # this means you will need to wait a bit for documents to convert. And likely have to retry them
    # by reclicking on the link to them in the remote browser, to trigger the convert process again
    # at least until this background install process for the doc viewer and its dependencies
    # is completed. This can take a while, due to all the tex and font packages! 
    # It can take 30 minutes or more to complete depending on the machines speed and bandwidth.
    echo "Installing OS dependencies for secure document viewer in the background..."
    if [[ "$IS_DOCKER_BUILD" == "true" ]]; then
      yes | ./scripts/setup.sh
    else 
      if command -v nohup &>/dev/null; then
        nohup bash -c 'yes | ./scripts/setup.sh' &> $HOME/docviewer-install-nohup.out &
      else
        bash -c 'yes | ./scripts/setup.sh' &> $HOME/docviewer-install-nohup.out &
      fi
    fi
  else
    echo "Skipping doc viewer install"
  fi
fi

cd ../../../../

USE_FLASH=$(node ./src/show_useflash.js);
if [[ $USE_FLASH != "false" ]]; then
  if ! command -v jq &>/dev/null; then
    if command -v winget &>/dev/null; then
      winget install -e --id jqlang.jq
    elif command -v brew &>/dev/null; then
      brew install jq
    elif command -v $APT &>/dev/null; then
      $SUDO $APT install jq
    else
      echo "Do not know how to install 'jq'. Please install manually." >&2
    fi
  fi
  ./scripts/download_ruffle.sh
fi

if ! command -v pm2 &>/dev/null; then
  npm i -g pm2@latest
fi

npm i --save-exact esbuild@latest

npm audit fix

echo Dependency install complete.
