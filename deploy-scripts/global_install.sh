#!/usr/bin/env bash

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'
CONFIG_DIR="$HOME/.config/dosyago/bbpro"
ZONE=""

if [[ -n "$BBX_DEBUG" ]]; then
  set -x
fi

unset npm_config_prefix

# flush any partial

SUDO=""
if [[ -f /etc/os-release ]]; then
  . /etc/os-release
fi

if command -v sudo &>/dev/null; then
  export SUDO="$(command -v sudo) -n"
fi

if command -v firewall-cmd &>/dev/null; then
  ZONE="$($SUDO firewall-cmd --get-default-zone)"
fi

# Check if hostname is local
is_local_hostname() {
    local hostname="$1"
    local resolved_ip=$(dig +short "$hostname" A | grep -v '\.$' | head -n1)
    if [[ "$hostname" == "localhost" || "$hostname" =~ \.local$ || "$resolved_ip" =~ ^(127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1) ]]; then
        return 0  # Local
    else
      if command -v getent &>/dev/null; then
        resolved_ip=$(getent hosts "$hostname" | tail -n1)
        if [[ "$resolved_ip" =~ ^(127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1) ]]; then
          return 0
        fi
      fi
      return 1  # Not local
    fi
}

# Ensure hostname is in /etc/hosts, allowing whitespace but not comments
ensure_hosts_entry() {
    local hostname="$1"
    if ! grep -v "^\s*#" /etc/hosts | grep -q "^\s*127\.0\.0\.1.*$hostname"; then
        printf "${YELLOW}Adding $hostname to /etc/hosts...${NC}\n"
        echo "127.0.0.1 $hostname" | $SUDO tee -a /etc/hosts > /dev/null || { printf "${RED}Failed to update /etc/hosts${NC}\n"; exit 1; }
    else
        printf "${GREEN}$hostname already mapped in /etc/hosts${NC}\n"
    fi
}

add_hostname_to_hosts() {
  # Try HOSTNAME env var, then uname -n, then /proc/sys/kernel/hostname, then fallback
  local HOSTNAME="${HOSTNAME}"
  if [ -z "$HOSTNAME" ] && command -v uname &>/dev/null; then
    HOSTNAME=$(uname -n)
  fi
  if [ -z "$HOSTNAME" ] && [ -f /proc/sys/kernel/hostname ]; then
    HOSTNAME=$(cat /proc/sys/kernel/hostname)
  fi
  HOSTNAME="${HOSTNAME:-unknown}"
  if ! grep -q "127.0.0.1.*$HOSTNAME" /etc/hosts; then
    echo "Adding hostname to /etc/hosts..." >&2
    $SUDO cp /etc/hosts /etc/hosts.backup
    echo "127.0.0.1 $HOSTNAME" | $SUDO tee -a /etc/hosts > /dev/null
    echo "::1 $HOSTNAME" | $SUDO tee -a /etc/hosts > /dev/null
    echo "$HOSTNAME has been added to /etc/hosts." >&2
  else
    echo "Hostname $HOSTNAME is already mapped in /etc/hosts." >&2
  fi
}

add_hostname_to_hosts

