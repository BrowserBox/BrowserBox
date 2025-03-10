#!/usr/bin/env bash

# This script must be run with sudo privileges
if [ "$(id -u)" -ne 0 ]; then
  echo "This script must be run as root. Please use sudo." >&2
  exit 1
fi

# Check if a username was provided
if [ -z "$1" ]; then
  echo "Usage: sudo $0 username" >&2
  exit 1
fi

USERNAME="$1"

# Variables
OS_TYPE=""
TORRC=""
TORDIR=""
TOR_GROUP=""
TOR_USER=""
RESTART_TOR=false
COOKIE_AUTH_FILE=""

SUDO=""

if command -v sudo &>/dev/null; then
  export SUDO="$(command -v sudo) -n"
fi

# Function to detect the operating system
detect_os() {
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if [ -f /etc/debian_version ]; then
      OS_TYPE="debian"
      TOR_GROUP="debian-tor"
      TOR_USER="debian-tor"
      TORRC="/etc/tor/torrc"
      TORDIR="/var/lib/tor"
      COOKIE_AUTH_FILE="$TORDIR/control_auth_cookie"
    elif [ -f /etc/redhat-release ] || [ -f /etc/centos-release ]; then
      OS_TYPE="redhat"
      TOR_GROUP="toranon"
      TOR_USER="toranon"
      TORRC="/etc/tor/torrc"
      TORDIR="/var/lib/tor"
      COOKIE_AUTH_FILE="$TORDIR/control_auth_cookie"
    else
      echo "Unsupported Linux distribution" >&2
      exit 1
    fi
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS_TYPE="macos"
    TOR_GROUP="_tor"  # macOS Homebrew uses _tor group
    TOR_USER="$(id -un)"  # Tor runs as the current user by default with brew
    if ! command -v brew &>/dev/null; then
      echo "Homebrew is not installed. Please install Homebrew first: https://brew.sh" >&2
      exit 1
    fi
    local prefix=$(brew --prefix)
    TORRC="${prefix}/etc/tor/torrc"
    TORDIR="${prefix}/var/lib/tor"
    COOKIE_AUTH_FILE="${prefix}/var/lib/tor/control_auth_cookie"
  else
    echo "Unsupported Operating System" >&2
    exit 1
  fi
}

# Function to add Tor repository and install Tor for Debian/Ubuntu
add_tor_repository_debian() {
  echo "Adding Tor repository for Debian/Ubuntu..." >&2
  apt-get update
  apt-get install -y apt-transport-https gpg
  # Use modern keyring method instead of deprecated apt-key
  curl -s https://deb.torproject.org/torproject.org/A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89.asc | gpg --dearmor | tee /usr/share/keyrings/tor-archive-keyring.gpg >/dev/null
  # Fallback to 'stable' if VERSION_CODENAME is unavailable
  local codename=$(grep -oP '(?<=^VERSION_CODENAME=).+' /etc/os-release || echo 'stable')
  echo "deb [signed-by=/usr/share/keyrings/tor-archive-keyring.gpg] https://deb.torproject.org/torproject.org $codename main" > /etc/apt/sources.list.d/tor.list
  apt-get update
  apt-get install -y tor deb.torproject.org-keyring
}

# Function to install Tor based on OS
install_tor() {
  if command -v tor &>/dev/null; then
    echo "Tor is already installed" >&2
    return 0
  fi
  case $OS_TYPE in
    debian)
      add_tor_repository_debian
      ;;
    redhat)
      yum install -y epel-release || dnf install -y epel-release
      yum install -y tor || dnf install -y tor
      ;;
    macos)
      brew install tor
      ;;
  esac
  command -v tor &>/dev/null || { echo "Failed to install Tor" >&2; exit 1; }
}

# Function to find or create the torrc file
find_torrc_path() {
  if [[ "$OS_TYPE" == "macos" ]]; then
    local prefix=$(brew --prefix)
    TORRC="${prefix}/etc/tor/torrc"
    TORDIR="${prefix}/var/lib/tor"
    COOKIE_AUTH_FILE="${prefix}/var/lib/tor/control_auth_cookie"
    # Create torrc if it doesn’t exist
    [ -d "$(dirname "$TORRC")" ] || mkdir -p "$(dirname "$TORRC")"
    [ -f "$TORRC" ] || touch "$TORRC"
  else
    TORRC="/etc/tor/torrc"
    TORDIR="/var/lib/tor"
    COOKIE_AUTH_FILE="$TORDIR/control_auth_cookie"
  fi
  # Ensure torrc exists
  if [ ! -f "$TORRC" ]; then
    echo "Tor configuration file not found at $TORRC" >&2
    exit 1
  fi
}

