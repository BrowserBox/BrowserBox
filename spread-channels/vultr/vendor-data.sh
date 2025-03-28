#!/usr/bin/env bash
################################################
# Vultr Marketplace User-Data Script for BrowserBox
# Updated: March 02, 2025 - xAI Edition
################################################

# Prerequisites
chmod +x /root/vultr-helper.sh 2>/dev/null || true
. /root/vultr-helper.sh 2>/dev/null || true
error_detect_on
install_cloud_init latest

# Fetch Vultr Marketplace vars
export HOSTNAME="$(curl -s -H "METADATA-TOKEN: vultr" http://169.254.169.254/v1/internal/app-hostname)"
export TOKEN="$(curl -s -H "METADATA-TOKEN: vultr" http://169.254.169.254/v1/internal/app-token)"
export EMAIL="$(curl -s -H "METADATA-TOKEN: vultr" http://169.254.169.254/v1/internal/app-email)"
export LICENSE_KEY="${LICENSE_KEY:-$(curl -s -H "METADATA-TOKEN: vultr" http://169.254.169.254/v1/internal/app-license_key 2>/dev/null)}"

# Default config (can be overridden via Marketplace vars)
export INSTALL_DOC_VIEWER="${INSTALL_DOC_VIEWER:-false}"

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

add_user() {
  local username=$1
  local distro=$(get_distro)
  case $distro in
    debian|ubuntu|linuxmint|pop|elementary|kali|mx|mxlinux|zorinos)
      adduser --gecos "" --disabled-password "$username" || fail "User add failed"
      ;;
    centos|fedora|rhel|redhatenterpriseserver|almalinux|rocky|ol|oraclelinux|scientific|amzn)
      adduser "$username" && passwd -d "$username" || fail "User add failed"
      ;;
    *)
      fail "Unsupported distro: $distro"
      ;;
  esac
}

# Validate inputs
[ -z "$EMAIL" ] || [ -z "$HOSTNAME" ] || [ -z "$LICENSE_KEY" ] && fail "EMAIL, HOSTNAME, and LICENSE_KEY required"

# Setup system
install_packages
username="pro"
if ! id "$username" &>/dev/null; then
  add_user "$username"
  echo "$username ALL=(ALL) NOPASSWD:/usr/bin/git,/usr/bin/bash" > /etc/sudoers.d/$username
  chmod 0440 /etc/sudoers.d/$username || fail "Sudoers setup failed"
fi

# Deploy BrowserBox
su - "$username" <<EOF
  cd "/home/$username" || cd "\$HOME" || fail "Cannot access home dir"
  for i in {1..3}; do git clone https://github.com/BrowserBox/BrowserBox.git && break || sleep 5; done
  [ -d "BrowserBox" ] || fail "Git clone failed"
  cd BrowserBox || fail "Cannot enter BrowserBox dir"
  
  export LICENSE_KEY="$LICENSE_KEY"
  export INSTALL_DOC_VIEWER="$INSTALL_DOC_VIEWER"
  export BB_USER_EMAIL="$EMAIL"
  
  ./deploy-scripts/wait_for_hostname.sh "$HOSTNAME" || fail "Hostname wait failed"
  ./deploy-scripts/tls "$HOSTNAME" || fail "TLS setup failed"
  mkdir -p "/home/$username/sslcerts" && ./deploy-scripts/cp_certs "$HOSTNAME" "/home/$username/sslcerts" || fail "Cert copy failed"
  
  # Wait for commands to be available
  for cmd in setup_bbpro bbcertify bbpro; do
    timeout 120 bash -c "until command -v \$cmd >/dev/null 2>&1; do sleep 5; done" || fail "\$cmd not available after 120s"
  done
  
  # Generate token if not provided
  [ -z "$TOKEN" ] && TOKEN="\$(openssl rand -hex 16 2>/dev/null || head /dev/urandom | tr -dc 'a-f0-9' | head -c 32)"
  echo "Login token: \$TOKEN" > "/home/$username/token.txt"
  
  setup_bbpro --port 8080 --token "\$TOKEN" || fail "Setup failed"
  bbcertify || fail "Certification failed - check LICENSE_KEY"
  bbpro &>> "/home/$username/bbpro.log" & disown
  pm2 save || fail "PM2 save failed"
  
  # Auto-start with PM2
  pm2_cmd="\$(pm2 startup | grep -v '^\[PM2\]' | awk '/^sudo env/')"
  [ -n "\$pm2_cmd" ] && eval "\$pm2_cmd" || log "Warning: PM2 startup command not set"
EOF

# Final checks
log "BrowserBox deployed! Access: https://$HOSTNAME:8080/login?token=$TOKEN"
log "Logs: /home/$username/bbpro.log, Token: /home/$username/token.txt"
exit 0