initialize_package_manager() {
  local package_manager

  if [[ "$OSTYPE" == darwin* ]]; then
    package_manager=$(command -v brew)
  elif command -v apt &>/dev/null; then
    package_manager="$(command -v apt)"
    if command -v apt-get &>/dev/null; then
      source ./deploy-scripts/non-interactive.sh
    fi
    # Check if the system is Debian and the version is 11
    if [[ "$ID" == "debian" && "$VERSION_ID" == "11" ]]; then
      $SUDO apt install -y wget tar
      mkdir -p $HOME/build/Release
      echo "Installing Custom Build of WebRTC Node for Debian 11..."
      wget https://github.com/dosyago/node-webrtc/releases/download/v1.0.0/debian-11-wrtc.node
      chmod +x debian-11-wrtc.node
      mv debian-11-wrtc.node $HOME/build/Release/wrtc.node
      $SUDO mkdir -p /usr/local/share/dosyago/build/Release
      $SUDO cp $HOME/build/Release/wrtc.node /usr/local/share/dosyago/build/Release/
    fi
  elif command -v pkg &>/dev/null; then
    package_manager="$(command -v pkg)"
  elif command -v dnf >/dev/null; then
    package_manager="$(command -v dnf) --best --allowerasing --skip-broken"
    $SUDO dnf config-manager --set-enabled crb
    $SUDO dnf -y upgrade --refresh
    $SUDO dnf install https://download1.rpmfusion.org/free/el/rpmfusion-free-release-$(rpm -E %rhel).noarch.rpm
    $SUDO dnf install https://download1.rpmfusion.org/nonfree/el/rpmfusion-nonfree-release-$(rpm -E %rhel).noarch.rpm
    $SUDO firewall-cmd --permanent --zone="$ZONE" --add-service=http
    $SUDO firewall-cmd --permanent --zone="$ZONE" --add-service=https
    $SUDO firewall-cmd --reload
    $SUDO dnf install -y wget tar
    mkdir -p $HOME/build/Release
    if [ "$ID" = "almalinux" ] && [[ "$VERSION_ID" == 8* ]]; then
      echo "Installing Custom Build of WebRTC Node for Almalinux 8 like..."
      wget https://github.com/dosyago/node-webrtc/releases/download/v1.0.0/almalinux-8-wrtc.node
      chmod +x almalinux-8-wrtc.node
      mv almalinux-8-wrtc.node $HOME/build/Release/wrtc.node
    elif ([ "$ID" = "centos" ] || [ "$ID" = "rhel" ]) && [[ "$VERSION_ID" == 8* ]]; then
      echo "Installing Custom Build of WebRTC Node for CentOS 8 or RedHat Enterprise Linux 8..."
      wget https://github.com/dosyago/node-webrtc/releases/download/v1.0.0/centos-8-wrtc.node
      chmod +x centos-8-wrtc.node
      mv centos-8-wrtc.node $HOME/build/Release/wrtc.node
    else
      echo "Installing Custom Build of WebRTC Node for CentOS 9 like..."
      wget https://github.com/dosyago/node-webrtc/releases/download/v1.0.0/centos-9-wrtc.node
      chmod +x centos-9-wrtc.node
      mv centos-9-wrtc.node $HOME/build/Release/wrtc.node
    fi
    $SUDO mkdir -p /usr/local/share/dosyago/build/Release
    $SUDO cp $HOME/build/Release/wrtc.node /usr/local/share/dosyago/build/Release/
  else
    echo "No supported package manager found. Exiting."
    return 1
  fi

  echo "Using package manager: $package_manager"
  export APT=$package_manager
}

# Ensure the disk is optimal
$SUDO ./deploy-scripts/disk_extend.sh

# Call the function to initialize and export the APT variable
initialize_package_manager

read_input() {
  if [ -t 0 ]; then  # Check if it's running interactively
    read -p "$1" -r REPLY
  else
    read -r REPLY
    REPLY=${REPLY:0:1}  # Take the first character of the piped input
  fi
  echo  # Add a newline for readability
  echo
}

