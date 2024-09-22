#!/bin/bash

# This script must be run with sudo privileges
if [ "$(id -u)" -ne 0 ]; then
  echo "This script must be run as root. Please use sudo."
  exit 1
fi

# Check if a username was provided
if [ -z "$1" ]; then
  echo "Usage: sudo $0 username"
  exit 1
fi

USERNAME="$1"

# Variables
OS_TYPE=""
TORRC=""
TORDIR=""
TOR_GROUP="tor"
TOR_USER=""
RESTART_TOR=false

# Function to detect the operating system
detect_os() {
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if [ -f /etc/debian_version ]; then
      OS_TYPE="debian"
      TOR_GROUP="debian-tor"
      TOR_USER="debian-tor"
    elif [ -f /etc/centos-release ] || [ -f /etc/redhat-release ]; then
      OS_TYPE="centos"
      TOR_GROUP="toranon"
      TOR_USER="toranon"
    elif [ -f /etc/arch-release ]; then
      OS_TYPE="arch"
      TOR_GROUP="tor"
      TOR_USER="tor"
    else
      echo "Unsupported Linux distribution" >&2
      exit 1
    fi
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS_TYPE="macos"
    TOR_GROUP="tor"
    TOR_USER="$(id -un)"  # On macOS, Tor runs as the current user by default
  else
    echo "Unsupported Operating System" >&2
    exit 1
  fi
}

# Function to find the torrc file
find_torrc_path() {
  if [[ "$OS_TYPE" == "macos" ]]; then
    if ! command -v brew &>/dev/null; then
      echo "Homebrew is not installed. Please install Homebrew first." >&2
      exit 1
    fi
    local prefix
    prefix=$(brew --prefix tor)
    TORRC="$prefix/etc/tor/torrc"
    TORDIR="$prefix/var/lib/tor"
  else
    TORRC="/etc/tor/torrc"
    TORDIR="/var/lib/tor"
  fi

  # Ensure torrc exists
  if [ ! -f "$TORRC" ]; then
    echo "Tor configuration file not found at $TORRC" >&2
    exit 1
  fi
}

# Function to add the user to the tor group
add_user_to_tor_group() {
  if id -nG "$USERNAME" | grep -qw "$TOR_GROUP"; then
    echo "User $USERNAME is already in the $TOR_GROUP group."
  else
    usermod -a -G "$TOR_GROUP" "$USERNAME"
    echo "Added user $USERNAME to group $TOR_GROUP."
  fi
}

# Function to configure torrc
configure_torrc() {
  local torrc_modified=false
  local control_port_configured=false
  local cookie_auth_configured=false
  local cookie_auth_group_readable_configured=false

  # Check if ControlPort is configured
  if grep -qE '^\s*ControlPort\s+9051' "$TORRC"; then
    control_port_configured=true
  fi

  # Check if CookieAuthentication is enabled
  if grep -qE '^\s*CookieAuthentication\s+1' "$TORRC"; then
    cookie_auth_configured=true
  fi

  # Check if CookieAuthFileGroupReadable is enabled
  if grep -qE '^\s*CookieAuthFileGroupReadable\s+1' "$TORRC"; then
    cookie_auth_group_readable_configured=true
  fi

  # Update torrc if necessary
  if ! $control_port_configured; then
    echo "Configuring ControlPort in torrc..."
    echo "ControlPort 9051" >> "$TORRC"
    torrc_modified=true
  fi

  if ! $cookie_auth_configured; then
    echo "Enabling CookieAuthentication in torrc..."
    echo "CookieAuthentication 1" >> "$TORRC"
    torrc_modified=true
  fi

  if ! $cookie_auth_group_readable_configured; then
    echo "Setting CookieAuthFileGroupReadable in torrc..."
    echo "CookieAuthFileGroupReadable 1" >> "$TORRC"
    torrc_modified=true
  fi

  if $torrc_modified; then
    RESTART_TOR=true
  fi
}

# Function to adjust permissions on Tor directories and files
adjust_permissions() {
  echo "Adjusting permissions on Tor directories and files..."

  # Set group ownership of the Tor data directory
  chown -R "$TOR_USER":"$TOR_GROUP" "$TORDIR"
  chmod -R 750 "$TORDIR"

  # Ensure the control_auth_cookie is group-readable
  local control_auth_cookie
  control_auth_cookie="$(find "$TORDIR" -name 'control_auth_cookie' 2>/dev/null | head -n 1)"

  if [ -f "$control_auth_cookie" ]; then
    chown "$TOR_USER":"$TOR_GROUP" "$control_auth_cookie"
    chmod 640 "$control_auth_cookie"
    echo "Set permissions on $control_auth_cookie"
  else
    echo "control_auth_cookie not found. It may be created when Tor starts."
  fi
}

# Function to restart Tor service if necessary
restart_tor_service() {
  if $RESTART_TOR; then
    echo "Restarting Tor service..."
    if [[ "$OS_TYPE" == "macos" ]]; then
      brew services restart tor
    else
      systemctl restart tor
    fi
  else
    echo "No changes to torrc; no need to restart Tor."
  fi
}

# Main execution flow
main() {
  detect_os
  find_torrc_path
  add_user_to_tor_group
  configure_torrc
  adjust_permissions
  restart_tor_service
  echo "Tor setup complete for user $USERNAME."
}

# Invoke the main function
main

