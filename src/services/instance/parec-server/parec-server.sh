#!/usr/bin/env bash

echo "starting audio service..."

function finish {
  echo "Shutting down PA"
  pulseaudio -k
}

trap finish EXIT

get_install_dir() {
  echo "Finding bbpro installation..." >&2
  install_path1=$(find $HOME -name .bbpro_install_dir -print -quit 2>/dev/null)
  install_path2=$(find /usr/local/share -name .bbpro_install_dir -print -quit 2>/dev/null)
  install_dir=$(dirname $install_path1)
  if [ -z "$install_dir" ]; then
    install_dir=$(dirname $install_path2)
  fi
  if [ -z "$install_dir" ]; then
    echo "Could not find bppro. Purchase a license and run deploy-scripts/global_install.sh first">&2
    exit 1
  fi
  echo "Found bbpro at: $install_dir">&2

  echo $install_dir
}

echo "Finding bbpro installation..."
INSTALL_DIR=$(get_install_dir)
echo "Found bbpro at: $INSTALL_DIR"

echo "starting nvm"
unset npm_config_prefix
cd $HOME
source $HOME/.nvm/nvm.sh
source $1

node=$(which node)
username=$(whoami)

echo "Using node" $(node --version)

let "audio_port = $APP_PORT - 2"

echo "Will run audio on port" $audio_port
echo "User id" $UID

users_gid=$(sudo id -g $UID | xargs)
rgid=$(ps -o rgid -p $$ | tail -n +2 | xargs)
PidFile=/run/user/$UID/pulse/pid
PidFileGroup=$HOME/.config/pulse/$(hostname)-runtime/pid

echo "Real GID" $rgid
echo "User GID" $users_gid

if [ $users_gid -eq $rgid ] && [ -f $PidFile ]; then
  pidFile=$PidFile
else
  pidFile=$PidFileGroup
fi

echo "Pid File" $pidFile

if [[ -z "${RENICE_VALUE}" ]]; then
  reniceValue=-15
else
  reniceValue=$RENICE_VALUE
fi


if [[ -z "${TRACE_WARNINGS}" ]]; then
  traceOptions="--trace-warnings"
else
  traceOptions=""
fi

echo "Starting pulseaudio (PID file: $pidFile)"
if pulseaudio --check; then
  echo "pulse is started already"
  echo "Not shutting pulse down"
  #pulseaudio -k
else 
  pulseaudio --start --use-pid-file=true --log-level=debug
  until pulseaudio --check
  do  
    sleep 2
  done
fi

pa_pid=$(cat $pidFile || pgrep pulseaudio)
sudo renice -n $reniceValue -p $pa_pid
echo "Pulseaudio (pid: $pa_pid) is reniced to priority $reniceValue"

echo "Starting parec-server"
cd $INSTALL_DIR/src/services/instance/parec-server
$node $traceOptions index.js $audio_port rtp.monitor $COOKIE_VALUE $LOGIN_TOKEN

