#!/bin/bash
# bbvalidate.sh - Remove existing ticket and get a new one

if [[ -n "$BBX_DEBUG" ]]; then
  set -x
fi
set -e

CONFIG_DIR="$HOME/.config/dosyago/bbpro/tickets"
[ ! -d "$CONFIG_DIR" ] && mkdir -p "$CONFIG_DIR"
TICKET_FILE="$CONFIG_DIR/ticket.json"

rm -f $TICKET_FILE

source "${HOME}/.config/dosyago/bbpro/config"

bbcertify
