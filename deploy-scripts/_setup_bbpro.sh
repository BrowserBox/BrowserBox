#!/usr/bin/env bash

#set -x

trap 'echo "Got an error. Bailing this section..." >&2' ERR
trap 'echo "Exiting..." >&2' EXIT

OS_TYPE=""
TOR_PROXY=""
SUDO=""
ZONE=""
HAVE_SUDO=""

ONTOR=false
INJECT_SCRIPT=""
PORT=""
TOKEN=""
COOKIE=""
DOC_API_KEY=""

# Function to check if a command exists
command_exists() {
  command -v "$@" > /dev/null 2>&1
}

if command_exists sudo; then
  # we set -n here because setup_bbpro is designed to be used both non-interactively and by non-privileged users
  SUDO="sudo -n"
fi

check_sudo() {
  # Attempt to run a simple command using sudo that requires no real action
  # Redirect both stdout and stderr to /dev/null to suppress output
  if sudo -n true 2>/dev/null; then
    # If the command succeeds, sudo is available passwordlessly
    HAVE_SUDO="true"
  else
    # If the command fails, sudo either isn't available or requires a password
    HAVE_SUDO=""
  fi
}

# Call the function to check for passwordless sudo
check_sudo

if [ -n "$HAVE_SUDO" ]; then
  echo "Passwordless sudo is available." >&2
  SUDO="$SUDO"
else
  echo "Passwordless sudo is not available. Some things may not work, such as starting tor or opening the required ports on an internal firewall. Configure your user to possess passwordless sudo privileges if you need this, or ensure your user's BrowserBox ports are already open before running setup_bbpro. One way to do this is to run setup_bbpro $@ again from a sudo-privileged user to ensure the ports are open." >&2
  # empty out sudo so we don't try to run stuff with it
  # in other words we try running the stuff without sudo, which may or may not work, depending on your system
  SUDO=""
fi

if command_exists firewall-cmd; then
  ZONE="$($SUDO firewall-cmd --get-default-zone)"
fi

# Windows command for firewall
open_firewall_port_windows() {
  local port=$1
  netsh advfirewall firewall add rule name="Open Port $port" dir=in action=allow protocol=TCP localport=$port
}

is_port_free_windows() {
  local port=$1
  if netstat -ano | grep -q ":$port "; then
    return 1
  else
    return 0
  fi
}

ensure_certtools_windows() {
  if ! command -v openssl > /dev/null 2>&1; then
    echo "Installing OpenSSL..." >&2
    winget install -e --id OpenSSL.OpenSSL 1>&2
  fi
}

# Open port on CentOS
open_firewall_port_centos() {
  local port=$1
  $SUDO firewall-cmd --permanent --add-port="${port}/tcp" >&2
  $SUDO firewall-cmd --reload >&2 
}

is_port_free() {
  local port=$1
  if [[ "$port" =~ ^[0-9]+$ ]] && [ "$port" -ge 4022 ] && [ "$port" -le 65535 ]; then
    echo "$port valid port number." >&2
  else
    echo "$1" " invalid port number." >&2
    echo "" >&2
    echo "Select a main port between 4024 and 65533." >&2
    echo "" >&2
    echo "  Why 4024?" >&2
    echo "    This is because, by convention the browser runs on the port 3000 below the app's main port, and the first user-space port is 1024." >&2
    echo "" >&2
    echo "  Why 65533?" >&2
    echo "    This is because, each app occupies a slice of 5 consecutive ports, two below, and two above, the app's main port. The highest user-space port is 65535, hence the highest main port that leaves two above it free is 65533." >&2
    echo "" >&2
    return 1
  fi

  if [[ $(uname) == "Darwin" ]]; then
    if lsof -i tcp:"$port" > /dev/null 2>&1; then
      # If lsof returns a result, the port is in use
      return 1
    fi
	elif [[ "$OS_TYPE" == "win"* ]]; then
	  if ! is_port_free_windows "$PORT" &>/dev/null; then	
			return 1
    fi
  else
    # Prefer 'ss' if available, fall back to 'netstat'
    if command -v ss > /dev/null 2>&1; then
      if ! ss -lnt | awk '$4 ~ ":'$port'$" {exit 1}'; then
        return 1
      fi
    elif ! netstat -lnt | awk '$4 ~ ":'$port'$" {exit 1}'; then
      return 1
    fi
  fi

  return 0
}

