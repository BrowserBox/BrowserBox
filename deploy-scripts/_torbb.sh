#!/usr/bin/env bash

# Global Variables
OS_TYPE=""
TOR_INSTALLED=false
SUDO=""
TORRC=""
TORDIR=""
TOR_GROUP=""
torsslcerts="tor-sslcerts"

if command -v sudo &>/dev/null; then
  SUDO="sudo -n"
fi

# Set the correct Tor group based on the OS (you can adjust this based on your script's logic)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  if [ -f /etc/debian_version ]; then
    TOR_GROUP="debian-tor"
  elif [ -f /etc/centos-release ] || [ -f /etc/redhat-release ]; then
    TOR_GROUP="toranon"
  elif [ -f /etc/arch-release ]; then
    TOR_GROUP="tor"
  fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
  TOR_GROUP="admin"
else
  echo "Unsupported OS" >&2
  exit 1
fi

# Check if the user is in the Tor group
if id -nG "$USER" | grep -qw "$TOR_GROUP"; then
  echo "User $USER is in the correct Tor group ($TOR_GROUP)." >&2
else
  echo "Error: User $USER is not in the $TOR_GROUP group." >&2
  echo "Please run 'sudo setup_tor $USER' to configure Tor for this user." >&2
  exit 1
fi

initialize_package_manager() {
  local package_manager

  if [[ "$OSTYPE" == darwin* ]]; then
    package_manager=$(command -v brew)
  elif command -v apt &>/dev/null; then
    package_manager=$(command -v apt)
    if command -v apt-get &>/dev/null; then
      source non-interactive.sh >&2
    fi
  elif command -v dnf >/dev/null; then
    package_manager="$(command -v dnf) --best --allowerasing --skip-broken"
  else
    echo "No supported package manager found. Exiting." >&2
    return 1
  fi

  echo "Using package manager: $package_manager" >&2
  export APT=$package_manager
}

initialize_package_manager

ensure_shutdown() {
  pm2 delete all
}

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

  mkcert_dir="$(mkcert -CAROOT 2>/dev/null)"

  if [[ -n "$mkcert_dir" ]]; then
    echo "$mkcert_dir"
    return 0
  fi

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
  else
    TORRC="/etc/tor/torrc"  # Default path for Linux distributions
    TORDIR="/var/lib/tor"
  fi
  echo "$TORRC"
}

get_normalized_arch() {
  local arch=$(dpkg --print-architecture || uname -m) # This is widely supported across different Unix-like systems

  # Normalize x86_64 to amd64
  if [ "$arch" = "x86_64" ]; then
    echo "amd64"
  else
    echo "$arch"
  fi
}

setup_mkcert() {
  echo "Setting up mkcert..." >&2
  if ! command -v mkcert &>/dev/null; then
    if [ "$(os_type)" == "macOS" ]; then
      brew install nss mkcert
    elif [ "$(os_type)" == "win" ]; then
      choco install mkcert || scoop bucket add extras && scoop install mkcert
    else
      amd64="$(get_normalized_arch)"
      if [[ "${OS_TYPE}" == "centos" ]]; then
        $SUDO "$APT" install -y nss-tools
      else
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

# Detect Operating System
detect_os() {
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if [ -f /etc/debian_version ]; then
      OS_TYPE="debian"
    elif [ -f /etc/centos-release ]; then
      OS_TYPE="centos"
    elif [ -f /etc/amazon-linux-release ]; then
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
  echo "Adding Tor repository for Debian/Ubuntu..." >&2
  $SUDO apt-get update
  $SUDO apt-get install -y apt-transport-https gpg
  wget -qO- https://deb.torproject.org/torproject.org/A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89.asc | gpg --import
  gpg --export A3C4F0F979CAA22CDBA8F512EE8CBC9E886DDD89 | $SUDO apt-key add -
  echo "deb https://deb.torproject.org/torproject.org $(lsb_release -sc) main" | $SUDO tee /etc/apt/sources.list.d/tor.list
  $SUDO apt-get update
  $SUDO apt-get install -y tor deb.torproject.org-keyring
  TOR_INSTALLED=true
}

# Function to install Tor based on OS
install_tor() {
  case $OS_TYPE in
    debian)
      add_tor_repository_debian
      ;;
    centos)
      $SUDO yum install -y epel-release || $SUDO dnf install -y epel-release
      $SUDO yum install -y tor || $SUDO dnf install -y tor
      TOR_INSTALLED=true
      ;;
    macos)
      brew install tor
      TOR_INSTALLED=true
      ;;
  esac
}