# Function to add the user to the Tor group
add_user_to_tor_group() {
  if [[ "$OS_TYPE" == "macos" ]]; then
    # On macOS, Homebrew Tor runs as the user, so no group addition is needed
    echo "On macOS, Tor runs as the current user ($USERNAME); no group addition needed" >&2
  elif id -nG "$USERNAME" | grep -qw "$TOR_GROUP"; then
    echo "User $USERNAME is already in the $TOR_GROUP group" >&2
  else
    usermod -aG "$TOR_GROUP" "$USERNAME"
    echo "Added user $USERNAME to group $TOR_GROUP" >&2
  fi
}

# Function to configure torrc
configure_torrc() {
  local torrc_modified=false
  for line in "ControlPort 9051" "CookieAuthentication 1" "CookieAuthFileGroupReadable 1" "CookieAuthFile $COOKIE_AUTH_FILE"; do
    if ! grep -q "^$line" "$TORRC"; then
      echo "$line" >> "$TORRC"
      torrc_modified=true
      echo "Added $line to $TORRC" >&2
    fi
  done
  if $torrc_modified; then
    RESTART_TOR=true
  fi
}

# Function to adjust permissions on Tor directories and files
adjust_permissions() {
  echo "Adjusting permissions on Tor directories and files..." >&2
  if [[ "$OS_TYPE" == "macos" ]]; then
    # On macOS, ensure the user has access (Homebrew runs as user)
    chown -R "$TOR_USER" "$TORDIR"
    chmod -R 700 "$TORDIR"  # Stricter permissions since no group sharing is needed
    [ -f "$COOKIE_AUTH_FILE" ] && chown "$TOR_USER" "$COOKIE_AUTH_FILE" && chmod 600 "$COOKIE_AUTH_FILE"
  else
    chown -R "$TOR_USER:$TOR_GROUP" "$TORDIR"
    chmod -R 750 "$TORDIR"
    [ -f "$COOKIE_AUTH_FILE" ] && chown "$TOR_USER:$TOR_GROUP" "$COOKIE_AUTH_FILE" && chmod 640 "$COOKIE_AUTH_FILE"
  fi
  if [ -f "$COOKIE_AUTH_FILE" ]; then
    echo "Set permissions on $COOKIE_AUTH_FILE" >&2
  else
    echo "control_auth_cookie not found; it will be created when Tor starts" >&2
    RESTART_TOR=True
  fi
}

# Function to restart Tor service if necessary
restart_tor_service() {
  if $RESTART_TOR; then
    echo "Restarting Tor service..." >&2
    if [[ "$OS_TYPE" == "macos" ]]; then
      brew services restart tor
    else
      systemctl restart tor
      # Check if we're in Docker and systemctl isn't working
      if [[ -f /.dockerenv ]] || ! systemctl is-active tor >/dev/null 2>&1; then
          printf "${YELLOW}Detected Docker environment, starting Tor manually...${NC}\n"
          $SUDO pkill -x tor 2>/dev/null # Kill any existing Tor process
          if [[ "$OS_TYPE" == "redhat" ]]; then
            $SUDO -u $TOR_GROUP nohup tor &
          elif [[ "$OS_TYPE" == "debian" ]]; then
            $SUDO nohup tor &
          fi
          sleep 2 # Give Tor a moment to start
          if ! pgrep -f tor >/dev/null; then
              printf "${RED}Failed to start Tor manually${NC}\n"
              exit 1
          fi
      fi
    fi
  else
    echo "No changes to torrc; no restart needed" >&2
  fi
}

# Main execution flow
main() {
  detect_os
  install_tor
  find_torrc_path
  add_user_to_tor_group
  configure_torrc
  adjust_permissions
  restart_tor_service
  echo "Tor setup complete for user $USERNAME" >&2
}

# Invoke the main function
main