# i like this version
is_port_free_new() {
  local port=$1
  if [[ "$port" =~ ^[0-9]+$ ]] && [ "$port" -ge 4022 ] && [ "$port" -le 65535 ]; then
    echo "$port is a valid port number." >&2
  else
    echo "$1 is an invalid port number." >&2
    echo "" >&2
    echo "Select a main port between 4024 and 65533." >&2
    echo "" >&2
    echo "  Why 4024?" >&2
    echo "    This is because, by convention the browser runs on the port 3000 below the app's main port, and the first user-space port is 1024." >&2
    echo "" >&2
    echo "  Why 65533?" >&2
    echo "    This is because each app occupies a slice of 5 consecutive ports, two below, and two above, the app's main port. The highest user-space port is 65535, hence the highest main port that leaves two above it free is 65533." >&2
    echo "" >&2
    return 1
  fi

  # Using direct TCP connection attempt to check port status
  if ! exec 6<>/dev/tcp/localhost/$port &>/dev/null; then
    echo "Port $port is available." >&2
    return 0
  else
    echo "Port $port is in use." >&2
    return 1
  fi
}

# Detect Operating System
detect_os() {
  if command_exists lsb_release ; then
    distro=$(lsb_release -is | tr '[:upper:]' '[:lower:]')
  elif [[ -f /etc/os-release ]]; then
    . /etc/os-release
    distro=$(echo "$ID")
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    distro="macos"
  elif [[ "$OSTYPE" == "msys"* ]]; then
    distro="win"
  else
    echo "ERROR: Cannot determine the distribution. Please email support@dosyago.com." >&2
    exit 1
  fi

  case "$distro" in
    centos|fedora|rhel|redhatenterpriseserver|almalinux|rocky|ol|oraclelinux|scientific|amzn)
      OS_TYPE="centos"
    ;;
    debian|ubuntu|linuxmint|pop|elementary|kali|mx|mxlinux|zorinos)
      OS_TYPE="debian"
    ;;
    macos)
      OS_TYPE="macos"
    ;;
    win)
      OS_TYPE="win"
    ;;
    freebsd)
      echo "========================" >&2
      echo "||   WARNING WARNING  ||" >&2
      echo "========================" >&2
      echo "FreeBSD and other BSD flavors are not currently supported due to this chrome bug: https://issues.chromium.org/issues/374483175" >&2
      echo "========================" >&2
      echo "||   WARNING WARNING  ||" >&2
      echo "========================" >&2
      OS_TYPE="bsd"
    ;;
    *)
      echo "ERROR: Unsupported Operating System: $distro" >&2
      exit 1
      ;;
  esac
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
    # Example Windows path, adjust as needed
    TORRC="/c/Program Files/Tor Browser/Browser/TorBrowser/Data/Tor/torrc"
    TORDIR="/c/Program Files/Tor Browser/Browser/TorBrowser/Data/Tor"
    echo "Assuming Tor paths $TORRC and $TORDIR." >&2
    echo "Update in your test.env file if needed." >&2
  else
    TORRC="/etc/tor/torrc"  # Default path for Linux distributions
    TORDIR="/var/lib/tor"
  fi
  echo "$TORRC" 
}

# Function to check if Tor is installed
check_tor_installed() {
  if command -v tor >/dev/null 2>&1; then
    echo "Tor is installed." >&2
    echo -n "Ensuring tor started..." >&2
    if [[ "$OS_TYPE" == "macos" ]]; then 
      brew services start tor
    else 
      $SUDO systemctl start tor
    fi
    echo "Done." >&2
    return 0
  else
    echo "Tor is not installed." >&2
    return 1
  fi
}

# Function to run Torbb if Tor is not installed
run_torbb_if_needed() {
  CONFIG_DIR="$1"
  test_env="${CONFIG_DIR}/test.env"
  if [ ! -f "$test_env" ]; then
    echo "Running setup_bbpro without --ontor first" >&2
    "$0" "${@/--ontor/}" # Remove --ontor and rerun the script
  fi
  echo "Running torbb" >&2
  torbb
  stop_bbpro
}