get_latest_dir() {
  # Find potential directories containing .bbpro_install_dir
  pwd="$(pwd)"
  if [[ -f "${HOME}/.bbx/BrowserBox/bbpro_dir" ]]; then
    install_path1=$(find "$HOME/.bbx" -name bbpro_dir -print 2>/dev/null)
  else
    install_path1=$(find "$HOME" -name bbpro_dir -print 2>/dev/null)
  fi
  current_version=$(jq -r '.version' ./package.json)

  # Loop through each found path to check if node_modules also exists in the same directory
  IFS=$'\n'  # Change Internal Field Separator to newline for iteration
  for path in $install_path1; do
    dir=$(dirname $path)
      # Get the version of the found directory's package.json
      found_version=$(jq -r '.version' "${dir}/package.json")

      # Check if the found version is the same or later than the current version
      if [[ $(echo -e "$current_version\n$found_version" | sort -V | tail -n1) == "$found_version" ]]; then
        echo "$dir"
        return 0
      fi
  done

  if [[ "$pwd" != "$HOME" && "$pwd" != "$HOME"/* ]]; then
    echo "\$pwd ($pwd) is not within \$HOME ($HOME)" >&2
    install_path2=$(find $pwd -name bbpro_dir -print 2>/dev/null)
    IFS=$'\n'  # Change Internal Field Separator to newline for iteration
    for path in $install_path2; do
      dir=$(dirname $path)
        # Get the version of the found directory's package.json
        found_version=$(jq -r '.version' "${dir}/package.json")

        # Check if the found version is the same or later than the current version
        if [[ $(echo -e "$current_version\n$found_version" | sort -V | tail -n1) == "$found_version" ]]; then
          echo "$dir"
          return 0
        fi
    done
  else
      echo "\$pwd ($pwd) is within \$HOME ($HOME)" >&2
  fi

  echo "No valid install directory found." >&2
  return 1
}

os_type() {
  case "$(uname -s)" in
    Darwin*) echo "macOS";;
    Linux*)  echo "Linux";;
    MING*)   echo "win";;
    *)       echo "unknown";;
  esac
}

install_node() {
  ./deploy-scripts/install_node.sh 22
}

install_nvm() {
  source ~/.nvm/nvm.sh
  if ! command -v nvm &>/dev/null; then
    echo "Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    source ~/.nvm/nvm.sh
    nvm install v22
  else
    nvm install v22
  fi
}

# License agreement and terms display
display_terms() {
    printf "${BLUE}${BOLD}Welcome to BrowserBox Installation${NC}\n"
    printf "${YELLOW}Before proceeding, please note:${NC}\n"
    printf "  - A valid, purchased license is required for use.\n"
    printf "  - By installing, you agree to the terms in:\n"
    printf "    * LICENSE: ${BLUE}https://github.com/dosyago/BrowserBoxPro/blob/main/LICENSE.md${NC}\n"
    printf "    * Terms: ${BLUE}https://dosaygo.com/terms.txt${NC}\n"
    printf "    * Privacy: ${BLUE}https://dosaygo.com/privacy.txt${NC}\n"
    printf "  - Commercial use (including evaluation) requires a license.\n"
    printf "  - Purchase at: ${BLUE}https://dosaygo.com${NC}\n"
    printf "  - Questions? Contact ${BLUE}sales@dosaygo.com${NC}\n\n"
}

check_agreement() {
    if [ ! -f "$CONFIG_DIR/.agreed" ]; then
        display_terms
        printf "${YELLOW}Do you agree to these terms and confirm a license for use? (yes/no): ${NC}\n"
        read -r REPLY
        if [[ "${REPLY:0:1}" =~ ^[yY]$ ]]; then
            printf "${GREEN}Terms accepted. Proceeding...${NC}\n"
            mkdir -p "$CONFIG_DIR"
            touch "$CONFIG_DIR/.agreed"
        else
            printf "${RED}Terms not accepted. Exiting installation.${NC}\n"
            exit 1
        fi
    fi
}

# Usage in script (e.g., in global_install.sh or install subcommand)
check_agreement

function create_selinux_policy_for_ports() {
  # Check if SELinux is enforcing
  if [[ "$(getenforce)" != "Enforcing" ]]; then
    echo "SELinux is not in enforcing mode. Exiting."
    return
  fi

  # Parameters: SELinux type, protocol (tcp/udp), port range or single port
  local SEL_TYPE=$1
  local PROTOCOL=$2
  local PORT_RANGE=$3

  if [[ -z "$SEL_TYPE" || -z "$PROTOCOL" || -z "$PORT_RANGE" ]]; then
    echo "Usage: create_selinux_policy_for_ports SEL_TYPE PROTOCOL PORT_RANGE"
    return
  fi

  # Add or modify the port context
  sudo semanage port -a -t $SEL_TYPE -p $PROTOCOL $PORT_RANGE 2>/dev/null || \
  sudo semanage port -m -t $SEL_TYPE -p $PROTOCOL $PORT_RANGE

  # Generate and compile a custom policy module if required
  sudo grep AVC /var/log/audit/audit.log | audit2allow -M my_custom_policy_module
  sudo semodule -i my_custom_policy_module.pp

  echo "SELinux policy created and loaded for $PORT_RANGE on $PROTOCOL with type $SEL_TYPE."
}

open_firewall_port_range() {
  local start_port=$1
  local end_port=$2
  local complete=""

  if command -v getenforce &>/dev/null; then
    if [[ "$start_port" != "$end_port" ]]; then
      create_selinux_policy_for_ports http_port_t tcp $start_port-$end_port
    else
      create_selinux_policy_for_ports http_port_t tcp $start_port
    fi
  fi

  # Check for firewall-cmd (firewalld)
  if command -v firewall-cmd &> /dev/null; then
      echo "Using firewalld"
      $SUDO firewall-cmd --zone="$ZONE" --add-port=${start_port}-${end_port}/tcp --permanent
      $SUDO firewall-cmd --reload
      complete="true"
  fi

  # Check for ufw (Uncomplicated Firewall)
  if $SUDO bash -c 'command -v ufw' &> /dev/null; then
      echo "Using ufw"
      if [[ "$start_port" != "$end_port" ]]; then
        $SUDO ufw allow ${start_port}:${end_port}/tcp
      else
        $SUDO ufw allow ${start_port}/tcp
      fi
      complete="true"
  fi

  if [[ -z "$complete" ]]; then
      echo "No recognized firewall management tool found"
      if command -v apt; then
        $SUDO apt install -y ufw 
      elif command -v dnf; then
        $SUDO dnf install -y firewalld
      fi
      return 1
  fi
}

# If on macOS
if [[ "$(uname)" == "Darwin" ]]; then
    # Check the machine architecture
    ARCH="$(uname -m)"
    if [[ "$ARCH" == "arm64" ]]; then
        true
        #echo "This script is not compatible with the MacOS ARM architecture at this time"
        #echo "due to some dependencies having no pre-built binaries for this architecture."
        #echo "Please re-run this script under Rosetta."
        #exit 1
    fi
fi

if [ "$(os_type)" == "Linux" ]; then
  $SUDO $APT update
  $SUDO $APT -y upgrade
  $SUDO $APT install -y net-tools dnsutils
  open_firewall_port_range 80 80
fi
open_firewall_port_range 80 80


if ! command -v jq &>/dev/null; then
  if [ "$(os_type)" == "macOS" ]; then
          brew install jq
  else
          $SUDO $APT install -y jq
  fi
fi


if [ "$#" -eq 2 ] || is_local_hostname "$1"; then
  hostname="$1"
  export BB_USER_EMAIL="$2"

  amd64=""

  if is_local_hostname "$1"; then
    if ! command -v mkcert &>/dev/null; then
      printf "${YELLOW}Installing mkcert...${NC}\n"
      if [ "$(os_type)" == "macOS" ]; then
        brew install nss mkcert
      elif [ "$(os_type)" == "win" ]; then
        choco install mkcert || scoop bucket add extras && scoop install mkcert
      else
        # Determine architecture
        if command -v dpkg &>/dev/null; then
          arch=$(dpkg --print-architecture)
        else
          arch=$(uname -m)
          if [ "$arch" = "x86_64" ]; then
            arch="amd64"  # Normalize to mkcert naming
          fi
        fi
        # Install NSS tools based on package manager
        if command -v apt &>/dev/null; then
          $SUDO $APT install -y libnss3-tools
        elif command -v dnf &>/dev/null || command -v yum &>/dev/null; then
          $SUDO $APT install -y nss-tools  # $APT is dnf/yum here
        else
          printf "${RED}No supported package manager for NSS tools. Install manually.${NC}\n"
          exit 1
        fi
        # Ensure wget or curl for downloading
        if command -v curl &>/dev/null; then
          downloader="curl -JLO"
        elif command -v wget &>/dev/null; then
          downloader="wget"
        else
          printf "${RED}Neither curl nor wget found. Installing wget...${NC}\n"
          if command -v apt &>/dev/null; then
            $SUDO $APT install -y wget
          elif command -v dnf &>/dev/null || command -v yum &>/dev/null; then
            $SUDO $APT install -y wget
          else
            printf "${RED}Cannot install wget. Install curl or wget manually.${NC}\n"
            exit 1
          fi
          downloader="wget"
        fi
        # Download and install mkcert
        $downloader "https://dl.filippo.io/mkcert/latest?for=linux/$arch"
        chmod +x mkcert-v*-linux-$arch
        $SUDO cp mkcert-v*-linux-$arch /usr/local/bin/mkcert || { printf "${RED}Failed to install mkcert${NC}\n"; exit 1; }
        rm mkcert-v*
      fi
    fi
    mkcert -install
    if [[ ! -f "$HOME/sslcerts/privkey.pem" || ! -f "$HOME/sslcerts/fullchain.pem" ]]; then
      mkdir -p $HOME/sslcerts
      pwd=$(pwd)
      cd $HOME/sslcerts
      mkcert --cert-file fullchain.pem --key-file privkey.pem $hostname localhost 127.0.0.1
      cd $pwd
    else 
      echo "IMPORTANT: sslcerts already exist in $HOME/sslcerts directory. We are not overwriting them."
    fi
  else
    ip=$(getent hosts "$hostname" | awk '{ print $1 }')

    if [ -n "$ip" ]; then
      ./deploy-scripts/wait_for_hostname.sh "$hostname"
      ./deploy-scripts/tls "$hostname"
    else
      echo "The provided hostname ($hostname) could not be resolved. Please ensure that you've added a DNS A/AAAA record pointing from the hostname to this machine's public IP address."
      exit 1
    fi
  fi
else
  if is_local_hostname "$1"; then
    echo ""
    echo "Usage: $0 <hostname>"
    echo "Please provide a hostname as an argument. This hostname will be where a running bbpro instance is accessible." >&2
    echo "Note that user email is not required as 2nd parameter when using localhost as we do not use Letsencrypt in that case." >&2
  else 
    echo ""
    echo "Usage: $0 <hostname> <your_email>"
    echo "Please provide a hostname as an argument. This hostname will be where a running bbpro instance is accessible." >&2
    echo "Please provide an email as argument. This email will be used to agree to the Letsencrypt TOS for cert provisioning" >&2
  fi
  exit 1
fi

echo -n "Finding bbpro directory..."

INSTALL_DIR=$(get_latest_dir)

echo "Found bbpro at: $INSTALL_DIR"

read -p "Enter to continue" -r

echo "Ensuring fully installed..."

cd $INSTALL_DIR

echo "Ensuring nvm installed..."
#install_nvm
install_node
source ~/.nvm/nvm.sh

echo "Running npm install..."

if ! npm i; then
  # attempt to save node weirdness
  npm run clean
  $SUDO $APT install -y build-essential
  npm i
fi

echo "npm install complete"

if [ "$(os_type)" == "macOS" ]; then
  if ( ! command -v getopt ) || [[ "$(getopt --version)" != *"util-linux"* ]]; then
    if brew install gnu-getopt; then
      brew link --force gnu-getopt
    fi
  fi
else
  if ! command -v getopt &>/dev/null; then
    echo "Installing gnu-getopt for Linux..."
    $SUDO $APT update
    $SUDO $APT install -y gnu-getopt
  fi
fi

echo "Fully installed!"

./deploy-scripts/copy_install.sh "$INSTALL_DIR"

echo -n "Setting up deploy system ..."

cd $INSTALL_DIR/src/services/pool/deploy/
./scripts/setup.sh

echo "Install complete!"
