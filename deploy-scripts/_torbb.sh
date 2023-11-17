#!/bin/bash

# Global Variables
OS_TYPE=""
TOR_INSTALLED=false

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

    sudo mkdir -p "$hidden_service_dir"
    sudo chown debian-tor:debian-tor "$hidden_service_dir"
    sudo chmod 700 "$hidden_service_dir"

    echo "HiddenServiceDir $hidden_service_dir" | sudo tee -a /etc/tor/torrc
    echo "HiddenServicePort $service_port 127.0.0.1:$service_port" | sudo tee -a /etc/tor/torrc
  done

  sudo systemctl restart tor

  for i in {0..4}; do
    local service_port=$((base_port + i))
    local hidden_service_dir="/var/lib/tor/hidden_service_$service_port"
    local onion_address=$(sudo cat "$hidden_service_dir/hostname")
    export "ADDR_$service_port=$onion_address"
    echo "Exported ADDR_$service_port=$onion_address"
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
  command -v tor >/dev/null 2>&1 || install_tor
  source ~/.config/dosyago/bbpro/test.env || { echo "bb environment not found. please run setup_bbpro first." >&2; exit 1; }
  [[ $APP_PORT =~ ^[0-9]+$ ]] || { echo "Invalid APP_PORT" >&2; exit 1; }

  [[ $TOR_INSTALLED == true ]] && configure_and_export_tor
  manage_firewall

  export TORBB=true
} >&2 # Redirect all output to stderr except for onion address export

# Run bbpro
bbpro

