#!/usr/bin/env bash

set -x

# Global Variables
OS_TYPE=""
TOR_INSTALLED=false
SUDO=""
TORRC=""
TORDIR=""
TOR_GROUP=""
TOR_SERVICE="tor@default"  # Added for Linux instance-based setups
torsslcerts="tor-sslcerts"

if command -v sudo &>/dev/null; then
  SUDO="sudo -n"
fi

# Set the correct Tor group based on the OS
detect_os() {
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if [ -f /etc/debian_version ]; then
      OS_TYPE="debian"
      TOR_GROUP="debian-tor"
    elif [ -f /etc/centos-release ] || [ -f /etc/redhat-release ]; then
      OS_TYPE="centos"
      TOR_GROUP="toranon"
    elif [ -f /etc/arch-release ]; then
      OS_TYPE="arch"
      TOR_GROUP="tor"
    elif [ -f /etc/amazon-linux-release ]; then
      OS_TYPE="centos"  # Treat Amazon Linux as CentOS-like
      TOR_GROUP="toranon"
    else
      echo "Unsupported Linux distribution" >&2
      exit 1
    fi
    TORRC="/etc/tor/torrc"
    TORDIR="/var/lib/tor"
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS_TYPE="macos"
    TOR_GROUP="admin"
    prefix=$(brew --prefix tor)
    TORRC="$prefix/etc/tor/torrc"
    TORDIR="$prefix/var/lib/tor"
    mkdir -p "$TORDIR"
    [ -f "$TORRC" ] || cp "$prefix/etc/tor/torrc.sample" "$TORRC"
  elif [[ "$OSTYPE" == "MINGW"* || "$OSTYPE" == "MSYS"* || "$OSTYPE" == "cygwin"* ]]; then
    OS_TYPE="win"
    TOR_GROUP=""  # Windows doesn’t use groups this way
    TORRC="$HOME/tor/torrc"  # Adjust as needed for Windows Tor install
    TORDIR="$HOME/tor/data"
  else
    echo "Unsupported OS" >&2
    exit 1
  fi
  COOKIE_AUTH_FILE="$TORDIR/control_auth_cookie"
}

# Check if the user is in the Tor group
check_tor_group() {
  if [[ "$OS_TYPE" == "macos" || "$OS_TYPE" == "win" ]]; then
    echo "No group check needed for $OS_TYPE" >&2
  elif id -nG "$USER" | grep -qw "$TOR_GROUP"; then
    echo "User $USER is in the correct Tor group ($TOR_GROUP)." >&2
  else
    echo "Error: User $USER is not in the $TOR_GROUP group." >&2
    echo "Please run 'sudo setup_tor $USER' to configure Tor for this user." >&2
    exit 1
  fi
}

initialize_package_manager() {
  local package_manager
  if [[ "$OS_TYPE" == "macos" ]]; then
    package_manager=$(command -v brew)
  elif [[ "$OS_TYPE" == "win" ]]; then
    package_manager=$(command -v choco || command -v scoop)
  elif command -v apt &>/dev/null; then
    package_manager=$(command -v apt)
    if command -v apt-get &>/dev/null; then
      source non-interactive.sh >&2  # Restore legacy dependency
    fi
  elif command -v dnf >/dev/null; then
    package_manager="$(command -v dnf) --best --allowerasing --skip-broken"
  elif command -v pacman >/dev/null; then
    package_manager=$(command -v pacman)
  else
    echo "No supported package manager found. Exiting." >&2
    return 1
  fi
  echo "Using package manager: $package_manager" >&2
  export APT=$package_manager
}

ensure_shutdown() {
  pm2 delete all
}

os_type() {
  case "$(uname -s)" in
    Darwin*) echo "macOS";;
    Linux*)  echo "Linux";;
    MING*|MSYS*|CYGWIN*) echo "win";;
    *)       echo "unknown";;
  esac
}

find_mkcert_root_ca() {
  local mkcert_dir=""
  mkcert_dir="$(mkcert -CAROOT 2>/dev/null)"
  if [[ -n "$mkcert_dir" ]]; then
    echo "$mkcert_dir"
    return 0
  fi
  case "$(uname)" in
    "Linux") mkcert_dir="$HOME/.local/share/mkcert";;
    "Darwin") mkcert_dir="$HOME/Library/Application Support/mkcert";;
    "MINGW"*|"MSYS"*|"CYGWIN"*) mkcert_dir="$HOME/AppData/Local/mkcert";;
    *) echo "Unsupported OS for mkcert root ca location finding" >&2; return 1;;
  esac
  if [ -d "$mkcert_dir" ]; then
    echo "$mkcert_dir"
  else
    echo "warning: mkcert directory not found in the expected location." >&2
    return 1
  fi
}