# Function to obtain SOCKS5 proxy address from tor
obtain_socks5_proxy_address() {
  torrc_path=$(find_torrc_path)
  # Parse the torrc file to find the SOCKS5 proxy address
  if grep -q "^SocksPort" "$torrc_path"; then
    # Extract and return the SOCKS5 proxy address from torrc
    socks_port=$(grep "^SocksPort" "$torrc_path" | awk '{print $2}')
    # use socks5h to pass DNS through tor as well
    echo "socks5h://127.0.0.1:$socks_port"
  else
    # Default SOCKS5 proxy address
    # use socks5h to pass DNS through tor as well
    echo "socks5h://127.0.0.1:9050"
  fi
}

function create_selinux_policy_for_ports() {
  # Check if SELinux is enforcing
  if ! command_exists getenforce; then
    echo "Not SELinux" >&2
    return
  fi
  if [[ "$(getenforce)" != "Enforcing" ]]; then
    echo "SELinux is not in enforcing mode." >&2
    return
  fi

  # Parameters: SELinux type, protocol (tcp/udp), port range or single port
  local SEL_TYPE=$1
  local PROTOCOL=$2
  local PORT_RANGE=$3

  if [[ -z "$SEL_TYPE" || -z "$PROTOCOL" || -z "$PORT_RANGE" ]]; then
    echo "Usage: create_selinux_policy_for_ports SEL_TYPE PROTOCOL PORT_RANGE" >&2
    return
  fi

  # Add or modify the port context
  $SUDO semanage port -a -t $SEL_TYPE -p $PROTOCOL $PORT_RANGE 2>/dev/null || \
  $SUDO semanage port -m -t $SEL_TYPE -p $PROTOCOL $PORT_RANGE

  # Generate and compile a custom policy module if required
  $SUDO grep AVC /var/log/audit/audit.log | audit2allow -M my_custom_policy_module
  $SUDO semodule -i my_custom_policy_module.pp
  rm my_custom_policy_module.*

  echo "SELinux policy created and loaded for $PORT_RANGE on $PROTOCOL with type $SEL_TYPE." >&2
}

open_firewall_port_range() {
    local start_port=$1
    local end_port=$2

    if [[ "$start_port" != "$end_port" ]]; then
      create_selinux_policy_for_ports http_port_t tcp $start_port-$end_port
    else
      create_selinux_policy_for_ports http_port_t tcp $start_port
    fi

    # Check for firewall-cmd (firewalld)
    if command -v firewall-cmd &> /dev/null; then
      echo "Using firewalld" >&2
      $SUDO firewall-cmd --zone="$ZONE" --add-port=${start_port}-${end_port}/tcp --permanent 1>&2
      $SUDO firewall-cmd --reload 1>&2
    # Check for ufw (Uncomplicated Firewall)
    elif $SUDO bash -c 'command -v ufw' &> /dev/null; then
      echo "Using ufw" >&2
      if [[ "$start_port" != "$end_port" ]]; then
        $SUDO ufw allow ${start_port}:${end_port}/tcp 1>&2
      else
        $SUDO ufw allow ${start_port}/tcp 1>&2
      fi
    elif command -v netsh &>/dev/null; then
      echo "Will use netsh later" >&2
    else
      echo "No recognized firewall management tool found" >&2
      return 1
    fi
}

detect_os

# Call this function if OS_TYPE is win
if [[ "$OS_TYPE" == "win" ]]; then
  ensure_certtools_windows
fi

echo "Parsing command line args..." >&2
echo "" >&2

# determine if running on MacOS
if [[ $(uname) == "Darwin" ]]; then
  # check if brew is installed
  if ! command -v brew >/dev/null 2>&1; then
    echo "Error: Homebrew is not installed. Please install Homebrew first." >&2
    echo "Visit https://brew.sh for installation instructions." >&2
    exit 1
  fi

  # if gnu-getopt is not installed, install it
  if ! brew --prefix gnu-getopt > /dev/null 2>&1; then
    brew install gnu-getopt
  fi
  getopt=$(brew --prefix gnu-getopt)/bin/getopt
