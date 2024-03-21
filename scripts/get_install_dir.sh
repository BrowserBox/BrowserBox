#!/usr/bin/env bash

install_path=$(find "${HOME}/BrowserBox" -name .bbpro_install_dir -print -quit 2>/dev/null)
install_dir=$(dirname $install_path)
echo $install_dir