find_torrc_path() {
  if [[ "$OS_TYPE" == "macos" ]]; then
    prefix=$(brew --prefix tor)
    TORRC=$(node -p "path.resolve('${prefix}/../../etc/tor/torrc')")
    TORDIR=$(node -p "path.resolve('${prefix}/../../var/lib/tor')")
    mkdir -p "$TORDIR"
    if [[ ! -f "$TORRC" ]]; then
      cp "$(dirname "$TORRC")/torrc.sample" "$(dirname "$TORRC")/torrc" || touch "$TORRC"
    fi
  elif [[ "$OS_TYPE" == "win" ]]; then
    TORRC="$HOME/tor/torrc"
    TORDIR="$HOME/tor/data"
    mkdir -p "$TORDIR"
    [ -f "$TORRC" ] || touch "$TORRC"
  else
    TORRC="/etc/tor/torrc"
    TORDIR="/var/lib/tor"
  fi
  COOKIE_AUTH_FILE="$TORDIR/control_auth_cookie"
  echo "$TORRC"
}

get_normalized_arch() {
  local arch=$(dpkg --print-architecture || uname -m)
  if [ "$arch" = "x86_64" ]; then
    echo "amd64"
  else
    echo "$arch"
  fi
}

setup_mkcert() {
  echo "Setting up mkcert..." >&2
  if ! command -v mkcert &>/dev/null; then
    if [ "$OS_TYPE" == "macos" ]; then
      brew install nss mkcert
    elif [ "$OS_TYPE" == "win" ]; then
      choco install mkcert || { scoop bucket add extras && scoop install mkcert; }
    else
      amd64="$(get_normalized_arch)"
      if [[ "$OS_TYPE" == "centos" ]]; then
        $SUDO "$APT" install -y nss-tools
      elif [[ "$OS_TYPE" == "debian" || "$OS_TYPE" == "arch" ]]; then
        $SUDO "$APT" install -y libnss3-tools
      fi
      curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/${amd64}"
      chmod +x mkcert-v*-linux-"$amd64"
      $SUDO cp mkcert-v*-linux-"$amd64" /usr/local/bin/mkcert
      rm mkcert-v*
    fi
    mkcert -install
  fi
}

# Install Tor
install_tor() {
  if command -v tor &>/dev/null; then
    export TOR_INSTALLED=true
    echo "Tor is installed" >&2
    return
  fi
  case $OS_TYPE in
    debian)
      echo "Adding Tor repository for Debian..." >&2
      $SUDO apt-get update
      $SUDO apt-get install -y apt-transport-https gpg
      wget -qO- https://deb.torproject.org/torproject.org/A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89.asc | gpg --import
      gpg --export A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89 | $SUDO apt-key add -
      echo "deb https://deb.torproject.org/torproject.org $(lsb_release -sc) main" | $SUDO tee /etc/apt/sources.list.d/tor.list
      $SUDO apt-get update
      $SUDO apt-get install -y tor deb.torproject.org-keyring
      TOR_INSTALLED=true
      ;;
    centos)
      $SUDO yum install -y epel-release || $SUDO dnf install -y epel-release
      $SUDO yum install -y tor || $SUDO dnf install -y tor
      TOR_INSTALLED=true
      ;;
    arch)
      $SUDO pacman -Sy --noconfirm tor
      TOR_INSTALLED=true
      ;;
    macos)
      brew install tor
      TOR_INSTALLED=true
      ;;
    win)
      echo "Please install Tor manually on Windows: https://www.torproject.org/download/" >&2
      exit 1  # Manual install required for Windows
      ;;
  esac
}

