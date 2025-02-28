#!/usr/bin/env bash

#set -x

get_install_dir() {
  echo "Finding bbpro installation..." >&2
  install_path1=$(find /usr/local/share -name .bbpro_install_dir -print -quit 2>/dev/null)
  install_path2=$(find "${HOME}/BrowserBox" -name .bbpro_install_dir -print -quit 2>/dev/null)
  install_dir=$(dirname $install_path1)
  if [ -z "$install_dir" ]; then
    install_dir=$(dirname $install_path2)
  fi

  if [[ -z "$install_dir" ]] || [[ ! -d "$install_dir/node_modules" ]]; then
    echo "Could not find bppro. Purchase a license and run deploy-scripts/global_install.sh first">&2
    exit 1
  fi

  echo "Found bbpro at: $install_dir">&2
  echo "$install_dir"
}

export INSTALL_DIR="$(get_install_dir)"

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

echo "Install dir: $INSTALL_DIR"
"${STATIC_DIR}/uploads/clean.sh"
node="$(command -v node)"
exec $node src/index.js $port
