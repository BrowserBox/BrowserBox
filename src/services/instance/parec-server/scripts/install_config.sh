#!/bin/bash

node="$(command -v node.exe || command -v node)"

PLAT="$("$node" -p process.platform)"

if [[ $PLAT == win* ]]; then
  PULSE_DIR=""
  # find pulse directory
  if [[ -d 
  # see: https://pgaskin.net/pulseaudio-win32/#readme
  # "The included configuration files in the installation directory will be overwritten on install and deleted on uninstall. To preserve your changes, place your custom configuration files in *.pa.d\*.pa and *.conf.d\*.conf."
  cp ./pulse/client.conf.d/* $PULSE_DIR/etc/pulse/client.conf.d/
  cp ./pulse/client.conf $PULSE_DIR/etc/pulse/client.conf.d/
  cp ./pulse/daemon.conf $PULSE_DIR/etc/pulse/daemon.conf.d/
  cp ./pulse/default.pa $PULSE_DIR/etc/pulse/default.pa.d/
  cp ./pulse/system.pa $PULSE_DIR/etc/pulse/system.pa.d/
else
  sudo cp -r ./pulse/* /etc/pulse/
  mkdir -p ~/.config/pulse/
  cp -r ./pulse/* ~/.config/pulse/
fi

