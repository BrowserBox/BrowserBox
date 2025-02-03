#!/usr/bin/env bash

CONFIG_DIR=$HOME/.config/dosyago/bbpro

mkdir -p $CONFIG_DIR

echo "
export LOGIN_TOKEN=9rPiEJACvvcfG
export APP_PORT=8002
export COOKIE_VALUE=xxxcookie
" > $CONFIG_DIR/test.env

sudo cp scripts/global/* /usr/local/bin/
