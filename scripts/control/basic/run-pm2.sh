#!/bin/bash

#set -x

username=$(whoami)
echo "Starting viewfinder service cluster as $username"

get_install_dir() {
  # Find potential directories containing .bbpro_install_dir
  pwd="$(pwd)"
  install_path1=$(find $pwd -name .bbpro_install_dir -print 2>/dev/null)
  current_version=$(jq -r '.version' ./package.json)

  # Loop through each found path to check if node_modules also exists in the same directory
  IFS=$'\n'  # Change Internal Field Separator to newline for iteration
  for path in $install_path1; do
    dir=$(dirname $path)
    if [ -d "$dir/node_modules" ]; then
      # Get the version of the found directory's package.json
      found_version=$(jq -r '.version' "${dir}/package.json")

      # Check if the found version is the same or later than the current version
      if [[ $(echo -e "$current_version\n$found_version" | sort -V | tail -n1) == "$found_version" ]]; then
        echo "$dir"
        return 0
      fi
    fi
  done

  install_path2=$(find $HOME -name .bbpro_install_dir -print 2>/dev/null)
  IFS=$'\n'  # Change Internal Field Separator to newline for iteration
  for path in $install_path2; do
    dir=$(dirname $path)
    if [ -d "$dir/node_modules" ]; then
      # Get the version of the found directory's package.json
      found_version=$(jq -r '.version' "${dir}/package.json")

      # Check if the found version is the same or later than the current version
      if [[ $(echo -e "$current_version\n$found_version" | sort -V | tail -n1) == "$found_version" ]]; then
        echo "$dir"
        return 0
      fi
    fi
  done

  echo "No valid install directory found."
  return 1
}

#!/bin/bash

find_mkcert_root_ca() {
  local mkcert_dir=""

  case "$(uname)" in
    "Linux")
      mkcert_dir="$HOME/.local/share/mkcert"
      ;;
    "Darwin")
      mkcert_dir="$HOME/Library/Application Support/mkcert"
      ;;
    *)
      echo "Unsupported OS for mkcert root ca location finding" >&2
      return 1
      ;;
  esac

  if [ -d "$mkcert_dir" ]; then
    echo "mkcert root CA files in $mkcert_dir:" >&2
    echo "$mkcert_dir" 
  else
    echo "mkcert directory not found in the expected location." >&2
    return 1
  fi
}

INSTALL_DIR=$(get_install_dir)

if [[ -z "${TORBB}" ]]; then
  echo "Running in tor..."
  echo -n "Copying onion address root CA public file to BB static serve folder..."
  static_ca_root="${INSTALL_DIR}/src/public/torca"
  mkdir -p "$static_ca_root" || sudo mkdir -p "$static_ca_root"
  cert_root=$(find_mkcert_root_ca)
  cp "${cert_root}/rootCA.pem" "${static_ca_root}/" || sudo cp "${cert_root}/rootCA.pem" "${static_ca_root}/"
  # also copy the document containing the trust guidance and instructions for import / install of this CA to this folder"
  echo "Copied!"
fi

node=$(which node)
echo Using $node

echo "Starting audio service..."
pm2 start ./scripts/global/start_audio.sh -- $1

echo "Starting main bbpro service..."
echo "Install dir: $INSTALL_DIR"
cd "$INSTALL_DIR"
pm2 start ./scripts/basic-bb-main-service.sh -- $1

echo "Starting secure remote devtools service..."
cd src/services/pool/crdp-secure-proxy-server
pm2 start ./devtools-server.sh -- $1

echo "Starting secure document viewer service..."
cd "$INSTALL_DIR"
cd src/services/pool/chai
./scripts/restart.sh $1