# Add hidden service via Control Port
add_hidden_service_via_control_port() {
  local service_port="$1"
  local tor_control_port=9051
  local tor_cookie_file="$COOKIE_AUTH_FILE"
  if [[ ! -f "$tor_cookie_file" ]]; then
    tor_cookie_file="${HOME}/.tor/control_auth_cookie"
  fi
  local tor_cookie_hex=$( [[ "$OS_TYPE" == "macos" || "$OS_TYPE" == "win" ]] && xxd -u -p -c32 < "$tor_cookie_file" || $SUDO xxd -u -p -c32 < "$tor_cookie_file" )
  local control_command=$(printf 'AUTHENTICATE %s\r\nADD_ONION NEW:ED25519-V3 Flags=Detach Port=443,127.0.0.1:%s\r\nQUIT\r\n' "$tor_cookie_hex" "$service_port")
  echo "Using Tor command: $control_command" >&2
  local response=$(echo -e "$control_command" | nc localhost $tor_control_port)
  echo "Got Tor response: $response" >&2
  local onion_address=$(echo "$response" | grep '^250-ServiceID=' | cut -d'=' -f2)
  if [[ -z "$onion_address" ]]; then
    echo "Failed to obtain Onion address for port $service_port." >&2
    echo "Response: $response" >&2
    exit 1
  fi
  addr=$(echo "$onion_address" | sed 's/[[:space:]]//g')
  echo "${addr}.onion"
}

wait_for_hostnames() {
  local base_port=$((APP_PORT - 2))
  local all_exist=0
  while [ $all_exist -eq 0 ]; do
    all_exist=1
    for i in {0..4}; do
      local service_port=$((base_port + i))
      local hidden_service_dir="$TORDIR/hidden_service_$service_port"
      if [[ "$OS_TYPE" == "macos" || "$OS_TYPE" == "win" ]]; then
        [ -f "$hidden_service_dir/hostname" ] || all_exist=0
      else
        $SUDO test -f "$hidden_service_dir/hostname" || all_exist=0
      fi
    done
    [ $all_exist -eq 0 ] && sleep 1
  done
}

# Configure Tor and export onion addresses (manual torrc method)
configure_and_export_tor() {
  local base_port=$((APP_PORT - 2))
  echo "Setting up tor hidden services..." >&2
  for i in {0..4}; do
    local service_port=$((base_port + i))
    local hidden_service_dir="$TORDIR/hidden_service_$service_port"
    local dirLine="HiddenServiceDir $hidden_service_dir"
    if [[ "$OS_TYPE" == "macos" || "$OS_TYPE" == "win" ]]; then
      [ -d "$hidden_service_dir" ] && rm -rf "$hidden_service_dir"
      if ! grep -qF -- "$dirLine" "$TORRC"; then
        echo "$dirLine" >> "$TORRC"
        echo "HiddenServicePort 443 127.0.0.1:$service_port" >> "$TORRC"
      fi
      mkdir -p "$hidden_service_dir"
      chmod 700 "$hidden_service_dir"
    else
      $SUDO test -d "$hidden_service_dir" && $SUDO rm -rf "$hidden_service_dir"
      if ! grep -qF -- "$dirLine" "$TORRC"; then
        echo "$dirLine" | $SUDO tee -a "$TORRC"
        echo "HiddenServicePort 443 127.0.0.1:$service_port" | $SUDO tee -a "$TORRC"
      fi
      $SUDO mkdir -p "$hidden_service_dir"
      $SUDO chown "$TOR_USER:$TOR_GROUP" "$hidden_service_dir"
      $SUDO chmod 770 "$hidden_service_dir"
    fi
  done

  echo "Restarting tor..." >&2
  if [[ "$OS_TYPE" == "macos" ]]; then
    brew services restart tor &>/dev/null
  elif [[ "$OS_TYPE" == "win" ]]; then
    echo "Restart Tor manually on Windows" >&2
    # Could add taskkill /IM tor.exe /F && start tor.exe if automated
  else
    $SUDO systemctl restart "$TOR_SERVICE" &>/dev/null
    if [[ -f /.dockerenv ]] || ! systemctl is-active "$TOR_SERVICE" >/dev/null 2>&1; then
      echo "Detected Docker or systemd failure, starting Tor manually..." >&2
      $SUDO pkill -x tor 2>/dev/null
      if [[ "$OS_TYPE" == "centos" ]]; then
        $SUDO -u "$TOR_GROUP" nohup tor &
      elif [[ "$OS_TYPE" == "debian" || "$OS_TYPE" == "arch" ]]; then
        $SUDO nohup tor &
      fi
      sleep 2
      if ! pgrep -f tor >/dev/null; then
        echo "Failed to start Tor manually" >&2
        exit 1
      fi
    fi
  fi

  echo "Waiting for onion services to connect..." >&2
  wait_for_hostnames

  echo "Creating HTTPS TLS certs for onion domains..." >&2
  setup_mkcert
  for i in {0..4}; do
    local service_port=$((base_port + i))
    local hidden_service_dir="$TORDIR/hidden_service_$service_port"
    local onion_address=$( [[ "$OS_TYPE" == "macos" || "$OS_TYPE" == "win" ]] && cat "$hidden_service_dir/hostname" || $SUDO cat "$hidden_service_dir/hostname" )
    export "ADDR_$service_port=$onion_address"
    echo "$service_port $onion_address" >&2
    local cert_dir="$HOME/$torsslcerts/$onion_address"
    mkdir -p "$cert_dir"
    if ! mkcert -cert-file "$cert_dir/fullchain.pem" -key-file "$cert_dir/privkey.pem" "$onion_address" &>/dev/null; then
      echo "mkcert failed for $onion_address" >&2
      exit 1
    fi
  done
}

