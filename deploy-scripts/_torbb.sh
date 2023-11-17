#!/bin/bash

# Global Variables
OS_TYPE=""
TOR_INSTALLED=false
TORRC=""

os_type() {
  case "$(uname -s)" in
    Darwin*) echo "macOS";;
    Linux*)  echo "Linux";;
    MING*)   echo "win";;
    *)       echo "unknown";;
  esac
}

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

find_torrc_path() {
  if [[ "$OS_TYPE" == "macos" ]]; then
    prefix=$(brew --prefix tor)
    TORRC=$(node -p "path.resolve('${prefix}/../../etc/tor/torrc')")
    if [[ ! -f "$TORRC" ]]; then
      cp "$(dirname $TORRC)/torrc.sample" "$(dirname $TORRC)/torrc" || touch "$TORRC"
    fi
  else
    TORRC="/etc/tor/torrc"  # Default path for Linux distributions
  fi
  echo $TORRC
}

setup_mkcert() {
  if ! command -v mkcert &>/dev/null; then
    if [ "$(os_type)" == "macOS" ]; then
      brew install nss mkcert
    elif [ "$(os_type)" == "win" ]; then
      choco install mkcert || scoop bucket add extras && scoop install mkcert
    else
      amd64=$(dpkg --print-architecture || uname -m)
      $SUDO $APT -y install libnss3-tools
      curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/$amd64"
      chmod +x mkcert-v*-linux-$amd64
      $SUDO cp mkcert-v*-linux-$amd64 /usr/local/bin/mkcert
      rm mkcert-v*
    fi
  fi
  mkcert -install
}

# Detect Operating System
detect_os() {
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if [ -f /etc/debian_version ]; then
      OS_TYPE="debian"
    elif [ -f /etc/centos-release ]; then
      OS_TYPE="centos"
    else
      echo "Unsupported Linux distribution" >&2
      exit 1
    fi
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS_TYPE="macos"
  else
    echo "Unsupported Operating System" >&2
    exit 1
  fi
}

# Function to add Tor repository and install Tor for Debian/Ubuntu
add_tor_repository_debian() {
  echo "Adding Tor repository for Debian/Ubuntu..."
  sudo apt-get update
  sudo apt-get install -y apt-transport-https gpg
  wget -qO- https://deb.torproject.org/torproject.org/A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89.asc | gpg --import
  gpg --export A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89 | sudo apt-key add -
  echo "deb https://deb.torproject.org/torproject.org $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/tor.list
  sudo apt-get update
  sudo apt-get install -y tor deb.torproject.org-keyring
  TOR_INSTALLED=true
}

# Function to install Tor based on OS
install_tor() {
  case $OS_TYPE in
    debian)
      add_tor_repository_debian
      ;;
    centos)
      sudo yum install -y epel-release || sudo dnf install -y epel-release
      sudo yum install -y tor || sudo dnf install -y tor
      TOR_INSTALLED=true
      ;;
    macos)
      brew install tor
      TOR_INSTALLED=true
      ;;
  esac
}

# Function to configure Tor and export onion addresses
configure_and_export_tor() {
  local base_port=$((APP_PORT - 2))
  for i in {0..4}; do
    local service_port=$((base_port + i))
    local hidden_service_dir="/var/lib/tor/hidden_service_$service_port"
    local dirLine="HiddenServiceDir $hidden_service_dir" 

    if grep -qF -- "$dirLine" "$TORRC"; then
      sudo rm -rf "$hidden_service_dir"
    else
      echo "dirLine" | sudo tee -a "$TORRC"
      echo "HiddenServicePort 443 127.0.0.1:$service_port" | sudo tee -a "$TORRC"
    fi

    sudo mkdir -p "$hidden_service_dir"
    sudo chown debian-tor:debian-tor "$hidden_service_dir"
    sudo chmod 700 "$hidden_service_dir"
  done

  if [[ "$OS_TYPE" == "macos" ]]; then
     brew services restart tor
  else
    sudo systemctl restart tor
  fi

  # should actually wait until all the hostnames exist but hey
  sleep 10

  for i in {0..4}; do
    local service_port=$((base_port + i))
    local hidden_service_dir="/var/lib/tor/hidden_service_$service_port"
    local onion_address=$(sudo cat "$hidden_service_dir/hostname")
    export "ADDR_$service_port=$onion_address"
    echo "Exported ADDR_$service_port=$onion_address"
    # we user scope these certs as the addresses while distinct do not differentiate on ports
    # and anyway probably a good idea to keep a user's onion addresses private rather than put them in a globally shared location
    local cert_dir="$HOME/tor-sslcerts/${onion_address}"
    mkdir -p "${cert_dir}"
    mkcert -cert-file "${cert_dir}/fullchain.pem" -key-file "${cert_dir}/privkey.pem" "$onion_address" 
  done
}

# Function to manage the firewall
manage_firewall() {
  case $OS_TYPE in
    debian | centos)
      sudo ufw enable
      ;;
    macos)
      # MacOS firewall configurations are typically done through the GUI
      echo "Please ensure your firewall is enabled in MacOS Settings."
      ;;
  esac
}

# Main script execution
{
  if command -v bbpro >/dev/null 2>&1; then
    echo "bbpro installed. proceeding..." >&2
  else
    echo "bbpro not installed. please run" >&2
    echo "./deploy-scripts/global_install.sh localhost" >&2
    echo "before proceeding." >&2
    echo "exiting now..." >&2
    exit 1
  fi

  detect_os
  if command -v tor >/dev/null 2>&1; then
    export TOR_INSTALLED=true
  else
    install_tor
  fi
  source ~/.config/dosyago/bbpro/test.env || { echo "bb environment not found. please run setup_bbpro first." >&2; exit 1; }
  [[ $APP_PORT =~ ^[0-9]+$ ]] || { echo "Invalid APP_PORT" >&2; exit 1; }

  find_torrc_path
  [[ $TOR_INSTALLED == true ]] && configure_and_export_tor
  manage_firewall

  cert_root=$(find_mkcert_root_ca)

  # modify setup file
  CONFIG_DIR=$HOME/.config/dosyago/bbpro/
cat > "${CONFIG_DIR}/torbb.env" <<EOF
source "${CONFIG_DIR}/test.env"
export TORBB=true
export TORCA_CERT_ROOT="${cert_root}"
#export SSLCERTS_DIR="${HOME}/tor-sslcerts"

EOF
} >&2 # Redirect all output to stderr except for onion address export

# Run bbpro
export TORBB=true
bbpro