else
  # else use regular getopt
  getopt="/usr/bin/getopt"
fi

# Display help message
display_help() {
  cat << EOF
Usage: $(basename "$0") [OPTIONS]

This script sets up and configures BrowserBox with optional Tor support.

OPTIONS:
  -h, --help                  Display this help message and exit.
  -p, --port PORT             Specify the main port for BrowserBox (Required).
  -t, --token TOKEN           Provide a specific login token.
  -c, --cookie COOKIE         Set a custom cookie value for BrowserBox.
  -d, --doc-api-key KEY       Provide a document viewer API key.
      --ontor                 Enable Tor support for BrowserBox.
      --inject PATH           Inject a JavaScript file into every browsed page.

EXAMPLES:
  $(basename "$0") --port 8080 --token mytoken --cookie mycookie
  $(basename "$0") --port 8080 --ontor
  $(basename "$0") --port 8080 --inject ~/extension.js

EOF
}

# Parse options with getopts
while :; do
  case "$1" in
    -h|--help)
      display_help
      exit 0
      ;;
    -p|--port)
      PORT="$2"
      shift 2
      ;;
    -t|--token)
      TOKEN="$2"
      shift 2
      ;;
    -c|--cookie)
      COOKIE="$2"
      shift 2
      ;;
    -d|--doc-api-key)
      DOC_API_KEY="$2"
      shift 2
      ;;
    --ontor)
      ONTOR=true
      shift
      ;;
    --inject)
      INJECT_SCRIPT="$2"
      shift 2
      ;;
    --)
      shift
      break
      ;;
    -*)
      echo "ERROR: Unknown option: $1" >&2
      display_help
      exit 1
      ;;
    *)
      break
      ;;
  esac
done

# Validate required options
if [[ -z "$PORT" ]]; then
  echo "ERROR: --port option is required." >&2
  exit 1
fi

if [[ -n "$DEBUG_BB" ]]; then
  echo "PORT: $PORT" >&2
  echo "TOKEN: ${TOKEN:-Not provided}" >&2
  echo "COOKIE: ${COOKIE:-Not provided}" >&2
  echo "DOC_API_KEY: ${DOC_API_KEY:-Not provided}" >&2
  echo "ONTOR: $ONTOR" >&2
  echo "INJECT_SCRIPT: ${INJECT_SCRIPT:-Not provided}" >&2
fi

echo "Done!">&2;

if [ -z "$PORT" ]; then
  echo "ERROR: --port option is required. Type --help for options." >&2
  exit 1
elif ! is_port_free "$PORT"; then
  echo "" >&2
  echo "ERROR: the suggested port $PORT is invalid or already in use." >&2
  echo "" >&2
  exit 1
elif ! is_port_free $(($PORT - 2)); then
  echo "ERROR: the suggested port range (audio) is already in use" >&2
  exit 1
elif ! is_port_free $(($PORT + 1)); then
  echo "ERROR: the suggested port range (devtools) is already in use" >&2
  exit 1
elif ! is_port_free $(($PORT - 1)); then
  echo "ERROR: the suggested port range (doc viewer) is already in use" >&2
  exit 1
fi

open_firewall_port_range "$(($PORT - 2))" "$(($PORT + 2))"

if $ONTOR; then
  if ! check_tor_installed; then
    run_torbb_if_needed "$CONFIG_DIR" "${@}"
  else
    TOR_PROXY=$(obtain_socks5_proxy_address)
    export TOR_PROXY="$TOR_PROXY"
  fi
  echo "Browser will connect to the internet using Tor" >&2
fi

if [ -z "$TOKEN" ]; then
  echo -n "Token not provided, so will generate...">&2
  TOKEN=$(openssl rand -hex 16)
  echo " Generated token: $TOKEN">&2
fi

if [ -z "$COOKIE" ]; then
  echo -n "Cookie not provided, so will generate...">&2
  COOKIE=$(openssl rand -hex 16)
  echo "Generated cookie: $COOKIE">&2
