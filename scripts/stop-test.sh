#!/bin/bash

command -v pm2 &>/dev/null || npm i -g pm2@latest
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
