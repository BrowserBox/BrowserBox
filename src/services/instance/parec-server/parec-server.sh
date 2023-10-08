#!/usr/bin/env bash

echo "starting audio service..."

function finish {
  echo "Shutting down PA"
  pulseaudio -k
}

trap finish EXIT

get_install_dir() {
  # Find potential directories containing .bbpro_install_dir
  pwd="$(pwd)"
  install_path1=$(find $pwd -name .bbpro_install_dir -print 2>/dev/null)

  # Loop through each found path to check if node_modules also exists in the same directory
  IFS=$'\n'  # Change Internal Field Separator to newline for iteration
  for path in $install_path1; do
    dir=$(dirname $path)
    if [ -d "$dir/node_modules" ]; then
      echo "$dir"
      return 0
    fi
  done

  install_path2=$(find $HOME -name .bbpro_install_dir -print 2>/dev/null)
  IFS=$'\n'  # Change Internal Field Separator to newline for iteration
  for path in $install_path2; do
    dir=$(dirname $path)
    if [ -d "$dir/node_modules" ]; then
      echo "$dir"
      return 0
    fi
  done

  echo "No valid install directory found."
  return 1
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

