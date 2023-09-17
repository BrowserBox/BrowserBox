#!/usr/bin/env bash

. ./scripts/config.sh

port="${1:-$DOCS_PORT}"

if [ -z $port ]; then
  port=443
  echo "Supply port, defaulting to 443"
else
  echo "Port given as: $port" >&2
  echo "FYI: DOCS_PORT = $DOCS_PORT" >&2
fi

mkdir -p "$pdfs"
if [ ! -f "${pdfs}/hashes.json" ]; then
  echo "[]" > "${pdfs}/hashes.json"
fi
if [ ! -f "${pdfs}/links.json" ]; then
  echo "[]" > "${pdfs}/links.json"
fi

"${STATIC_DIR}/uploads/clean.sh"
node src/index.js $port
