#!/usr/bin/env bash
################################################
# Vultr Marketplace User-Data Script for BrowserBox
# Updated: May 04, 2025 - xAI Edition
################################################

set -x

# Prerequisites
chmod +x /root/vultr-helper.sh 2>/dev/null || true
. /root/vultr-helper.sh 2>/dev/null || true
error_detect_on
install_cloud_init latest

# Utility functions
log() { echo "$@" >&2; }
fail() { log "Error: $1"; exit 1; }

get_distro() {
  [ -f /etc/os-release ] || fail "Cannot detect distro"
  . /etc/os-release
  echo "$ID"
}

install_packages() {
  local distro=$(get_distro)
  case $distro in
    debian|ubuntu|linuxmint|pop|elementary|kali|mx|mxlinux|zorinos)
      export DEBIAN_FRONTEND=noninteractive
      export NEEDRESTART_SUSPEND=1
      export NEEDRESTART_MODE=a
      apt-get update && apt-get -y upgrade || fail "APT update failed"
      apt-get install -y git || fail "Git install failed"
      ;;
    centos|fedora|rhel|redhatenterpriseserver|almalinux|rocky|ol|oraclelinux|scientific|amzn)
      yum update -y && yum install -y git || fail "YUM install failed"
      ;;
    *)
      fail "Unsupported distro: $distro"
      ;;
  esac
}

ensure_curl() {
  if command -v curl >/dev/null 2>&1; then
    echo "✅ curl is already installed"
    return 0
  fi

  echo "🔍 curl not found. Attempting to install..."

  OS="$(uname -s)"
  case "$OS" in
    Linux)
      if [ -f /etc/os-release ]; then
        . /etc/os-release
        case "$ID" in
          ubuntu|debian)
            sudo apt update && sudo apt install -y curl
            ;;
          alpine)
            sudo apk update && sudo apk add curl
            ;;
          fedora)
            sudo dnf check-update || true
            sudo dnf install -y curl
            ;;
          centos|rhel)
            sudo yum check-update || true
            sudo yum install -y curl
            ;;
          arch)
            sudo pacman -Sy --noconfirm curl
            ;;
          *)
            echo "❌ Unsupported Linux distro: $ID"
            return 1
            ;;
        esac
      else
        echo "❌ Unknown Linux system"
        return 1
      fi
      ;;
    Darwin)
      echo "Detected macOS"
      if command -v brew >/dev/null 2>&1; then
        brew update && brew install curl
      else
        echo "❌ Homebrew not found. Install Homebrew from https://brew.sh/"
        return 1
      fi
      ;;
    OpenBSD)
      doas pkg_add -u curl || doas pkg_add curl
      ;;
    FreeBSD)
      sudo pkg update && sudo pkg install -y curl
      ;;
    *)
      echo "❌ Unsupported OS: $OS"
      return 1
      ;;
  esac

  # Final check
  if command -v curl >/dev/null 2>&1; then
    echo "✅ curl installed successfully"
    return 0
  else
    echo "❌ curl installation failed"
    return 1
  fi
}

# Ensure curl is available before fetching metadata
ensure_curl || fail "curl is required for metadata fetching"

# Fetch Vultr Marketplace vars
export HOSTNAME="$(curl --connect-timeout 15 -s -H "METADATA-TOKEN: vultr" http://169.254.169.254/v1/internal/app-hostname)"
export TOKEN="$(curl --connect-timeout 15 -s -H "METADATA-TOKEN: vultr" http://169.254.169.254/v1/internal/app-token)"
export EMAIL="$(curl --connect-timeout 15 -s -H "METADATA-TOKEN: vultr" http://169.254.169.254/v1/internal/app-email)"
export LICENSE_KEY="${LICENSE_KEY:-$(curl --connect-timeout 15 -s -H "METADATA-TOKEN: vultr" http://169.254.169.254/v1/internal/app-license_key 2>/dev/null)}"

# Default config (can be overridden via Marketplace vars)
export INSTALL_DOC_VIEWER="${INSTALL_DOC_VIEWER:-false}"

# Validate inputs
[ -z "$EMAIL" ] || [ -z "$HOSTNAME" ] || [ -z "$LICENSE_KEY" ] && fail "EMAIL, HOSTNAME, and LICENSE_KEY required"
install_packages

export BBX_HOSTNAME="${HOSTNAME:-localhost}"
export EMAIL="${EMAIL:-test@example.com}"
export LICENSE_KEY="${LICENSE_KEY:-TEST-KEY-1234-5678-90AB-CDEF-GHIJ-KLMN-OPQR}"
export BBX_TEST_AGREEMENT="${BBX_TEST_AGREEMENT:-true}"
export INSTALL_DOC_VIEWER="$INSTALL_DOC_VIEWER"
export BB_USER_EMAIL="$EMAIL"
export BBX_INSTALL_USER="browserbox"
RAND="$(openssl rand -hex 16 2>/dev/null || head /dev/urandom | tr -dc 'a-f0-9' | head -c 32)"
[ -z "$RAND" ] && fail "Failed to generate random token"
export TOKEN="${TOKEN:-$RAND}"

export username="${BBX_INSTALL_USER}"
yes yes | bash <(curl --connect-timeout 22 -sSL bbx.sh.dosaygo.com) install

# Deploy BrowserBox as the 'browserbox' user
su - "$username" <<EOF
  cd "/home/$username" || cd "\$HOME" || fail "Cannot access home dir"

  log() { echo "$@" >&2; }

  fail() { log "Error: $1"; exit 1; }

  source ~/.nvm/nvm.sh
  export TOKEN="$TOKEN"
  export LICENSE_KEY="$LICENSE_KEY"
  
  # Wait for commands to be available
  for cmd in bbx setup_bbpro bbcertify bbpro; do
    log "Waiting for \$cmd to be available..."
    timeout 120 bash -c "until command -v \$cmd >/dev/null 2>&1; do sleep 5; done" || fail "\$cmd not available after 120s"
  done
  
  # Generate token if not provided
  echo "Login token: $TOKEN" > "/home/$username/token.txt"
  
  bbx setup --port 8080 --token "$TOKEN" || fail "Setup failed"
  bbcertify || fail "Certification failed - check LICENSE_KEY"
  bbx run
  pm2 save || fail "PM2 save failed"
  
  # Set up PM2 to auto-start BrowserBox on boot
  pm2_cmd="\$(pm2 startup | grep -v '^\[PM2\]' | awk '/^sudo env/')"
  if [ -n "\$pm2_cmd" ]; then
    eval "\$pm2_cmd" || log "Warning: Failed to execute PM2 startup command"
  else
    log "Warning: PM2 startup command not found; auto-start not configured"
  fi
  exit 0
EOF

# Final checks
log "Token: /home/$username/token.txt"
log "BrowserBox deployed! Access: https://$HOSTNAME:8080/login?token=$TOKEN"
log "BrowserBox Login Link: $(cat /home/$username/.config/dosyago/bbpro/login.link)"

exit 0

