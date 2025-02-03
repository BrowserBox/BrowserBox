#!/usr/bin/env bash

set -e

echo "Demo run. Run setup_bbpro and bbpro or torbb to see more options or consult the README page: https://github.com/BrowserBox/BrowserBox" >&2

pm2 delete all &>/dev/null
login_link=$(setup_bbpro --port 8080 2>/dev/null)
bbpro &> /dev/null

echo "Login with:" >&2 
echo "$login_link"


