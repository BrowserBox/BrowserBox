#!/bin/bash

#set -x

unset npm_config_prefix
node=$(command -v node)
SUDO=$(command -v sudo)
if command -v node.exe &>/dev/null; then
  node=$(command -v node.exe) 
fi

PLAT="$("$node" -p process.platform)"

if [[ $PLAT == win* ]]; then
  winpty nvm install v21
  winpty nvm use latest
else 
  source ~/.nvm/nvm.sh;
  nvm install v21
fi

if ! command -v pm2 &>/dev/null; then
  npm i -g pm2@latest
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
  #cd websocket_chat_app_homework
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

  if ([[ "$IS_DOCKER_BUILD" == "true" ]] && [[ "$INSTALL_DOC_VIEWER" == "true" ]]); then
    yes_docs="true"
  else
    read_input "Do you want to add the secure document viewer for PDFs, DOCX and more? (lengthy install because of all the fonts and TeX related packages) y/n "
    if [[ "$REPLY" =~ ^[Yy]$ ]]; then
      yes_docs="true"
    else
      yes_docs="false"
    fi
  fi

  if [[ "$yes_docs" != "false" ]]; then
    echo "Installing OS dependencies for secure document viewer..."
    ./scripts/setup.sh
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

