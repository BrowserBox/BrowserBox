#!/usr/bin/env bash


. /etc/os-release

if [[ $ID == *"bsd" ]]; then
  sudo npm i -g rollup @babel/cli @babel/core @babel/preset-env @babel/runtime
else
  npm i -g rollup @babel/cli @babel/core @babel/preset-env @babel/runtime
fi  
  
