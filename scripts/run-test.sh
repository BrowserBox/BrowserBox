#!/usr/bin/env bash

#set -x

source ~/.nvm/nvm.sh
#nvm install stable

if ! command -v pm2 &>/dev/null; then
  . /etc/os-release

  if [[ $ID == *"bsd" ]]; then
    sudo -n npm i -g pm2@latest || echo "Could not install pm2" >&2
  else
    npm i -g pm2@latest
  fi
fi

envFile=""
CONFIG_DIR=""

get_install_dir() {
  install_path="$(find "${HOME}/BrowserBox" -name .bbpro_install_dir -print -quit 2>/dev/null)"
  install_dir="$(dirname $install_path)"
  echo $install_dir
}

get_config_dir() {
  config_path="$(find "${HOME}" -name .bbpro_config_dir -print -quit 2>/dev/null)"
  config_dir="$(dirname $config_path)"
  echo $config_dir
}

start_bbpro() {
  if [[ -z "${BB_POOL}" ]]; then
    pulseaudio -k
  else
    sudo -g browsers pulseaudio -k
  fi
  pkill -u $(whoami) pacat
  pkill -u $(whoami) parec
  pkill -u $(whoami) pulseaudio

  bash -c "source $envFile; ./scripts/control/basic/run-pm2.sh $envFile"
}

echo "Finding bbpro config..."

CONFIG_DIR="$(get_config_dir)"
echo "Found bbpro at: $CONFIG_DIR"

envFile=$CONFIG_DIR/test.env
if [[ -n "$TORBB" ]]; then
  echo "Running in tor..."
  envFile="${CONFIG_DIR}/torbb.env"
  . $envFile
fi


if [ -f "$envFile" ]; then
  echo "bbpro has been setup. Starting..."
  start_bbpro
else
  echo "Please run setup_bbpro before running the first time"
  exit 1
fi