# Function to add hidden service via Control Port
add_hidden_service_via_control_port() {
  local service_port="$1"
  local tor_control_port=9051
  local tor_cookie_file="${TORDIR}/control_auth_cookie"

  # Read the authentication cookie
  local tor_cookie_hex="$(xxd -u -p -c32 < "$tor_cookie_file")"

  # Build the control port command
  local control_command=$(printf 'AUTHENTICATE %s\r\nADD_ONION NEW:ED25519-V3 Flags=Detach Port=443,127.0.0.1:%s\r\nQUIT\r\n' "$tor_cookie_hex" "$service_port")

  echo "Using Tor command: $control_command" >&2

  # Send the command and capture the response
  local response=$(echo -e "$control_command" | nc localhost $tor_control_port)

  echo "Got Tor response: $response" >&2

  # Extract the Onion address from the response
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
      local hidden_service_dir="${TORDIR}/hidden_service_$service_port"

      # Use sudo for file existence check on Debian and CentOS
      if [[ "${OS_TYPE}" != "macos" ]]; then
        if ! $SUDO test -f "$hidden_service_dir/hostname"; then
          all_exist=0
          break
        fi
      else
        if [[ ! -f "$hidden_service_dir/hostname" ]]; then
          all_exist=0
          break
        fi
      fi
    done
    if [[ $all_exist -eq 0 ]]; then
      sleep 1  # Wait for a second before checking again
    fi
  done
}


# Function to configure Tor and export onion addresses
configure_and_export_tor() {
  local base_port=$((APP_PORT - 2))
  echo "Setting up tor hidden services..." >&2
  for i in {0..4}; do
    local service_port=$((base_port + i))
    local hidden_service_dir="${TORDIR}/hidden_service_$service_port"
    local dirLine="HiddenServiceDir $hidden_service_dir"

    if $SUDO test -d "$hidden_service_dir"; then
      $SUDO rm -rf "$hidden_service_dir"
    fi

    if ! grep -qF -- "$dirLine" "$TORRC"; then
      if [[ "${OS_TYPE}" != "macos" ]]; then
        echo "$dirLine" | $SUDO tee -a "$TORRC"
        echo "HiddenServicePort 443 127.0.0.1:$service_port" | $SUDO tee -a "$TORRC"
      else
        echo "$dirLine" |  tee -a "$TORRC"
        echo "HiddenServicePort 443 127.0.0.1:$service_port" |  tee -a "$TORRC"
      fi
    fi

    if [[ "${OS_TYPE}" != "macos" ]]; then
      $SUDO mkdir -p "$hidden_service_dir"
      if [[ "${OS_TYPE}" == "centos" ]]; then
        $SUDO chown toranon:toranon "$hidden_service_dir"
      else
        $SUDO chown debian-tor:debian-tor "$hidden_service_dir"
      fi
      $SUDO chmod 700 "$hidden_service_dir"
    else
      mkdir -p "$hidden_service_dir"
      chmod 700 "$hidden_service_dir"
    fi
  done

  echo "Restarting tor..." >&2
  if [[ "$OS_TYPE" == "macos" ]]; then
    brew services restart tor &> /dev/null
  else
    $SUDO systemctl restart tor &> /dev/null
  fi

  echo "Waiting for onion services to connect..." >&2
  wait_for_hostnames

  echo "Creating HTTPS TLS certs for onion domains..." >&2
  setup_mkcert
  for i in {0..4}; do
    local service_port=$((base_port + i))
    local hidden_service_dir="${TORDIR}/hidden_service_${service_port}"
    local onion_address="$($SUDO cat "${hidden_service_dir}/hostname")"
    export "ADDR_$service_port=$onion_address"
    echo $service_port $onion_address

    # we user scope these certs as the addresses while distinct do not differentiate on ports
    # and anyway probably a good idea to keep a user's onion addresses private rather than put them in a globally shared location

    local cert_dir="$HOME/${torsslcerts}/${onion_address}"
    mkdir -p "${cert_dir}"
    if ! mkcert -cert-file "${cert_dir}/fullchain.pem" -key-file "${cert_dir}/privkey.pem" "$onion_address" &>/dev/null; then
      echo "mkcert failed for $onion_address" >&2
      echo "mkcert needs to work. exiting..." >&2
      exit 1
    fi
  done
}

