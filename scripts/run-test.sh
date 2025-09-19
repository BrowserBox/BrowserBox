#!/usr/bin/env bash

source ~/.nvm/nvm.sh

#set -x

#nvm install stable

touch .bbpro_install_dir

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
  if [ -f "$(pwd)/.bbpro_install_dir" ]; then
    install_dir="$(pwd)"
  else
    install_path="$(find "$HOME/.bbx" -name .bbpro_install_dir -print -quit 2>/dev/null)"
    install_dir="$(dirname "$install_path")"
  fi
  echo "$install_dir"
}

get_config_dir() {
  config_path="$(find "${HOME}/.config" -name .bbpro_config_dir -print -quit 2>/dev/null)"
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

  export CWD="$(pwd)";
  echo "CWD: $CWD"

  bash -c "source $envFile; echo \"CWD: $CWD\"; ./scripts/control/basic/run-pm2.sh $envFile"
}

echo "Finding bbpro config..."

CONFIG_DIR="$(get_config_dir)"
echo "Found bbpro at: ${CONFIG_DIR}"

envFile="${CONFIG_DIR}/test.env"

if [ -f "$envFile" ]; then
  echo "bbpro has been setup. Starting..."
else
  echo "Please run setup_bbpro before running the first time"
  exit 1
fi

if [[ -n "$TORBB" ]]; then
  echo "Running in tor..."
  envFile="${CONFIG_DIR}/torbb.env"
  . "$envFile"
fi

if [[ -n "$HOST_PER_SERVICE" ]]; then
  echo "Running 1 host per service..."
  # load both env file as hosts are just the host facades (under say nginx, or ngrok, or localhost.run, etc)
  . "$envFile"
  envFile="${CONFIG_DIR}/hosts.env"
  . "$envFile"
fi

if [ -f "$envFile" ]; then
  echo "bbpro has been setup. Starting..."
  start_bbpro
else
  echo "Please run setup_bbpro before running the first time"
  exit 1
fi

