#!/usr/bin/env bash

. "${HOME}/.nvm/nvm.sh"
. ./scripts/config.sh

if [ -z "${DOCS_KEY}" ]; then
  echo "You need to set the DOCS_KEY environment variable"
  exit 1
fi

pm2=$(which pm2)

cp -r ./public/* "$STATIC_DIR"
cp -r ./archives/* "$ARCH_DIR"

"${STATIC_DIR}/uploads/clean.sh"
sleep 2
$pm2 stop ./scripts/run-docspark.sh
$pm2 delete run-docspark
killall node npm
$pm2 start ./scripts/run-docspark.sh