get_ssh_port() {
  local ssh_port=$(grep -i '^Port ' /etc/ssh/sshd_config | awk '{print $2}')

  # If no port is found, assume the default SSH port
  if [ -z "$ssh_port" ]; then
    ssh_port=22
  fi

  echo "$ssh_port"
}

# Function to manage the firewall
manage_firewall() {
  echo "Closing firewall (except ssh)..." >&2
  case $OS_TYPE in
    debian | centos)
      $SUDO ufw allow "$(get_ssh_port)" &> /dev/null
      $SUDO ufw --force enable &> /dev/null
      ;;
    macos)
      # MacOS firewall configurations are typically done through the GUI
      echo "Warning: Please ensure your firewall is enabled in macOS Settings." >&2
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
  if command -v tor &>/dev/null; then
    export TOR_INSTALLED=true
  else
    install_tor
  fi
  source ~/.config/dosyago/bbpro/test.env || { echo "bb environment not found. please run setup_bbpro first." >&2; exit 1; }
  if [[ -z "${CONFIG_DIR}" ]]; then
    echo "CONFIG_DIR not set. Run setup_bbpro again before torbb." >&2
    echo "Exiting..."
    exit 1
  fi

  [[ $APP_PORT =~ ^[0-9]+$ ]] || { echo "Invalid APP_PORT" >&2; exit 1; }

  echo "Ensuring any other bbpro $USER was running is shutdown..." >&2
  ensure_shutdown &>/dev/null

  find_torrc_path

  if [[ "$OSTYPE" == darwin* ]]; then
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

      # Generate TLS certificates for the onion address
      cert_dir="$HOME/${torsslcerts}/${onion_address}"
      setup_mkcert
      mkdir -p "${cert_dir}"
      if ! mkcert -cert-file "${cert_dir}/fullchain.pem" -key-file "${cert_dir}/privkey.pem" "$onion_address" &>/dev/null; then
        echo "mkcert failed for $onion_address" >&2
        echo "mkcert needs to work. exiting..." >&2
        exit 1
      fi
    done
  fi

  cert_root=$(find_mkcert_root_ca)

  # modify setup file
cat > "${CONFIG_DIR}/torbb.env" <<EOF
source "${CONFIG_DIR}/test.env"
export TORBB=true
export TORCA_CERT_ROOT="${cert_root}"
export SSLCERTS_DIR="${torsslcerts}"

EOF
  base_port=$((APP_PORT - 2))
  for i in {0..4}; do
    service_port=$((base_port + i))
    ref="ADDR_$service_port"
    echo "export ${ref}=${!ref}" >> "${CONFIG_DIR}/torbb.env"
  done

  # Run bbpro
  export TORBB=true
  echo -n "Starting bbpro..." >&2
  if ! bbpro &>/dev/null; then
    echo "bbpro failed to start..." >&2
    echo "Exiting..."
    exit 1
  fi
  echo "Started!" >&2
} >&2

ref="ADDR_${APP_PORT}"
cert_file="$HOME/${torsslcerts}/${!ref}/fullchain.pem"
DOMAIN="${!ref}"

LOGIN_LINK="https://${DOMAIN}/login?token=${LOGIN_TOKEN}"
echo "$LOGIN_LINK" > "${CONFIG_DIR}/login.link"
echo "Login link for Tor hidden service BB instance:" >&2
echo "$LOGIN_LINK"