fi

if [ -z "$DOC_API_KEY" ]; then
  echo -n "Doc API key not provided, so will generate...">&2
  DOC_API_KEY=$(openssl rand -hex 16)
  echo "Generated doc API key: $DOC_API_KEY">&2
fi

DT_PORT=$((PORT + 1))
SV_PORT=$((PORT - 1))
AUDIO_PORT=$((PORT - 2))

echo "Received port $PORT and token $TOKEN and cookie $COOKIE">&2

echo "Setting up bbpro...">&2

echo -n "Creating config directory...">&2

CONFIG_DIR=$HOME/.config/dosyago/bbpro/
mkdir -p $CONFIG_DIR

echo $(date) > $CONFIG_DIR/.bbpro_config_dir

echo "Done!">&2

echo -n "Creating test.env...">&2

sslcerts="${HOME}/sslcerts"
if [[ ! -d $sslcerts ]] || [[ ! -f "${sslcerts}/fullchain.pem" ]]; then
  sslcerts="/usr/local/share/dosyago/sslcerts"
fi
cert_file="${sslcerts}/fullchain.pem"
if [[ ! -f $cert_file ]]; then 
  echo "Warning: SSL certificates are not installed in $HOME/sslcerts or /usr/local/share/dosyago/sslcerts. Things will not work." >&2
fi

sans=$(openssl x509 -in "$cert_file" -noout -text | grep -A1 "Subject Alternative Name" | tail -n1 | sed 's/DNS://g; s/, /\n/g' | head -n1 | awk '{$1=$1};1')
HOST=$(echo $sans | awk '{print $1}')

if [[ -f /etc/centos-release ]]; then
  echo "Detected CentOS. Ensuring required ports are open in the firewall..." >&2
  open_firewall_port_centos "$PORT"
  open_firewall_port_centos "$DT_PORT"
  open_firewall_port_centos "$SV_PORT"
  open_firewall_port_centos "$AUDIO_PORT"
elif [[ "$OS_TYPE" == "win" ]]; then
	echo "Detected Windows. Ensuring required ports are open in the firewall..." >&2
  open_firewall_port_windows "$PORT"
  open_firewall_port_windows "$DT_PORT"
  open_firewall_port_windows "$SV_PORT"
  open_firewall_port_windows "$AUDIO_PORT"
fi

cat > "${CONFIG_DIR}/test.env" <<EOF
export APP_PORT=$PORT
export AUDIO_PORT=$AUDIO_PORT
export LOGIN_TOKEN=$TOKEN
export COOKIE_VALUE=$COOKIE
export DEVTOOLS_PORT=$DT_PORT
export DOCS_PORT=$SV_PORT
export DOCS_KEY=$DOC_API_KEY
export INJECT_SCRIPT="${INJECT_SCRIPT}"

# true runs within a 'browsers' group
#export BB_POOL=true

export RENICE_VALUE=-18

# used for building or for installing from repo on macos m1 
# (because of some dependencies with native addons that do not support m1)
# export TARGET_ARCH=x64

export CONFIG_DIR="${CONFIG_DIR}"

# use localhost certs (need export from access machine, can then block firewall ports and not expose connection to internet
# for truly private browser)
# export SSLCERTS_DIR=$HOME/localhost-sslcerts
export SSLCERTS_DIR="${sslcerts}"

# compute the domain from the cert file
export DOMAIN="$HOST"

# only filled out if --ontor is used
export TOR_PROXY="$TOR_PROXY"

# for extra security (but may reduce performance somewhat)
# set the following variables.
# alternately if below are empty
# you can:
# npm install --save-optional bufferutil utf-8-validate
# to utilise these binary libraries to improve performance
# at possible risk to security
WS_NO_UTF_8_VALIDATE=true
WS_NO_BUFFER_UTIL=true

EOF

echo "Done!">&2

echo "The login link for this instance will be:">&2

DOMAIN=$HOST

echo https://$DOMAIN:$PORT/login?token=$TOKEN > $CONFIG_DIR/login.link
echo https://$DOMAIN:$PORT/login?token=$TOKEN

echo "Setup complete.">&2