get_ssh_port() {
  local ssh_port=$(grep -i '^Port ' /etc/ssh/sshd_config | awk '{print $2}')
  if [ -z "$ssh_port" ]; then
    ssh_port=22
  fi
  echo "$ssh_port"
}

manage_firewall() {
  echo "Closing firewall (except ssh)..." >&2
  case $OS_TYPE in
    debian|centos|arch)
      $SUDO ufw allow "$(get_ssh_port)" &>/dev/null
      $SUDO ufw --force enable &>/dev/null
      ;;
    macos)
      echo "Warning: Please ensure your firewall is enabled in macOS Settings." >&2
      ;;
    win)
      echo "Warning: Configure Windows Firewall manually to allow SSH and Tor." >&2
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
    exit 1
  fi

  detect_os
  check_tor_group
  initialize_package_manager
  if command -v tor &>/dev/null; then
    export TOR_INSTALLED=true
  else
    install_tor
  fi
  source ~/.config/dosyago/bbpro/test.env || { echo "bb environment not found. please run setup_bbpro first." >&2; exit 1; }
  [ -z "$CONFIG_DIR" ] && { echo "CONFIG_DIR not set. Run setup_bbpro again." >&2; exit 1; }
  [[ $APP_PORT =~ ^[0-9]+$ ]] || { echo "Invalid APP_PORT" >&2; exit 1; }

  echo "Ensuring any other bbpro $USER was running is shutdown..." >&2
  ensure_shutdown &>/dev/null

  find_torrc_path

  if [[ "$OS_TYPE" == "macos" || "$OS_TYPE" == "win" ]]; then
    [[ $TOR_INSTALLED == true ]] && configure_and_export_tor
    manage_firewall
  else
    manage_firewall
    base_port=$((APP_PORT - 2))
    echo "Setting up tor hidden services via Control Port..." >&2
    for i in {0..4}; do
      service_port=$((base_port + i))
      onion_address="$(add_hidden_service_via_control_port "$service_port")"
      export "ADDR_$service_port=$onion_address"
      echo "Onion address for port $service_port: $onion_address" >&2
      cert_dir="$HOME/$torsslcerts/$onion_address"
      setup_mkcert
      mkdir -p "$cert_dir"
      if ! mkcert -cert-file "$cert_dir/fullchain.pem" -key-file "$cert_dir/privkey.pem" "$onion_address" &>/dev/null; then
        echo "mkcert failed for $onion_address" >&2
        exit 1
      fi
    done
  fi

  cert_root=$(find_mkcert_root_ca)

  cat > "$CONFIG_DIR/torbb.env" <<EOF
source "$CONFIG_DIR/test.env"
export TORBB=true
export TORCA_CERT_ROOT="$cert_root"
export SSLCERTS_DIR="$torsslcerts"
EOF
  base_port=$((APP_PORT - 2))
  for i in {0..4}; do
    service_port=$((base_port + i))
    ref="ADDR_$service_port"
    echo "export $ref=${!ref}" >> "$CONFIG_DIR/torbb.env"
  done

  export TORBB=true
  echo -n "Starting bbpro..." >&2
  if ! bbpro &>/dev/null; then
    echo "bbpro failed to start..." >&2
    exit 1
  fi
  echo "Started!" >&2
} >&2

ref="ADDR_$APP_PORT"
cert_file="$HOME/$torsslcerts/${!ref}/fullchain.pem"
DOMAIN="${!ref}"
LOGIN_LINK="https://$DOMAIN/login?token=$LOGIN_TOKEN"
echo "$LOGIN_LINK" > "$CONFIG_DIR/login.link"
echo "Login link for Tor hidden service BB instance:" >&2
echo "$LOGIN_LINK"
