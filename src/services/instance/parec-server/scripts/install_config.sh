#!/usr/bin/env bash

node="$(command -v node.exe || command -v node)"

PLAT="$("$node" -p process.platform)"

if [[ $PLAT == win* ]]; then
  P="$("$node" -p "process.env['ProgramFiles']")"
  P86="$("$node" -p "process.env['ProgramFiles(x86)']")"
  PULSE_DIR="${P}/PulseAudio"
  PULSE_DIR86="${P86}/PulseAudio"
  PULSE=""
  # find pulse directory
  if [[ -d "$PULSE_DIR" ]]; then
    PULSE="$PULSE_DIR" 
  elif [[ -d "$PULSE_DIR86" ]]; then
    PULSE="$PULSE_DIR86" 
  fi
  # see: https://pgaskin.net/pulseaudio-win32/#readme
  # "The included configuration files in the installation directory will be overwritten on install and deleted on uninstall. To preserve your changes, place your custom configuration files in *.pa.d\*.pa and *.conf.d\*.conf."
  cp ./pulse/client.conf.d/* "${PULSE}/etc/pulse/client.conf.d/"
  cp ./pulse/client.conf "${PULSE}/etc/pulse/client.conf.d/"
  cp ./pulse/daemon.conf "${PULSE}/etc/pulse/daemon.conf.d/"
  cp ./pulse/default.pa "${PULSE}/etc/pulse/default.pa.d/"
  cp ./pulse/system.pa "${PULSE}/etc/pulse/system.pa.d/"
else
  if sudo -n true; then
    sudo cp -r ./pulse/* /etc/pulse/
  fi
  mkdir -p ~/.config/pulse/
  cp -r ./pulse/* ~/.config/pulse/
fi

