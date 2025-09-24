#!/usr/bin/env bash
# _setup_zerotier.sh - Install and configure ZeroTier and SSH for tunneling.
# This script is intended to be run with sudo.

if [ "$(id -u)" -ne 0 ]; then
  echo "This script must be run as root. Please use sudo." >&2
  exit 1
fi

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: sudo $0 <username> <path_to_public_ssh_key>" >&2
  exit 1
fi

USERNAME="$1"
SSH_KEY_PATH="$2"
OS_TYPE=""

# --- OS Detection ---
detect_os() {
  if [[ "$(uname -s)" == "Darwin" ]]; then
    OS_TYPE="macos"
  elif [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_TYPE="$ID"
  else
    echo "Unsupported OS." >&2
    exit 1
  fi
}

# --- ZeroTier Installation ---
install_zerotier() {
  if command -v zerotier-cli &>/dev/null; then
    echo "ZeroTier is already installed." >&2
    return 0
  fi
  echo "Installing ZeroTier..." >&2
  if [[ "$OS_TYPE" == "macos" ]]; then
    # On macOS, we need to run brew as the original user
    if [ -n "$SUDO_USER" ]; then
      sudo -u "$SUDO_USER" brew install zerotier
    else
      echo "Cannot determine non-sudo user to run Homebrew. Please install ZeroTier manually." >&2
      exit 1
    fi
  else
    # Use the official installer for Linux, which handles various distributions
    curl -s https://install.zerotier.com | bash
  fi
  command -v zerotier-cli &>/dev/null || { echo "Failed to install ZeroTier." >&2; exit 1; }
}

# --- SSH Server Installation & Configuration ---
setup_ssh_server() {
  echo "Setting up SSH server..." >&2
  case "$OS_TYPE" in
    ubuntu|debian)
      apt-get update && apt-get install -y openssh-server
      systemctl enable ssh --now
      ;;
    centos|rhel|almalinux|rocky)
      yum install -y openssh-server || dnf install -y openssh-server
      systemctl enable sshd --now
      ;;
    macos)
      # macOS has a built-in SSH server, we just need to enable it.
      systemsetup -setremotelogin on
      ;;
    *)
      echo "Cannot auto-install SSH server on $OS_TYPE. Please install it manually." >&2
      exit 1
      ;;
  esac
}

# --- Authorize User's SSH Key ---
authorize_ssh_key() {
  local user_home
  user_home=$(getent passwd "$USERNAME" | cut -d: -f6)
  if [ -z "$user_home" ]; then
    echo "Could not determine home directory for user $USERNAME" >&2
    return 1
  fi

  local ssh_dir="$user_home/.ssh"
  local auth_keys_file="$ssh_dir/authorized_keys"
  local ssl_certs_dir="$user_home/sslcerts"

  echo "Authorizing SSH key for $USERNAME..." >&2
  mkdir -p "$ssh_dir"
  # Ensure the key isn't already present before adding
  if ! grep -q -f "$SSH_KEY_PATH" "$auth_keys_file" 2>/dev/null; then
      cat "$SSH_KEY_PATH" >> "$auth_keys_file"
  fi
  
  # Create the directory for certs
  mkdir -p "$ssl_certs_dir"

  chown -R "$USERNAME":"$(id -gn "$USERNAME")" "$ssh_dir" "$ssl_certs_dir"
  chmod 700 "$ssh_dir"
  chmod 600 "$auth_keys_file"
  # Set permissions for sslcerts dir separately
  chmod 755 "$ssl_certs_dir"
}

# --- Main Execution ---
main() {
  detect_os
  install_zerotier
  setup_ssh_server
  authorize_ssh_key

  # The bbx script will handle joining the network and getting the IP.
  echo "ZeroTier and SSH setup complete for user $USERNAME." >&2
}

main "$@"
