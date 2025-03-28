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
TOR_SERVICE="tor@default"  # Default for Linux instance-based setups

SUDO="sudo -n"

# Detect OS and set Tor user/group
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
    elif [ -f /etc/arch-release ]; then
      OS_TYPE="arch"
      TOR_USER="tor"
      TOR_GROUP="tor"
    else
      echo "Unsupported Linux distribution" >&2
      exit 1
    fi
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS_TYPE="macos"
    TOR_GROUP="admin"
    TOR_USER="$USERNAME"  # Homebrew Tor runs as the user
    if ! command -v brew &>/dev/null; then
      echo "Homebrew not installed. Install it: https://brew.sh" >&2
      exit 1
    fi
    local prefix=$($SUDO -u $SUDO_USER brew --prefix tor)
    TORRC=$($SUDO -u $SUDO_USER bash -c "cd; source .nvm/nvm.sh; node -p \"path.resolve('${prefix}/../../etc/tor/torrc')\"")
    TORDIR=$($SUDO -u $SUDO_USER bash -c "cd; source .nvm/nvm.sh; node -p \"path.resolve('${prefix}/../../var/lib/tor')\"")
    COOKIE_AUTH_FILE="$TORDIR/control_auth_cookie"
    mkdir -p "$TORDIR"
    [ -f "$TORRC" ] || cp "${TORRC}.sample" "$TORRC"
  else
    echo "Unsupported Operating System" >&2
    exit 1
  fi
}

# Install Tor for Debian
install_tor_debian() {
  if command -v tor &>/dev/null; then
    echo "Tor is already installed" >&2
    return 0
  fi
  echo "Adding Tor repository for Debian..." >&2
  apt-get update
  apt-get install -y apt-transport-https gpg
  curl -s https://deb.torproject.org/torproject.org/A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89.asc | gpg --dearmor | tee /usr/share/keyrings/tor-archive-keyring.gpg >/dev/null
  local codename=$(grep -oP '(?<=^VERSION_CODENAME=).+' /etc/os-release || echo 'stable')
  echo "deb [signed-by=/usr/share/keyrings/tor-archive-keyring.gpg] https://deb.torproject.org/torproject.org $codename main" > /etc/apt/sources.list.d/tor.list
  apt-get update
  apt-get install -y tor deb.torproject.org-keyring
}

# Install Tor for Red Hat/CentOS
install_tor_redhat() {
  if command -v tor &>/dev/null; then
    echo "Tor is already installed" >&2
    return 0
  fi
  yum install -y epel-release || dnf install -y epel-release
  yum install -y tor || dnf install -y tor
}

# Install Tor based on OS
install_tor() {
  case $OS_TYPE in
    debian) install_tor_debian ;;
    redhat) install_tor_redhat ;;
    macos) $SUDO -u $SUDO_USER brew install tor ;;
  esac
  command -v tor &>/dev/null || { echo "Failed to install Tor" >&2; exit 1; }
}

# Add user to Tor group
add_user_to_tor_group() {
  if [[ "$OS_TYPE" == "macos" ]]; then
    echo "macOS: Tor runs as $USERNAME; no group addition needed" >&2
  elif id -nG "$USERNAME" | grep -qw "$TOR_GROUP"; then
    echo "User $USERNAME is already in $TOR_GROUP" >&2
  else
    usermod -aG "$TOR_GROUP" "$USERNAME"
    echo "Added $USERNAME to $TOR_GROUP" >&2
  fi
}

# Configure torrc
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

# Adjust permissions
adjust_permissions() {
  echo "Adjusting permissions..." >&2
  if [[ "$OS_TYPE" == "macos" ]]; then
    chown -R "$TOR_USER" "$TORDIR"
    chmod -R 700 "$TORDIR"
    [ -f "$COOKIE_AUTH_FILE" ] && chown "$TOR_USER" "$COOKIE_AUTH_FILE" && chmod 600 "$COOKIE_AUTH_FILE"
  else
    chown -R "$TOR_USER:$TOR_GROUP" "$TORDIR"
    chmod -R 700 "$TORDIR"
    [ -f "$COOKIE_AUTH_FILE" ] && chown "$TOR_USER:$TOR_GROUP" "$COOKIE_AUTH_FILE" && chmod 640 "$COOKIE_AUTH_FILE"
  fi
  if [ -f "$COOKIE_AUTH_FILE" ]; then
    echo "Set permissions on $COOKIE_AUTH_FILE" >&2
  else
    echo "control_auth_cookie not found; starting Tor will create it" >&2
    RESTART_TOR=true
  fi
}

# Restart Tor service with Docker check
restart_tor_service() {
  if $RESTART_TOR; then
    echo "Restarting Tor service..." >&2
    if [[ "$OS_TYPE" == "macos" ]]; then
      $SUDO su - $SUDO_USER -c "bash -cl 'brew services restart tor'"
    else
      systemctl restart "$TOR_SERVICE"
      # Check if we're in Docker or systemd isn't working
      if [[ -f /.dockerenv ]] || ! systemctl is-active "$TOR_SERVICE" >/dev/null 2>&1; then
        echo "Detected Docker or systemd failure, starting Tor manually..." >&2
        $SUDO pkill -x tor 2>/dev/null
        if [[ "$OS_TYPE" == "redhat" ]]; then
          $SUDO -u "$TOR_USER" nohup tor &
        elif [[ "$OS_TYPE" == "debian" ]]; then
          $SUDO nohup tor &
        fi
        sleep 2
        pgrep -f tor >/dev/null || { echo "Failed to start Tor manually" >&2; exit 1; }
      fi
    fi
  else
    echo "No changes to torrc; no restart needed" >&2
  fi
}

# Main execution
main() {
  detect_os
  command -v tor &>/dev/null || install_tor
  add_user_to_tor_group
  configure_torrc
  adjust_permissions
  restart_tor_service
  echo "Tor setup complete for user $USERNAME with $TOR_SERVICE" >&2
}

main
