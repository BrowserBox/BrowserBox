#!/bin/sh

. "$HOME/.nvm/nvm.sh"

if [ -z "${DOCS_KEY}" ]; then
  echo "You need to set the DOCS_KEY environment variable"
  exit 1
fi

pm2=$(which pm2)

./public/uploads/clean.sh
sleep 2
$pm2 stop ./scripts/run-docspark.sh
$pm2 delete run-docspark
killall node npm
$pm2 start ./scripts/run-docspark.sh
$pm2 logs run-docspark
