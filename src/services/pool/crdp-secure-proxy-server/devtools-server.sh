#!/usr/bin/env bash

node="$(command -v node)"

source "$1"

cookie=$COOKIE_VALUE
token=$LOGIN_TOKEN
port=$DEVTOOLS_PORT

exec "$node" index.js $port $cookie $token
