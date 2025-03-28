#!/usr/bin/env bash

if ! command -v pm2 &>/dev/null; then
  . /etc/os-release

  if [[ $ID == *"bsd" ]]; then
    sudo -n npm i -g pm2@latest || echo "Could not install pm2" >&2
  else
    npm i -g pm2@latest
  fi
fi
node="$(command -v node.exe || command -v node)"
pm2 delete start_audio 
pm2 delete basic-bb-main-service 
pm2 delete devtools-server 
pm2 delete run-docspark

PLATFORM_IS="$("$node" -p process.platform)"
if [[ $PLATFORM_IS == win* ]]; then
 pwsh=$(command -v pwsh || command -v powershell)
 "$pwsh" -Command "taskkill /F /IM node.exe"
fi
  
exit 0
