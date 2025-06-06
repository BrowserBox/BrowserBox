#!/bin/bash
# -*- coding: utf-8 -*-

##########################################################
#  ____                                  ____
# | __ ) _ __ _____      _____  ___ _ __| __ )  _____  __
# |  _ \| '__/ _ \ \ /\ / / __|/ _ \ '__|  _ \ / _ \ \/ /
# | |_) | | | (_) \ V  V /\__ \  __/ |  | |_) | (_) >  <
# |____/|_|  \___/ \_/\_/ |___/\___|_|  |____/ \___/_/\_\
# 
##########################################################

REDIRECT=">/dev/null"
if [[ -n "$BBX_DEBUG" ]]; then
  REDIRECT=""
fi

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
CYAN='\033[1;36m'
PURPLE='\033[1;95m'  # Bright magenta, defined as purple
BLUE='\033[1;34m'
PINK='\033[1;95m'    # Bright magenta, closest to pink in ANSI
NC='\033[0m'
BOLD='\033[1m'

OGARGS=("$@")

protecc_win_sysadmins() {
    # Check for Windows environments
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" || -n "$WINDIR" || "$(uname -s)" =~ ^MINGW || "$(uname -s)" =~ ^CYGWIN || -n "$WSL_DISTRO_NAME" ]]; then
        echo -e "\033[1;31m⚠️ WARNING: You're on Windows! ⚠️\033[0m"
        echo -e "\033[1;33mThis Bash script (bbx) isn't meant for Windows sysadmins.\033[0m"
        echo -e "Please use the native PowerShell install method instead:"
        echo -e "\033[1;32mirm dosaygo.com/browserbox | iex\033[0m"
        echo -e "Run this in PowerShell to get a Windows-friendly bbx setup."
        exit 1
    fi
}

# Call the function right away
protecc_win_sysadmins

# Sudo check
SUDO=$(command -v sudo >/dev/null && echo "sudo -n" || echo "")
if ([ "$EUID" -ne 0 ] && ! $SUDO true 2>/dev/null); then
    banner
    printf "${RED}Warning: ${NC}${BOLD}bbx${NC}${RED} is easier to use with passwordless sudo, and may misfunction without it.${NC}\n\tEdit /etc/sudoers with visudo to enable.\n"
    exit 1
fi

# Default paths
BBX_HOME="${HOME}/.bbx"
BBX_NEW_DIR="${BBX_HOME}/new"
COMMAND_DIR=""
REPO_URL="https://github.com/BrowserBox/BrowserBox"
BBX_SHARE="/usr/local/share/dosyago"
if [[ ":$PATH:" == *":/usr/local/bin:"* ]] && $SUDO test -w /usr/local/bin; then
  COMMAND_DIR="/usr/local/bin"
elif $SUDO test -w /usr/bin; then
  COMMAND_DIR="/usr/bin"
else
  COMMAND_DIR="$HOME/.local/bin"
  mkdir -p "$COMMAND_DIR"
fi
BBX_BIN="${COMMAND_DIR}/bbx"

# Config file (secondary to test.env and login.link)
BB_CONFIG_DIR="${HOME}/.config/dosyago/bbpro"
CONFIG_FILE="${BB_CONFIG_DIR}/config"
[ ! -d "$BB_CONFIG_DIR" ] && mkdir -p "$BB_CONFIG_DIR"

DOCKER_CONTAINERS_FILE="$BB_CONFIG_DIR/docker_containers.json"
[ ! -f "$DOCKER_CONTAINERS_FILE" ] && echo "{}" > "$DOCKER_CONTAINERS_FILE"

# Version file paths
VERSION_FILE="${BBX_SHARE}/BrowserBox/version.json"
PREPARED_VERSION_FILE="${BBX_NEW_DIR}/BrowserBox/version.json"
LOG_FILE="${BB_CONFIG_DIR}/update.log"
PREPARING_FILE="${BBX_SHARE}/preparing"
PREPARED_FILE="${BBX_SHARE}/prepared"

# Clean up any leftover temp installer scripts
clean_temp_installers() {
  local TMPDIR="$HOME/.cache/myscript-installer"
  find "$TMPDIR" -type f -name 'installer-*' -exec rm -f {} \; 2>/dev/null
}

# Returns 0 if currently running from official location (not temp copy)
is_running_in_official() {
  local TMPDIR="$HOME/.cache/myscript-installer"
  [[ "$0" != "$TMPDIR/"* ]]
}

# Elevate to a temp copy (if not already in temp); will not return if elevation happens
self_elevate_to_temp() {
  local TMPDIR="$HOME/.cache/myscript-installer"
  mkdir -p "$TMPDIR"

  # Are we already running from temp? Then just return
  if ! is_running_in_official; then
    return
  fi

  clean_temp_installers

  local TEMP_SCRIPT
  TEMP_SCRIPT="$(mktemp "$TMPDIR/installer-XXXXXX")" || {
    echo "Failed to create temp script in $TMPDIR"
    exit 1
  }

  cp "$0" "$TEMP_SCRIPT"
  chmod +x "$TEMP_SCRIPT"

  echo "Elevating to temp execution at: $TEMP_SCRIPT"
  exec "$TEMP_SCRIPT" "$@"
}

sort_git_tags() {
    # Read input from stdin or file
    local input
    if [ -n "$1" ]; then
        input=$(cat "$1")
    else
        input=$(cat)
    fi

    # Extract tags (second column, remove refs/tags/), sort by version
    echo "$input" | awk '{print $2}' | sed 's|^refs/tags/||' | sort -V
}

get_latest_tag() {
    # Read input from stdin or file
    local input
    if [ -n "$1" ]; then
        input=$(cat "$1")
    else
        input=$(cat)
    fi

    # Debug to stderr
    # [[ -n "$BBX_DEBUG" ]] && echo "Input tags:" >&2
    # [[ -n "$BBX_DEBUG" ]] && echo "$input" >&2

    # Get all tags and non-rc tags
    ALL_TAGS=$(echo "$input" | sort_git_tags)
    NON_RC_TAGS=$(echo "$input" | grep -v "\-rc" | sort_git_tags)

    # Check if lists are empty
    if [ -z "$ALL_TAGS" ]; then
        [[ -n "$BBX_DEBUG" ]] && echo "Error: No tags found" >&2
        return 1
    fi

    # Debug lists to stderr
    # [[ -n "$BBX_DEBUG" ]] && echo "All tags (sorted):" >&2
    # [[ -n "$BBX_DEBUG" ]] && echo "$ALL_TAGS" >&2
    # [[ -n "$BBX_DEBUG" ]] && echo "Non-rc tags (sorted):" >&2
    # [[ -n "$BBX_DEBUG" ]] && echo "$NON_RC_TAGS" >&2

    # Get tails
    ALL_TAIL=$(echo "$ALL_TAGS" | tail -n 1)
    NON_RC_TAIL=$(echo "$NON_RC_TAGS" | tail -n 1)

    # Debug tails to stderr
    [[ -n "$BBX_DEBUG" ]] && echo "All tags tail: $ALL_TAIL" >&2
    [[ -n "$BBX_DEBUG" ]] && echo "Non-rc tags tail: $NON_RC_TAIL" >&2

    # Compare tails
    if [ "$ALL_TAIL" = "$NON_RC_TAIL" ]; then
        # Case 1: Tails match
        [[ -n "$BBX_DEBUG" ]] && echo "Tails match, outputting: $ALL_TAIL" >&2
        echo "$ALL_TAIL"
        return 0
    fi

    # Case 2: Tails differ
    if [[ "$ALL_TAIL" =~ -rc$ ]]; then
        # Strip -rc
        STRIPPED_TAIL=${ALL_TAIL%-rc}
        [[ -n "$BBX_DEBUG" ]] && echo "All tail is -rc, stripped: $STRIPPED_TAIL" >&2

        if [ "$STRIPPED_TAIL" = "$NON_RC_TAIL" ]; then
            # Stripped tail matches non-rc tail
            [[ -n "$BBX_DEBUG" ]] && echo "Stripped tail matches non-rc tail, outputting: $NON_RC_TAIL" >&2
            echo "$NON_RC_TAIL"
        else
            # Compare stripped tail vs non-rc tail
            [[ -n "$BBX_DEBUG" ]] && echo "Comparing $STRIPPED_TAIL vs $NON_RC_TAIL" >&2
            HIGHER_VERSION=$(echo -e "$STRIPPED_TAIL\n$NON_RC_TAIL" | sort -V | tail -n 1)
            if [ "$HIGHER_VERSION" = "$STRIPPED_TAIL" ]; then
                # Stripped tail is more recent
                [[ -n "$BBX_DEBUG" ]] && echo "Stripped tail is more recent, outputting: $ALL_TAIL" >&2
                echo "$ALL_TAIL"
            else
                # Non-rc tail is more recent or equal
                [[ -n "$BBX_DEBUG" ]] && echo "Non-rc tail is more recent or equal, outputting: $NON_RC_TAIL" >&2
                echo "$NON_RC_TAIL"
            fi
        fi
    else
        # ALL_TAIL is not -rc
        [[ -n "$BBX_DEBUG" ]] && echo "All tail is not -rc, outputting: $NON_RC_TAIL" >&2
        echo "$NON_RC_TAIL"
    fi
}

## Helper: Get latest tag from repo
get_latest_repo_version() {
  local result
  result=$(timeout 5s git ls-remote --tags "$REPO_URL" 2>/dev/null | get_latest_tag)
  if [ $? -ne 0 ] || [ -z "$result" ]; then
    printf "${YELLOW}Checking for updates timed out${NC}\n"
    echo "unknown"
    return 1
  fi
  local latest_tag=$(echo "$result")
  [ -n "$latest_tag" ] && echo "$latest_tag" || echo "unknown"
}

# Version
BBX_VERSION="$(get_latest_repo_version)"
branch="main" # change to main for dist
if [[ "$branch" != "main" ]]; then
  export BBX_BRANCH="$branch"
fi
banner_color=$CYAN

# Helper: Get version info from version.json
get_version_info() {
  local file="$1"
  if [ -f "$file" ]; then
    # Assuming version.json has { "tag": "..." }
    jq -r '.tag' "$file" 2>/dev/null || echo "unknown"
  else
    echo "unknown"
  fi
}

# ASCII Banner
banner() {
    printf "${banner_color}${BOLD}"
    cat << 'EOF'
   ____                                  ____
  | __ ) _ __ _____      _____  ___ _ __| __ )  _____  __
  |  _ \| '__/ _ \ \ /\ / / __|/ _ \ '__|  _ \ / _ \ \/ /
  | |_) | | | (_) \ V  V /\__ \  __/ |  | |_) | (_) >  <
  |____/|_|  \___/ \_/\_/ |___/\___|_|  |____/ \___/_/\_\

EOF
    printf "${NC}\n"
}



if ! test -d "${BBX_HOME}/BrowserBox/node_modules" || ! test -f "${BBX_HOME}/BrowserBox/.bbpro_install_dir"; then
  if [[ "$1" != "install" ]] && [[ "$1" != "uninstall" ]] && [[ "$1" != "docker-"* ]] && [[ "$1" != "stop" ]] && [[ "$1" != "update-background" ]]; then
    banner
    printf "\n${RED}Run ${NC}${BOLD}bbx install${NC}${RED} first.${NC}\n"
    printf "\tYou may need to run bbx uninstall to remove any previous or broken installation.\n"
    exit 1
  fi
fi

# Check if in screen or if UTF-8 is not supported
if [ -n "$STY" ] || ! tput u8 >/dev/null 2>&1; then
  top_left="+"
  top_right="+"
  bottom_left="+"
  bottom_right="+"
  horizontal="-"
  vertical="|"
else
  top_left=$(printf "\xe2\x94\x8c")    # Upper-left corner
  top_right=$(printf "\xe2\x94\x90")   # Upper-right corner
  bottom_left=$(printf "\xe2\x94\x94") # Lower-left corner
  bottom_right=$(printf "\xe2\x94\x98") # Lower-right corner
  horizontal=$(printf "\xe2\x94\x80")  # Horizontal line
  vertical=$(printf "\xe2\x94\x82")    # Vertical line
fi

load_config() {
    [ -f "$CONFIG_FILE" ] && source "$CONFIG_FILE"
    # Override with test.env if it exists
    [ -f "$BB_CONFIG_DIR/test.env" ] && source "$BB_CONFIG_DIR/test.env" && PORT="${APP_PORT:-$PORT}" && TOKEN="${LOGIN_TOKEN:-$TOKEN}"
}

load_config
# Trap EXIT signal to save config on script termination
trap save_config EXIT

save_config() {
  mkdir -p "$BB_CONFIG_DIR"
  chmod 700 "$BB_CONFIG_DIR"  # Restrict to owner only
  cat > "$CONFIG_FILE" <<EOF
EMAIL="${EMAIL:-}"
LICENSE_KEY="${LICENSE_KEY:-}"
BBX_HOSTNAME="${BBX_HOSTNAME:-$DOMAIN}"
TOKEN="${TOKEN:-}"
PORT="${PORT:-}"
EOF
  chmod 600 "$CONFIG_FILE"
}

ensure_nvm() {
    if [ -f "$HOME/.nvm/nvm.sh" ]; then
        source "$HOME/.nvm/nvm.sh" || { printf "${RED}Failed to source nvm.sh${NC}\n"; exit 1; }
    else
        printf "${RED}nvm not found at $HOME/.nvm/nvm.sh. Install it first.${NC}\n"
        exit 1
    fi
}

# Validate product key with server, loop until valid
validate_license_key() {
  local force_prompt="${1:-false}"  # Only force prompt if explicitly requested
  load_config

  # If no key exists or we're forcing a new one, prompt
  if [ -z "$LICENSE_KEY" ] || [ "$force_prompt" = "true" ]; then
    while true; do
      read -r -p "Enter License Key (e.g., U0TZ-GNMD-S889-RETG-YMCH-EAMR-ZOKU-2KRO): " LICENSE_KEY
      if [ -z "$LICENSE_KEY" ]; then
        printf "${RED}ERROR: License key cannot be empty. Try again.${NC}\n"
        continue
      fi
      if [[ "$LICENSE_KEY" =~ ^[A-Z0-9]{4}(-[A-Z0-9]{4}){7}$ ]]; then
        export LICENSE_KEY
        if eval "bbcertify --force-license $REDIRECT 2>&1"; then
          printf "${GREEN}License key validated with server.${NC}\n"
          save_config
          return 0
        else
          printf "${RED}ERROR: License key invalid or server unreachable. Try again.${NC}\n"
          LICENSE_KEY=""
        fi
      else
        printf "${RED}ERROR: Invalid format. Must be 8 groups of 4 uppercase A-Z0-9 characters, separated by hyphens.${NC}\n"
        LICENSE_KEY=""
      fi
    done
  else
    # Validate existing key
    export LICENSE_KEY
    if eval "bbcertify --force-license $REDIRECT 2>&1"; then
      printf "${GREEN}Existing product key is valid.${NC}\n"
      return 0
    else
      printf "${RED}Current product key ($LICENSE_KEY) is invalid. Run 'bbx certify' to update it.${NC}\n"
      return 1
    fi
  fi
}

# Box drawing helper function
draw_box() {
    local text="$1"
    if [[ -n "$BBX_DEBUG" ]]; then
      echo "Skipping draw box for debug, just outputting message..." >&2
      echo "$text"
      return 0
    fi
    local padding_left=1  # Left padding space
    local padding_right=1 # Right padding space
    local text_width=${#text}
    local inner_width=$((text_width + padding_left + padding_right)) # Space inside borders

    # Start with a newline to separate from previous output
    printf "\n"
    # Draw top border
    printf "  %s" "$top_left"
    for i in $(seq 1 "$inner_width"); do
        printf "%s" "$horizontal"
    done
    printf "%s\n" "$top_right"
    # Draw text line with padding
    printf "  %s" "$vertical"
    printf "%${padding_left}s" " "
    printf "%-${text_width}s" "$text"
    printf "%${padding_right}s" " "
    printf "%s\n" "$vertical"
    # Draw bottom border
    printf "  %s" "$bottom_left"
    for i in $(seq 1 "$inner_width"); do
        printf "%s" "$horizontal"
    done
    printf "%s\n" "$bottom_right"
    # End with a newline for clean separation
    printf "\n"
}

# Get system hostname
get_system_hostname() {
    # Try HOSTNAME env var, then uname -n, then /proc/sys/kernel/hostname, then fallback
    local host="${HOSTNAME}"
    if [ -z "$host" ] && command -v uname &>/dev/null; then
        host=$(uname -n)
    fi
    if [ -z "$host" ] && [ -f /proc/sys/kernel/hostname ]; then
        host=$(cat /proc/sys/kernel/hostname)
    fi
    echo "${host:-unknown}"
}

is_local_hostname() {
  local hostname="$1"
  local resolved_ips ip
  local public_dns_servers=("8.8.8.8" "1.1.1.1" "208.67.222.222")
  local has_valid_result=0
  local all_private=1

  for dns in "${public_dns_servers[@]}"; do
    resolved_ips=$(dig +short "$hostname" A @"$dns")
    if [[ -n "$resolved_ips" ]]; then
      has_valid_result=1
      while IFS= read -r ip; do
        ip="${ip%.}"
        # Public if NOT in known private ranges
        if [[ ! "$ip" =~ ^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1$|fe80:) ]]; then
          return 1  # Public
        fi
      done <<< "$resolved_ips"
    fi
  done

  # If all results were private or none resolved, treat as local
  if [[ "$has_valid_result" -eq 1 ]]; then
    return 0  # All IPs private => local
  fi

  # Fallback: check /etc/hosts (or similar)
  if command -v getent &>/dev/null; then
    ip=$(getent hosts "$hostname" | awk '{print $1}' | head -n1)
    if [[ "$ip" =~ ^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1$|fe80:) ]]; then
      return 0  # Local
    fi
  fi

  return 0  # Unresolvable or garbage → treat as local
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

# Parse dependency syntax: <os_label>:<pkg>,<pkg>[/<tool>]
parse_dep() {
    local dep="$1"
    local os_type=""
    local pkg_name=""
    local tool_name=""

    # OS detection
    if [ -f /etc/debian_version ]; then
        os_type="debian"
    elif [ -f /etc/redhat-release ]; then
        os_type="redhat"
    elif [ "$(uname -s)" = "Darwin" ]; then
        os_type="darwin"
    fi
    [ -n "$BBX_DEBUG" ] && printf "${YELLOW}DEBUG: OS type is $os_type for dep '$dep'${NC}\n" >&2

    # Split by comma
    IFS=',' read -r -a parts <<< "$dep"
    [ ${#parts[@]} -lt 1 ] && { printf "${RED}Invalid dep syntax: '$dep'${NC}\n" >&2; exit 1; }

    # Last part is <pkg>[/<tool>] - portable method
    local last_part="${parts[$((${#parts[@]} - 1))]}"
    [ -n "$BBX_DEBUG" ] && printf "${YELLOW}DEBUG: last_part is '$last_part'${NC}\n" >&2

    # Split last part into pkg and tool (handle optional /)
    IFS='/' read -r default_pkg tool_name <<< "$last_part"
    [ -z "$tool_name" ] && tool_name="$default_pkg"  # If no /, tool_name = pkg_name
    # If last_part has a colon (e.g., darwin:netcat/nc), use only the pkg part after colon as default
    case "$default_pkg" in
        *:*)
            IFS=':' read -r _ pkg_name <<< "$default_pkg"
            ;;
        *)
            pkg_name="$default_pkg"
            ;;
    esac
    [ -z "$pkg_name" ] && { printf "${RED}No package specified in '$dep'${NC}\n" >&2; exit 1; }
    [ -n "$BBX_DEBUG" ] && printf "${YELLOW}DEBUG: Default pkg_name='$pkg_name', tool_name='$tool_name'${NC}\n" >&2

    # Look for OS-specific package
    for part in "${parts[@]::${#parts[@]}-1}"; do
        IFS=':' read -r label pkg <<< "$part"
        [ -z "$label" ] || [ -z "$pkg" ] && { printf "${RED}Invalid OS label syntax: '$part'${NC}\n" >&2; exit 1; }
        if [ "$label" = "$os_type" ]; then
            pkg_name="$pkg"
            break
        fi
    done

    [ -n "$BBX_DEBUG" ] && printf "${YELLOW}DEBUG: Parsed '$dep' -> '$pkg_name:$tool_name'${NC}\n" >&2
    echo "$pkg_name:$tool_name"
}

# Dependency check
ensure_deps() {
    local deps=("curl" "rsync" "debian:netcat-openbsd,redhat:nmap-ncat,darwin:netcat/nc" "debian:ncat,redhat:nmap/ncat,darwin:nmap/ncat" "at" "unzip" "debian:dnsutils,redhat:bind-utils,darwin:bind/dig" "git" "openssl" "debian:login,redhat:util-linux/sg" "darwin:coreutils/timeout")
    for dep in "${deps[@]}"; do
        # Parse the dependency
        IFS=':' read -r pkg_name tool_name <<< "$(parse_dep "$dep")"

        # Check if the tool exists
        if ! command -v "$tool_name" >/dev/null 2>&1; then

            # Install based on OS
            if [ -f /etc/debian_version ]; then
                $SUDO apt-get update && $SUDO apt-get install -y "$pkg_name"
            elif [ -f /etc/redhat-release ]; then
                $SUDO yum install -y "$pkg_name" || $SUDO dnf install -y "$pkg_name"
            elif [ "$(uname -s)" = "Darwin" ]; then
                if ! command -v brew >/dev/null; then
                    printf "${RED}Homebrew not found. Install it first: https://brew.sh${NC}\n"
                    exit 1
                fi
                if [[ "$pkg_name" == "util-linux" ]]; then
                  continue
                fi
                brew install "$pkg_name"
            else
                printf "${RED}Cannot install $pkg_name. Unsupported OS. Please install it manually.${NC}\n"
                exit 1
            fi

            # Verify installation
            if ! command -v "$tool_name" >/dev/null 2>&1; then
                printf "${RED}Failed to install $pkg_name (for $tool_name). Please install it manually.${NC}\n"
                exit 1
            fi

            printf "${YELLOW}Installed $pkg_name (for $tool_name)${NC}\n"
        fi
    done
}

find_free_port_block() {
  local start_port=4024
  local end_port=65533
  for ((port=start_port+2; port<=end_port-2; port++)); do
    local cdp_port=$((port-3000))
    if [ "$cdp_port" -lt 1024 ]; then
      continue
    fi
    local free=true
    for ((i=-2; i<=2; i++)); do
      if ! bash -c "exec 6<>/dev/tcp/127.0.0.1/$((port+i))" 2>/dev/null; then
        : # Port is free
      else
        free=false
        break
      fi
    done
    if $free && ! bash -c "exec 6<>/dev/tcp/127.0.0.1/$cdp_port" 2>/dev/null; then
      echo "$port"
      return 0
    fi
  done
  printf "${RED}No free 5-port block + CDP endpoint (port-3000) found between 4024-65533.${NC}\n"
  exit 1
}

# Test port accessibility via firewall
test_port_access() {
    local port="$1"
    printf "${YELLOW}Testing port $port accessibility...${NC}\n"
    (echo -e "HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nOK" | ncat -l "$port" >/dev/null 2>&1) &
    local pid=$!
    sleep 1
    if curl -s --max-time 2 "http://localhost:$port" | grep -q "OK"; then
        printf "${GREEN}Port $port is accessible.${NC}\n"
        kill $pid &>/dev/null
        return 0
    else
        printf "${RED}Port $port is blocked by firewall. Open with ufw/firewall-cmd.${NC}\n"
        kill $pid &>/dev/null
        return 1
    fi
}

# Ensure setup_tor is run for the user (assume global, check Tor service)
ensure_setup_tor() {
    local user="$1"
    local tor_is_running=false
    if [[ "$(uname -s)" == "Darwin" ]]; then
        brew services list | grep -q "tor.*started" && tor_is_running=true
    else
        systemctl is-active tor >/dev/null 2>&1 && tor_is_running=true
    fi
    if ! $tor_is_running || ! command -v tor >/dev/null 2>&1; then
        printf "${YELLOW}Setting up Tor for user $user...${NC}\n"
        $SUDO bash -c "PATH=/usr/local/bin:\$PATH setup_tor '$user'" || { printf "${RED}Failed to setup Tor for $user${NC}\n"; exit 1; }
    fi
}

install() {
    banner
    check_agreement
    pre_install || return 0
    load_config
    ensure_deps
    printf "${GREEN}Installing BrowserBox CLI (bbx)...${NC}\n"
    mkdir -p "$BBX_HOME/BrowserBox" || { printf "${RED}Failed to create $BBX_HOME/BrowserBox${NC}\n"; exit 1; }
    printf "${YELLOW}Fetching BrowserBox repository...${NC}\n"
    $SUDO rm -rf $BBX_HOME/BrowserBox*
    curl --connect-timeout 8 -sL "$REPO_URL/archive/refs/heads/${branch}.zip" -o "$BBX_HOME/BrowserBox.zip" || { printf "${RED}Failed to download BrowserBox repo${NC}\n"; exit 1; }
    unzip -o -q "$BBX_HOME/BrowserBox.zip" -d "$BBX_HOME/BrowserBox-zip" || { printf "${RED}Failed to extract BrowserBox repo${NC}\n"; exit 1; }
    mv $BBX_HOME/BrowserBox-zip/BrowserBox-${branch} $BBX_HOME/BrowserBox 
    $SUDO rm -rf $BBX_HOME/BrowserBox-zip
    $SUDO rm -f $BBX_HOME/BrowserBox.zip
    chmod +x "$BBX_HOME/BrowserBox/deploy-scripts/global_install.sh" || { printf "${RED}Failed to make global_install.sh executable${NC}\n"; exit 1; }
    local default_hostname=$(get_system_hostname)

    if [ -z "$BBX_HOSTNAME" ]; then
      if [[ -n "$BBX_TEST_AGREEMENT" ]]; then 
        BBX_HOSTNAME="localhost"
      else
        read -r -p "Enter hostname (default: $default_hostname): " BBX_HOSTNAME
      fi
    fi
    BBX_HOSTNAME="${BBX_HOSTNAME:-$default_hostname}"
    STRICTNESS="mandatory";
    if is_local_hostname "$BBX_HOSTNAME"; then
        STRICTNESS="optional"
        ensure_hosts_entry "$BBX_HOSTNAME"
    fi
    if [ -z "$EMAIL" ]; then
      if [[ -n "$BBX_TEST_AGREEMENT" ]]; then 
        EMAIL=""
      else
        read -r -p "Enter your email for Let's Encrypt ($STRICTNESS for $BBX_HOSTNAME): " EMAIL
      fi
      if [[ "$STRICTNESS" == "mandatory" ]] && [[ -z "$EMAIL" ]]; then
        echo "An email is required for a public DNS hostname in order to provision the TLS certificate from Let's Encrypt." >&2
        echo "Exiting..." >&2
        exit 1
      fi
    fi
    
    if [ -t 0 ] && [[ -z "$BBX_TEST_AGREEMENT" ]]; then
        printf "${YELLOW}Running BrowserBox installer interactively...${NC}\n"
        cd "$BBX_HOME/BrowserBox" && ./deploy-scripts/global_install.sh "$BBX_HOSTNAME" "$EMAIL"
    else
        printf "${YELLOW}Running BrowserBox installer non-interactively...${NC}\n"
        cd "$BBX_HOME/BrowserBox" && (yes | ./deploy-scripts/global_install.sh "$BBX_HOSTNAME" "$EMAIL")
    fi
    [ $? -eq 0 ] || { printf "${RED}Installation failed${NC}\n"; exit 1; }
    printf "${YELLOW}Updating npm and pm2...${NC}\n"
    ensure_nvm
    npm i -g npm@latest
    npm i -g pm2@latest
    timeout 5s pm2 update
    printf "${YELLOW}Installing bbx command globally...${NC}\n"
    $SUDO curl -sL "$REPO_URL/raw/${branch}/bbx.sh" -o "$BBX_BIN" || { printf "${RED}Failed to install bbx${NC}\n"; $SUDO rm -f "$BBX_BIN"; exit 1; }
    $SUDO chmod +x "$BBX_BIN"
    save_config
    printf "${GREEN}bbx $BBX_VERSION installed successfully! Run 'bbx --help' for usage.${NC}\n"
}

setup() {
  load_config
  ensure_deps

  local port="${PORT:-$(find_free_port_block)}"
  local hostname="${BBX_HOSTNAME:-$(get_system_hostname)}"
  local token="${TOKEN}"

  while [ $# -gt 0 ]; do
    case "$1" in
      --port|-p)
        port="$2"
        shift 2
        ;;
      --hostname|-h)
        hostname="$2"
        shift 2
        ;;
      --token|-t)
        token="$2"
        shift 2
        ;;
      *)
        printf "${RED}Unknown option: $1${NC}\n"
        printf "Usage: bbx setup [--port|-p <port>] [--hostname|-h <hostname>] [--token|-t <token>]\n"
        exit 1
        ;;
    esac
  done

  if ! [[ "$port" =~ ^[0-9]+$ ]] || [ "$port" -lt 1024 ] || [ "$port" -gt 65535 ]; then
    printf "${RED}Invalid port: $port. Must be between 1024 and 65535.${NC}\n"
    exit 1
  fi

  PORT="$port"
  BBX_HOSTNAME="$hostname"
  TOKEN="${token:-$(openssl rand -hex 16)}"
  BB_TOKEN="${TOKEN}"

  printf "${YELLOW}Setting up BrowserBox on $hostname:$port...${NC}\n"
  if ! is_local_hostname "$hostname"; then
    printf "${BLUE}DNS Note:${NC} Ensure an A/AAAA record points from $hostname to this machine's IP.\n"
    curl --connect-timeout 8 -sL "$REPO_URL/raw/${branch}/deploy-scripts/wait_for_hostname.sh" -o "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh" || { printf "${RED}Failed to download wait_for_hostname.sh${NC}\n"; exit 1; }
    chmod +x "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh"
    "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh" "$hostname" || { printf "${RED}Hostname $hostname not resolving${NC}\n"; exit 1; }
  else
    ensure_hosts_entry "$hostname"
  fi

  # Ensure we have a valid product key
  if ! validate_license_key; then
    #printf "${YELLOW}Setting up a new product key...${NC}\n"
    #validate_license_key "true"  # Force prompt if invalid or missing
    printf "${RED}License key invalid or missing. Run 'bbx activate' or go to dosaygo.com to get a valid key.${NC}\n"
  fi

  TOKEN="${BB_TOKEN}"

  pkill ncat
  for i in {-2..2}; do
    test_port_access $((port+i)) || { printf "${RED}Adjust firewall to allow ports $((port-2))-$((port+2))/tcp${NC}\n"; exit 1; }
  done
  test_port_access $((port-3000)) || { printf "${RED}CDP port $((port-3000)) blocked${NC}\n"; exit 1; }
  LICENSE_KEY="${LICENSE_KEY}" setup_bbpro --port "$port" --token "$TOKEN" || { printf "${RED}Setup failed${NC}\n"; exit 1; }
  source "$BB_CONFIG_DIR/test.env" && PORT="${APP_PORT:-$port}" && TOKEN="${LOGIN_TOKEN:-$TOKEN}" || { printf "${YELLOW}Warning: test.env not found${NC}\n"; }
  save_config
  printf "${GREEN}Setup complete.${NC}\n"
  draw_box "Login Link: $(cat "$BB_CONFIG_DIR/login.link" 2>/dev/null || echo "https://$hostname:$port/login?token=$TOKEN")"
}

run() {
  banner
  load_config

  # Ensure setup has been run
  if [ -z "$PORT" ] || [ -z "$BBX_HOSTNAME" ] || [[ ! -f "$BB_CONFIG_DIR/test.env" ]] ; then
    printf "${YELLOW}BrowserBox not fully set up. Running 'bbx setup' first...${NC}\n"
    setup
    load_config
  fi

  # Default values (should be set by setup, but fallback for safety)
  local port="${PORT}"
  local hostname="${BBX_HOSTNAME}"

  # Parse arguments to override if provided
  while [ $# -gt 0 ]; do
    case "$1" in
      --port|-p)
        port="$2"
        shift 2
        ;;
      --hostname|-h)
        hostname="$2"
        shift 2
        ;;
      *)
        printf "${RED}Unknown option or extra argument: $1${NC}\n"
        printf "Usage: bbx run [--port|-p <port>] [--hostname|-h <hostname>]\n"
        exit 1
        ;;
    esac
  done

  PORT="$port"
  BBX_HOSTNAME="$hostname"
  printf "${YELLOW}Starting BrowserBox on $hostname:$port...${NC}\n"
  if ! is_local_hostname "$hostname"; then
    printf "${BLUE}DNS Note:${NC} Ensure an A/AAAA record points from $hostname to this machine's IP.\n"
    "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh" "$hostname" || { printf "${RED}Hostname $hostname not resolving${NC}\n"; exit 1; }
  else
    ensure_hosts_entry "$hostname"
  fi

  # Validate existing product key
  export LICENSE_KEY;
  if ! bbcertify >/dev/null 2>&1; then
    printf "${RED}License key invalid or missing. Run 'bbx activate' or go to dosaygo.com to get a valid key.${NC}\n"
    #exit 1
  fi
  printf "${GREEN}Certification complete.${NC}\n"

  bbpro &>/dev/null || { printf "${RED}Failed to start${NC}\n"; exit 1; }
  source "$BB_CONFIG_DIR/test.env" && PORT="${APP_PORT:-$port}" && TOKEN="${LOGIN_TOKEN:-$TOKEN}" || { printf "${YELLOW}Warning: test.env not found${NC}\n"; }
  local login_link=$(cat "$BB_CONFIG_DIR/login.link" 2>/dev/null || echo "https://$hostname:$port/login?token=$TOKEN")
  draw_box "Login Link: $login_link"
  save_config
}

tor_run() {
  banner
  load_config
  ensure_deps

  local anonymize=true onion=true
  while [ $# -gt 0 ]; do
    case "$1" in
      --anonymize) anonymize=true; shift ;;
      --no-anonymize) anonymize=false; shift ;;
      --onion) onion=true; shift ;;
      --no-onion) onion=false; shift ;;
      *) printf "${RED}Unknown option: $1${NC}\n"; exit 1 ;;
    esac
  done
  if ! $anonymize && ! $onion; then
    printf "${RED}ERROR: At least one of --anonymize or --onion must be enabled.${NC}\n"
    exit 1
  fi

  # Trigger setup if not fully configured
  if [ -z "$PORT" ] || [ -z "$BBX_HOSTNAME" ] || [[ ! -f "$BB_CONFIG_DIR/test.env" ]] ; then
    printf "${YELLOW}BrowserBox not fully set up. Running 'bbx setup' first...${NC}\n"
    setup
    load_config
  fi

  [ -n "$TOKEN" ] || TOKEN=$(openssl rand -hex 16)
  printf "${YELLOW}Starting BrowserBox with Tor...${NC}\n"
  ensure_setup_tor "$(whoami)"

  # Determine Tor group and cookie file dynamically
  if [[ "$(uname -s)" == "Darwin" ]]; then
      TOR_GROUP="admin"  # Homebrew default
      TORDIR="$(brew --prefix)/var/lib/tor"
      COOKIE_AUTH_FILE="$TORDIR/control_auth_cookie"
  else
      TORDIR="/var/lib/tor"
      COOKIE_AUTH_FILE="$TORDIR/control_auth_cookie"
      TOR_GROUP=$(ls -ld "$TORDIR" | awk '{print $4}' 2>/dev/null)
      if [[ -z "$TOR_GROUP" || "$TOR_GROUP" == "root" ]]; then
        TOR_GROUP=$(getent group | grep -E 'tor|debian-tor|toranon' | cut -d: -f1 | head -n1)
      fi
      if [[ -z "$TOR_GROUP" ]]; then
        TOR_GROUP="${TOR_GROUP:-debian-tor}"  # Allow env override
        printf "${YELLOW}Warning: Could not detect Tor group. Using default: $TOR_GROUP. Set TOR_GROUP env var if incorrect.${NC}\n"
      fi
  fi

  local user="$(whoami)"
  local in_tor_group=false
  if id | grep -qw "$TOR_GROUP"; then
      in_tor_group=true
      printf "${GREEN}User $user already in group $TOR_GROUP${NC}\n"
  elif ! command -v sg >/dev/null 2>&1; then
      printf "${YELLOW}sg not found and $user not in $TOR_GROUP, may fail without Tor group access${NC}\n"
  fi

    local setup_cmd="setup_bbpro --port $PORT --token $TOKEN"
    if $anonymize; then
        setup_cmd="$setup_cmd --ontor"
    fi
    if ! $onion && ! is_local_hostname "$BBX_HOSTNAME"; then
        "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh" "$BBX_HOSTNAME" || { printf "${RED}Hostname $BBX_HOSTNAME not resolving${NC}\n"; exit 1; }
    elif ! $onion; then
        ensure_hosts_entry "$BBX_HOSTNAME"
    fi
    LICENSE_KEY="${LICENSE_KEY}" $setup_cmd || { printf "${RED}Setup failed${NC}\n"; exit 1; }
    source "$BB_CONFIG_DIR/test.env" && PORT="${APP_PORT:-$PORT}" && TOKEN="${LOGIN_TOKEN:-$TOKEN}" || { printf "${YELLOW}Warning: test.env not found${NC}\n"; }
    # Validate existing product key
    export LICENSE_KEY
    if ! bbcertify >/dev/null 2>&1; then
      printf "${RED}License key invalid or missing. Run 'bbx activate' or go to dosaygo.com to get a valid key.${NC}\n"
      #exit 1
    fi
    printf "${GREEN}Certification complete.${NC}\n"

    local login_link=""
    if $onion; then
        printf "${YELLOW}Running as onion site...${NC}\n"
        if $in_tor_group; then
            # Run torbb directly if user is in TOR_GROUP
            login_link="$(torbb)"
        elif command -v sg >/dev/null 2>&1; then
            # Use safe heredoc with env
            export BB_CONFIG_DIR
            login_link="$($SUDO -u ${SUDO_USER:-$USER} sg "$TOR_GROUP" -c "env PATH=\"$PATH\" BB_CONFIG_DIR=\"$BB_CONFIG_DIR\" bash -cl torbb")"
        else
            # Fallback without sg
            login_link="$(torbb)"
        fi
        [ $? -eq 0 ] && [ -n "$login_link" ] || { printf "${RED}torbb failed${NC}\n"; tail -n 5 "$BB_CONFIG_DIR/torbb_errors.txt"; echo "$login_link"; exit 1; }
        TEMP_HOSTNAME=$(echo "$login_link" | sed 's|https://\([^/]*\)/login?token=.*|\1|')
    else
        pkill ncat
        for i in {-2..2}; do
            test_port_access $((PORT+i)) || { printf "${RED}Adjust firewall for ports $((PORT-2))-$((PORT+2))/tcp${NC}\n"; exit 1; }
        done
        test_port_access $((PORT-3000)) || { printf "${RED}CDP port $((PORT-3000)) blocked${NC}\n"; exit 1; }
        bbpro || { printf "${RED}Failed to start${NC}\n"; exit 1; }
        login_link=$(cat "$BB_CONFIG_DIR/login.link" 2>/dev/null || echo "https://$TEMP_HOSTNAME:$PORT/login?token=$TOKEN")
    fi
    sleep 2
    printf "${GREEN}BrowserBox with Tor started.${NC}\n"
    draw_box "Login Link: $login_link"
    save_config

    # Tor status display functions
    get_tor_status() {
        local cookie_hex=""
        if [ -r "$COOKIE_AUTH_FILE" ]; then
            cookie_hex=$(xxd -u -p -c32 "$COOKIE_AUTH_FILE" | tr -d '\n')
        elif $SUDO test -r "$COOKIE_AUTH_FILE"; then
            cookie_hex=$($SUDO xxd -u -p -c32 "$COOKIE_AUTH_FILE" | tr -d '\n')
        fi
        if [ -z "$cookie_hex" ]; then
            printf "${YELLOW}Warning: Failed to read Tor cookie${NC}\n" >&2
            return 1
        fi

        local cmd=$(printf 'AUTHENTICATE %s\r\nGETINFO status/bootstrap-phase\r\nQUIT\r\n' "$cookie_hex")
        local response=$(echo -e "$cmd" | nc -w 5 127.0.0.1 9051 2>/dev/null)

        if [ -z "$response" ]; then
            printf "${YELLOW}Warning: Tor control port not responding${NC}\n" >&2
            return 1
        fi

        local status_line=$(echo "$response" | grep "250-status/bootstrap-phase=")
        if [ -z "$status_line" ]; then
            printf "${YELLOW}Warning: Invalid response from Tor control port${NC}\n" >&2
            return 1
        fi

        if echo "$status_line" | grep -q "SUMMARY=\"Done\""; then
            echo "100"
        else
            local progress=$(echo "$status_line" | grep -o "PROGRESS=[0-9]*" | cut -d'=' -f2)
            [ -n "$progress" ] && echo "$progress" || echo "0"
        fi
    }

    draw_progress_bar() {
        local percent=$1
        local bar_width=30
        local filled=$((percent * bar_width / 100))
        local empty=$((bar_width - filled))

        printf "\rTor Progress: [${GREEN}"
        for ((i = 0; i < filled; i++)); do printf "█"; done
        printf "${NC}"
        for ((i = 0; i < empty; i++)); do printf " "; done
        printf "] %3d%%" "$percent"
    }

    show_tor_status() {
        local max_attempts=240  # 120 seconds total with 0.5s sleep
        local poll_interval=10  # Check every 5 seconds (10 * 0.5s)
        local spinner_chars="|/-\|"
        local attempts=0
        local counter=0
        local spinner_idx=0
        local percent=0

        printf "${YELLOW}Checking Tor connection status...${NC}\n" >&2
        while [ $attempts -lt "$max_attempts" ]; do
            if [ $((counter % 2)) -eq 0 ]; then
                spinner_idx=$(( (spinner_idx + 1) % 4 ))
                local spinner="${spinner_chars:$spinner_idx:1}"
            fi

            if [ $((counter % poll_interval)) -eq 0 ]; then
                percent=$(get_tor_status) || percent=0
                attempts=$((attempts + 1))
                if [ "$percent" -eq 100 ]; then
                    draw_progress_bar 100
                    printf "\n${GREEN}Tor is fully connected and ready.${NC}\n" >&2
                    return 0
                fi
            fi

            draw_progress_bar "$percent"
            sleep 0.5
            counter=$((counter + 1))
        done

        draw_progress_bar "$percent"
        printf "\n${YELLOW}Warning: Tor not fully connected after 120 seconds (progress at $percent%%).${NC}\n" >&2
        printf "${YELLOW}BrowserBox may still work, but Tor connectivity might be incomplete.${NC}\n" >&2
        return 1
    }

    # Display Tor status without restarting
    if ! [ -r "$COOKIE_AUTH_FILE" ] && ! $SUDO test -r "$COOKIE_AUTH_FILE"; then
        printf "${YELLOW}Warning: Tor cookie file ($COOKIE_AUTH_FILE) not accessible. Skipping status check.${NC}\n"
    else
        show_tor_status
    fi
}

docker_run() {
  banner
  load_config  # Load existing config, including LICENSE_KEY
  ensure_deps

  local nickname=""
  local port="${PORT:-$(find_free_port_block)}"
  local hostname="${BBX_HOSTNAME:-$(get_system_hostname)}"
  local email="${EMAIL:-$USER@$hostname}"

  while [ $# -gt 0 ]; do
    case "$1" in
      --port|-p)
        port="$2"
        shift 2
        ;;
      *)
        if [ -z "$nickname" ]; then
          nickname="$1"
        else
          printf "${RED}Unknown or extra argument: $1${NC}\n"
          printf "Usage: bbx docker-run [nickname] [--port|-p <port>]${NC}\n"
          exit 1
        fi
        shift
        ;;
    esac
  done

  if [ -z "$nickname" ]; then
    nickname=$(head -c8 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c6)
    printf "${YELLOW}No nickname provided. Generated: $nickname${NC}\n"
  fi

  [[ "$nickname" =~ ^[a-zA-Z0-9_-]+$ ]] || {
    printf "${RED}Invalid nickname: Must be alphanumeric with dashes or underscores${NC}\n"
    exit 1
  }

  local drun_file="$BB_CONFIG_DIR/docker-${nickname}"

  if ! [[ "$port" =~ ^[0-9]+$ ]] || [ "$port" -lt 4024 ] || [ "$port" -gt 65533 ]; then
    printf "${RED}Invalid port: $port. Must be between 4024 and 65533.${NC}\n"
    exit 1
  fi

  # Trigger setup if not fully configured
  if [ -z "$PORT" ] || [ -z "$BBX_HOSTNAME" ] || [[ ! -f "$BB_CONFIG_DIR/test.env" ]] ; then
    printf "${YELLOW}BrowserBox not fully set up. Running 'bbx setup' first...${NC}\n"
    setup
    load_config
  fi

  PORT="$port"  # Override PORT if specified
  BBX_HOSTNAME="$hostname"

  if ! command -v docker >/dev/null 2>&1; then
    printf "${YELLOW}Installing Docker...${NC}\n"
    if ! command -v docker >/dev/null 2>&1; then
      printf "${YELLOW}Installing Docker...${NC}\n"
      if [ -f /etc/debian_version ]; then
        $SUDO apt-get update && $SUDO apt-get install -y docker.io
        $SUDO systemctl start docker
        $SUDO systemctl enable docker
      elif [ -f /etc/redhat-release ]; then
        $SUDO yum install -y docker || $SUDO dnf install -y docker
        $SUDO systemctl start docker
        $SUDO systemctl enable docker
      elif [ "$(uname -s)" = "Darwin" ]; then
        printf "${RED}Please install Docker Desktop manually on macOS: https://docs.docker.com/desktop/mac/install/${NC}\n"
        exit 1
      else
        printf "${RED}Unsupported OS. Install Docker manually: https://docs.docker.com/get-docker/${NC}\n"
        exit 1
      fi
      command -v docker >/dev/null 2>&1 || { printf "${RED}Docker installation failed${NC}\n"; exit 1; }
    fi
  fi

  # Validate existing product key
  if ! validate_license_key; then
    printf "${RED}License key invalid. Run 'bbx certify' to update it.${NC}\n"
    exit 1
  fi

  local run_docker_script="$BBX_HOME/BrowserBox/deploy-scripts/run_docker.sh"
  if [ ! -f "$run_docker_script" ]; then
    printf "${YELLOW}Fetching run_docker.sh script...${NC}\n"
    mkdir -p "$BBX_HOME/BrowserBox/deploy-scripts"
    curl --connect-timeout 8 -sL "$REPO_URL/raw/${branch}/deploy-scripts/run_docker.sh" -o "$run_docker_script" || {
      printf "${RED}Failed to download run_docker.sh script${NC}\n"
      exit 1
    }
    chmod +x "$run_docker_script"
  fi

  if [ ! -d "$BBX_HOME/BrowserBox" ]; then
    printf "${RED}BrowserBox directory not found. Run 'bbx install' first.${NC}\n"
    exit 1
  fi

  printf "${YELLOW}Starting Dockerized BrowserBox on $hostname:$port...${NC}\n"
  if ! is_local_hostname "$hostname"; then
    printf "${BLUE}DNS Note:${NC} Ensure an A/AAAA record points from $hostname to this machine's IP.\n"
  else
    ensure_hosts_entry "$hostname"
  fi

  printf "${YELLOW}Running run_docker.sh...${NC}\n"

  export BBX_DEBUG BBX_BRANCH
  local docker_output="$(bash -c "env LICENSE_KEY='$LICENSE_KEY' BBX_HOME='$BBX_HOME' drun_file='$drun_file' port='$port' hostname='$hostname' email='$email' bash" << 'EOF'
  if [[ -n "$BBX_DEBUG" ]]; then
    set -x
  fi
  cd "$BBX_HOME/BrowserBox" || { echo "Failed to cd to $BBX_HOME/BrowserBox"; exit 1; }
  if yes yes | ./deploy-scripts/run_docker.sh "$port" "$hostname" "$email" 2>&1; then 
    echo "success" > "$drun_file"
  else
    :
  fi
EOF
  )"
  if [[ ! -f "$drun_file" ]] || [[ "$(cat "$drun_file")" != "success" ]]; then
    printf "${RED}Docker run failed${NC}\n"
    echo "Docker run output:"
    echo ""
    echo "$docker_output"
    echo ""
    exit 1
  fi
  rm -f "$drun_file"

  local container_id=$(echo "$docker_output" | grep "Container ID:" | awk '{print $NF}' | tail -n1)
  local login_link=$(echo "$docker_output" | grep "Login Link:" | sed 's/Login Link: //' | tail -n1)

  [ -n "$container_id" ] || {
    printf "${RED}Failed to get container ID${NC}\n"
    exit 1
  }
  [ -n "$login_link" ] || login_link="https://$hostname:$port/login?token=<check_logs>"

  local tmp_file=$(mktemp)
  jq --arg nick "$nickname" --arg cid "$container_id" --arg port "$port" \
     '.[$nick] = {"container_id": $cid, "port": $port}' "$DOCKER_CONTAINERS_FILE" > "$tmp_file" && \
     mv "$tmp_file" "$DOCKER_CONTAINERS_FILE"

  printf "${CYAN}Dockerized BrowserBox started.${NC}\n"
  draw_box "Login Link: $login_link"
  draw_box "Nickname: $nickname"
  draw_box "Stop Command: bbx docker-stop $nickname"
  save_config
}

docker_stop() {
    banner
    load_config

    local nickname="$1"
    if [ -z "$nickname" ]; then
        printf "${RED}Usage: bbx docker-stop <nickname>${NC}\n"
        exit 1
    fi

    # Check if nickname exists
    local container_id=$(jq -r --arg nick "$nickname" '.[$nick].container_id // ""' "$DOCKER_CONTAINERS_FILE")
    local port=$(jq -r --arg nick "$nickname" '.[$nick].port // ""' "$DOCKER_CONTAINERS_FILE")
    if [ -z "$container_id" ]; then
        printf "${RED}No container found with nickname: $nickname${NC}\n"
        printf "${YELLOW}If you used a raw container ID, run: docker stop <container_id>${NC}\n"
        exit 1
    fi

    # Check if container is running
    if ! $SUDO docker ps -q --filter "id=$container_id" | grep -q .; then
        printf "${YELLOW}Container $nickname ($container_id) is not running.${NC}\n"
        # Remove from config anyway
        local tmp_file=$(mktemp)
        jq --arg nick "$nickname" 'del(.[$nick])' "$DOCKER_CONTAINERS_FILE" > "$tmp_file" && \
            mv "$tmp_file" "$DOCKER_CONTAINERS_FILE"
        printf "${GREEN}Removed $nickname from tracking.${NC}\n"
        exit 0
    fi

    printf "${YELLOW}Stopping BrowserBox for $nickname ($container_id)...${NC}\n"
    # Run stop_bbpro inside the container
    $SUDO docker exec "$container_id" bash -c "stop_bbpro" || {
        printf "${RED}Warning: Failed to run stop_bbpro in container${NC}\n"
    }
    printf "${YELLOW}Waiting 1 second for license release...${NC}\n"
    sleep 1

    # Stop the container
    $SUDO docker stop --timeout 3 "$container_id" || $SUDO docker stop --time 3 "$container_id" || {
        printf "${RED}Failed to stop container $container_id${NC}\n"
        exit 1
    }

    # Remove from config
    local tmp_file=$(mktemp)
    jq --arg nick "$nickname" 'del(.[$nick])' "$DOCKER_CONTAINERS_FILE" > "$tmp_file" && \
        mv "$tmp_file" "$DOCKER_CONTAINERS_FILE"

    printf "${GREEN}Dockerized BrowserBox ($nickname) stopped and removed from tracking.${NC}\n"
    draw_box "Nickname: $nickname"
    draw_box "Container ID: $container_id"
    draw_box "Port: $port"
}

# Helper: Create a master user with passwordless sudo and BB groups
create_master_user() {
    local user="$1"
    if [ "$(uname -s)" = "Darwin" ]; then
        $SUDO sysadminctl -deleteUser "$user" -secure 2>/dev/null
        local pw=$(openssl rand -base64 12)
        $SUDO sysadminctl -addUser "$user" -fullName "BrowserBox Master User" -password "$pw" -home "/Users/$user" -shell /bin/bash
        $SUDO dseditgroup -o edit -a "$user" -t user staff
        $SUDO createhomedir -c -u "$user" >/dev/null
        $SUDO -u "$user" bash -c 'echo "export PATH=$PATH:/usr/local/bin" >> ~/.bash_profile'
        $SUDO -u "$user" bash -c 'echo "export PATH=$PATH:/usr/local/bin" >> ~/.bashrc'
        $SUDO -u "$user" security create-keychain -p "$pw" "${user}.keychain"
        $SUDO -u "$user" security default-keychain -s "${user}.keychain"
        $SUDO -u "$user" security login-keychain -s "${user}.keychain"
        $SUDO -u "$user" security set-keychain-settings "${user}.keychain"
        $SUDO -u "$user" security unlock-keychain -p "$pw" "${user}.keychain"
    else
        $SUDO groupdel -f "$user" 2>/dev/null
        if [ -f /etc/redhat-release ]; then
            $SUDO useradd -m -s /bin/bash -c "BrowserBox Master User" "$user"
        else
            $SUDO adduser --disabled-password --gecos "BrowserBox Master User" "$user" >/dev/null 2>&1
        fi
        # Add BrowserBox-specific groups
        for group in browsers renice sudoers; do
            if ! getent group "$group" >/dev/null; then
                $SUDO groupadd "$group" 2>/dev/null
            fi
            $SUDO usermod -aG "$group" "$user" 2>/dev/null
        done
        # Enable lingering for systemd (Linux only)
        if command -v loginctl >/dev/null 2>&1; then
            $SUDO loginctl enable-linger "$user" 2>/dev/null
        fi
        # Ensure passwordless sudo
        if ! grep -q "%sudoers" /etc/sudoers; then
            echo "%sudoers ALL=(ALL:ALL) NOPASSWD:ALL" | $SUDO tee -a /etc/sudoers >/dev/null
        fi
    fi
    id "$user" >/dev/null 2>&1 || { printf "${RED}Failed to create master user $user${NC}\n"; exit 1; }
    printf "${GREEN}Created master user: $user with passwordless sudo${NC}\n"
}

# Pre-install function to ensure proper setup
pre_install() {
    # Check if we're running as root
    if [ "$(id -u)" -eq 0 ]; then
        echo "Warning: Do not install as root."

        if [ "$(uname -s)" = "Darwin" ]; then
          echo "Re-run bbx install from a regular user account. You will need passwordless sudo capabilities."
          echo "For example, see: https://web.archive.org/web/20241210214342/https://jefftriplett.com/2022/enable-sudo-without-a-password-on-macos/"
          exit 1
        fi

        # Prompt for a non-root user to run the install as
        if [ -z "$BBX_INSTALL_USER" ]; then
          read -p "Enter a regular user to run the installation: " install_user
          if [ -z "$install_user" ]; then
              printf "${RED}ERROR: A username is required${NC}\n"
              exit 1
          fi
        else
          install_user="${BBX_INSTALL_USER}"
        fi

        mkdir -p "$BB_CONFIG_DIR"
        echo "$install_user" > "$BB_CONFIG_DIR"/.install_user

        # Check if sudo is installed first - we need it before modifying /etc/sudoers
        if ! command -v sudo &>/dev/null; then
            echo "Sudo not found, installing sudo..."
            if [ -f /etc/debian_version ]; then
                apt update && apt install -y sudo
            elif [ -f /etc/redhat-release ]; then
                yum install -y sudo
            else
                echo "Unsupported distribution."
                exit 1
            fi
        fi

        # Check if curl is installed, and install if missing
        if ! command -v curl &>/dev/null; then
            echo "Curl not found, installing curl..."
            if [ -f /etc/debian_version ]; then
                apt update && apt install -y curl
            elif [ -f /etc/redhat-release ]; then
                yum install -y curl
            else
                echo "Unsupported distribution for curl installation."
                exit 1
            fi
        fi
        if ! command -v adduser &>/dev/null; then
            echo "adduser not found, installing adduser..."
            if [ -f /etc/debian_version ]; then
                apt update && apt install -y adduser
            elif [ -f /etc/redhat-release ]; then
                yum install -y adduser
            else
                echo "Unsupported distribution for adduser installation."
                exit 1
            fi
        fi

        # Check if the user exists, offer to create if not
        if id "$install_user" &>/dev/null; then
            echo "User $install_user found."
            # Ensure the user has passwordless sudo
            if ! $SUDO -u "$install_user" sudo -n true 2>/dev/null; then
                if ! getent group sudoers >/dev/null; then
                    $SUDO groupadd sudoers
                fi
                $SUDO usermod -aG sudoers "$install_user"
                if ! grep -q "%sudoers" /etc/sudoers; then
                    echo "%sudoers ALL=(ALL:ALL) NOPASSWD:ALL" | $SUDO tee -a /etc/sudoers >/dev/null
                fi
                printf "${YELLOW}Updated $install_user with passwordless sudo${NC}\n"
            fi
        else
            printf "${YELLOW}User $install_user does not exist. Creating...${NC}\n"
            create_master_user "$install_user"
        fi

        # Download the install script using curl and save it to a file
        echo "Downloading the installation script..."
        curl -sSL "https://raw.githubusercontent.com/BrowserBox/BrowserBox/refs/heads/$branch/bbx.sh" -o /tmp/bbx.sh
        chmod +x /tmp/bbx.sh
        install_group="$(id -gn "$install_user")"
        chown "${install_user}:${install_group}" /tmp/bbx.sh

        # Switch to the non-root user and run install
        echo "Switching to user $install_user..."
        su - "$install_user" -c "export BBX_HOSTNAME=\"$BBX_HOSTNAME\"; export EMAIL=\"$EMAIL\"; export LICENSE_KEY=\"$LICENSE_KEY\"; export BBX_TEST_AGREEMENT=\"$BBX_TEST_AGREEMENT\"; export STATUS_MODE=\"$STATUS_MODE\"; /tmp/bbx.sh install"

        if [[ -z "$BBX_TEST_AGREEMENT" ]] || [ -t 0 ]; then
          # Replace the root shell with the new user's shell
          exec su - "$install_user" -c "export BBX_HOSTNAME=\"$BBX_HOSTNAME\"; export EMAIL=\"$EMAIL\"; export LICENSE_KEY=\"$LICENSE_KEY\"; export BBX_TEST_AGREEMENT=\"$BBX_TEST_AGREEMENT\"; export STATUS_MODE=\"$STATUS_MODE\"; bash -l"
        else
          return 1
        fi
    else
        # If not running as root, continue with the normal install
        echo "Running as non-root user, proceeding with installation..."
        return 0
    fi
}

uninstall() {
    printf "${YELLOW}Uninstalling BrowserBox...${NC}\n"
    printf "${BLUE}This will remove all BrowserBox files, including config and installation directories.${NC}\n"
    read -r -p "Are you sure you want to proceed? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        printf "${RED}Uninstall cancelled.${NC}\n"
        exit 0
    fi
    if [ -d "$BB_CONFIG_DIR" ]; then
        printf "${YELLOW}Removing config directory: $BB_CONFIG_DIR...${NC}\n"
        printf "${RED}[WARNING!] This will clear all your BrowserBox website data, settings, cookies and history. Are you sure you want to delete this directory?${NC}\n"
        read -r -p "Confirm removal of $BB_CONFIG_DIR? (yes/no): " CONFIRM_CONFIG
        if [ "$CONFIRM_CONFIG" = "yes" ]; then
            rm -rf "$BB_CONFIG_DIR" && printf "${GREEN}Removed $BB_CONFIG_DIR${NC}\n" || printf "${RED}Failed to remove $BB_CONFIG_DIR${NC}\n"
        else
            printf "${YELLOW}Skipping $BB_CONFIG_DIR removal${NC}\n"
        fi
    fi
    if [ -d "$BBX_HOME" ]; then
        printf "${YELLOW}Removing .bbx directory: $BBX_HOME...${NC}\n"
        read -r -p "Confirm removal of $BBX_HOME? (yes/no): " CONFIRM_BBX
        if [ "$CONFIRM_BBX" = "yes" ]; then
            rm -rf "$BBX_HOME" && printf "${GREEN}Removed $BBX_HOME${NC}\n" || printf "${RED}Failed to remove $BBX_HOME${NC}\n"
        else
            printf "${YELLOW}Skipping $BBX_HOME removal${NC}\n"
        fi
    fi
    if [ -d "$BBX_SHARE" ]; then
        printf "${YELLOW}Removing system install directory: $BBX_SHARE...${NC}\n"
        read -r -p "Confirm removal of $BBX_SHARE? (yes/no): " CONFIRM_SYSTEM
        if [ "$CONFIRM_SYSTEM" = "yes" ]; then
            $SUDO rm -rf "$BBX_SHARE" && printf "${GREEN}Removed $BBX_SHARE${NC}\n" || printf "${RED}Failed to remove $BBX_SHARE${NC}\n"
        else
            printf "${YELLOW}Skipping $BBX_SHARE removal${NC}\n"
        fi
    fi
    if [ -f "$BBX_BIN" ]; then
        printf "${YELLOW}Removing bbx binary: $BBX_BIN...${NC}\n"
        read -r -p "Confirm removal of $BBX_BIN? (yes/no): " CONFIRM_BIN
        if [ "$CONFIRM_BIN" = "yes" ]; then
            $SUDO bash -c "(sleep 5; rm -f \"$(command -v bbx)\") &"
        else
            printf "${YELLOW}Skipping $BBX_BIN removal${NC}\n"
        fi
    fi
    printf "${GREEN}Uninstall complete.${NC}\n"
    exit 0
}

certify() {
  load_config
  printf "${YELLOW}Certifying BrowserBox license...${NC}\n"

  # Check if a license key was provided as an argument
  if [ -n "$1" ]; then
    LICENSE_KEY="$1"
    if [[ "$LICENSE_KEY" =~ ^[A-Z0-9]{4}(-[A-Z0-9]{4}){7}$ ]]; then
      export LICENSE_KEY
      if eval "bbcertify --force-license $REDIRECT 2>&1"; then
        printf "${GREEN}License key validated with server.${NC}\n"
        save_config
        printf "${GREEN}Certification complete.${NC}\n"
        return 0
      else
        printf "${RED}ERROR: License key invalid or server unreachable.${NC}\n"
        exit 1
      fi
    else
      printf "${RED}ERROR: Invalid format. Must be 8 groups of 4 uppercase A-Z0-9 characters, separated by hyphens.${NC}\n"
      exit 1
    fi
  fi

  # No argument provided, proceed with existing logic
  if [ -n "$LICENSE_KEY" ]; then
    printf "${BLUE}Current key: $LICENSE_KEY${NC}\n"
    if [[ -z "$BBX_TEST_AGREEMENT" ]]; then
      printf "Press Enter to validate it, or enter a new key to update: "
      read -r new_key
      if [ -z "$new_key" ]; then
        # Empty input: validate the current key
        if validate_license_key; then
          printf "${GREEN}License certified.${NC}\n"
        else
          printf "${YELLOW}Current key is invalid. Please enter a new one.${NC}\n"
          validate_license_key "true"  # Force prompt for a new key if validation fails
        fi
      else
        # Non-empty input: use it as the new key and validate
        LICENSE_KEY="$new_key"
        if [[ "$LICENSE_KEY" =~ ^[A-Z0-9]{4}(-[A-Z0-9]{4}){7}$ ]]; then
          export LICENSE_KEY
          if eval "bbcertify --force-license $REDIRECT 2>&1"; then
            printf "${GREEN}License key validated with server.${NC}\n"
            save_config
          else
            printf "${RED}ERROR: License key invalid or server unreachable.${NC}\n"
            validate_license_key "true"  # Fall back to full prompt loop if invalid
          fi
        else
          printf "${RED}ERROR: Invalid format. Must be 8 groups of 4 uppercase A-Z0-9 characters, separated by hyphens.${NC}\n"
          validate_license_key "true"  # Fall back to full prompt loop if format is wrong
        fi
      fi
    else
      # BBX_TEST_AGREEMENT is set, skip interactive prompt and validate current key
      if validate_license_key; then
        printf "${GREEN}License certified.${NC}\n"
      else
        printf "${RED}Current key ($LICENSE_KEY) is invalid in test mode.${NC}\n"
        exit 1
      fi
    fi
  else
    printf "${BLUE}No product key found. Please enter one.${NC}\n"
    validate_license_key "true"  # Force prompt for initial setup
  fi
  printf "${GREEN}Certification complete.${NC}\n"
}

stop() {
    load_config
    printf "${YELLOW}Stopping BrowserBox (current user)...${NC}\n"
    stop_bbpro &>/dev/null || { printf "${RED}Failed to stop. Check if BrowserBox is running.${NC}\n"; exit 1; }
    printf "${GREEN}BrowserBox stopped.${NC}\n"
}

logs() {
    printf "${YELLOW}Displaying BrowserBox logs...${NC}\n"
    ensure_nvm
    if command -v pm2 >/dev/null; then
        pm2 logs || { printf "${RED}pm2 logs failed${NC}\n"; exit 1; }
    else
        printf "${RED}pm2 not found. Install pm2 (npm i -g pm2) or check logs manually.${NC}\n"
        exit 1
    fi
}

# Helper function to convert epoch time to a timestamp format for touch -t
epoch_to_timestamp() {
  local epoch="$1"
  if [ "$(uname)" = "Darwin" ]; then
    # macOS uses date -r to convert epoch to a formatted string
    date -r "$epoch" +%Y%m%d%H%M.%S
  else
    # Linux uses date -d with @epoch
    date -d @"$epoch" +%Y%m%d%H%M.%S
  fi
}

is_lock_file_recent() {
  local lock_file="$1"
  # Check if the lock file exists
  if [ ! -f "$lock_file" ]; then
    return 1  # File doesn’t exist, so not recent
  fi

  # Create a temporary file with a unique name based on process ID
  local temp_file="/tmp/lock_check_$$"
  touch "$temp_file" || return 1  # Create the temp file; fail if it can’t be created

  # Get current time in seconds since epoch
  local current_time=$(date +%s)
  # Calculate the time 37 minutes ago (2220 seconds) as updates should never take longer than that
  local one_hour_ago=$((current_time - 2220))
  # Convert to a timestamp format compatible with touch -t
  local timestamp=$(epoch_to_timestamp "$one_hour_ago")

  # Set the temp file’s modification time the max allowed update preparing time
  touch -t "$timestamp" "$temp_file"

  # Check if the lock file is newer than the temp file
  if [ "$lock_file" -nt "$temp_file" ]; then
    rm "$temp_file"
    return 0  # Lock file is less than 1 hour old
  else
    rm "$temp_file"
    $SUDO rm -f "$lock_file"
    return 1  # Lock file is older than 1 hour update is error or timed out
  fi
}

check_and_prepare_update() {
  if [[ -n "$BBX_NO_UPDATE" ]]; then
    return 0
  fi
  # Skip for uninstall to avoid unnecessary checks
  ([ "$1" = "uninstall" ] || [ "$1" = "update" ] || [ "$1" = "install" ] || [ "$1" = "update-background" ]) && return 0

  load_config
  mkdir -p "$BB_CONFIG_DIR"
  chmod 700 "$BB_CONFIG_DIR"
  printf "${YELLOW}Checking for BrowserBox updates...${NC}\n"

  # Get current and repo versions
  local current_tag=$(get_version_info "$VERSION_FILE")
  local repo_tag=$(get_latest_repo_version)

  # Check if repo version fetch failed
  if [ "$repo_tag" = "unknown" ]; then
    printf "${YELLOW}Skipping update due to timeout or failure in fetching latest version.${NC}\n"
    return 0
  fi

  printf "${BLUE}Current: $current_tag${NC}\n"
  printf "${BLUE}Latest: $repo_tag${NC}\n"

  # Check if update is needed
  if [ "$current_tag" = "$repo_tag" ]; then
    printf "${GREEN}Already on the latest version ($repo_tag).${NC}\n"
    # Clean up BBX_NEW_DIR if it exists
    [ -d "$BBX_NEW_DIR" ] && $SUDO rm -rf "$BBX_NEW_DIR" && printf "${YELLOW}Cleaned up $BBX_NEW_DIR${NC}\n"
    return 0
  fi

  # No prepared update, start background preparation
  # Run update in background unless debug
  if [ -n "$BBX_DEBUG" ]; then
    printf "${GREEN}Background update starting...${NC}\n"
    update_background 
  else
    update_background &
    printf "${GREEN}Background update started. Check $LOG_FILE for progress.${NC}\n"
  fi
  return 0
}

check_prepare_and_install() {
  if [[ -n "$BBX_NO_UPDATE" ]]; then
    return 0
  fi
  repo_tag="$1"
  # Check if BBX_NEW_DIR has a prepared version
  if [ -f "$PREPARED_FILE" ]; then
    local prepared_location=$(sed -n '2p' "$PREPARED_FILE")
    if [ "$prepared_location" = "$BBX_NEW_DIR" ] && [[ -d "$BBX_NEW_DIR/BrowserBox" ]]; then
      local new_tag=$(get_version_info "$PREPARED_VERSION_FILE")
      if [ "$new_tag" = "$repo_tag" ]; then
        printf "${YELLOW}Latest version prepared in $BBX_NEW_DIR. Installing...${NC}\n"
        printf "${YELLOW}Latest version prepared in $BBX_NEW_DIR. Installing...${NC}\n" >> "$LOG_FILE"
        # we execute outside ourselves to avoid overwriting the bbx script when we finally move the prepared install into place
        is_running_in_official && self_elevate_to_temp "${OGARGS[@]}"
        # Move prepared version
        $SUDO rm -rf "$BBX_HOME/BrowserBox" || { printf "${RED}Failed to remove $BBX_HOME/BrowserBox${NC}\n" >> "$LOG_FILE"; return 1; }
        mv "$BBX_NEW_DIR/BrowserBox" "$BBX_HOME/BrowserBox" || { printf "${RED}Failed to move $BBX_NEW_DIR to $BBX_HOME/BrowserBox${NC}\n" >> $"$LOG_FILE"; return 1; }
        # Run copy_install.sh
        cd "$BBX_HOME/BrowserBox" && ./deploy-scripts/copy_install.sh >> "$LOG_FILE" 2>&1 || { printf "${RED}Failed to run copy_install.sh${NC}\n" >> "$LOG_FILE"; return 1; }
        # Clean up lock files
        $SUDO rm -f "$PREPARED_FILE" || printf "${YELLOW}Warning: Failed to remove $PREPARED_FILE${NC}\n" >> "$LOG_FILE"
        printf "${GREEN}Update to $repo_tag complete.${NC}\n" >> "$LOG_FILE"
        printf "${GREEN}Update to $repo_tag complete.${NC}\n" 
        return 0
      else
        printf "${YELLOW}Prepared version ($new_tag) does not match latest ($repo_tag). Cleaning up and retrying...${NC}\n" >> "$LOG_FILE"
        $SUDO rm -rf "$BBX_NEW_DIR" "$PREPARED_FILE" "$PREPARING_FILE" || printf "${YELLOW}Warning: Failed to clean up $BBX_NEW_DIR or $PREPARED_FILE${NC}\n" >> "$LOG_FILE"
      fi
    fi
  fi
  return 1
}

# Modified update function
update() {
  if [[ -n "$BBX_NO_UPDATE" ]]; then
    return 0
  fi

  load_config
  mkdir -p "$BB_CONFIG_DIR"
  chmod 700 "$BB_CONFIG_DIR"
  printf "${YELLOW}Updating BrowserBox to latest...${NC}\n"

  # Check if BBX_HOME, BBX_HOME/BrowserBox, or BBX_SHARE/BrowserBox exists
  if [ ! -d "$BBX_HOME" ] || [ ! -d "$BBX_HOME/BrowserBox" ] || [ ! -d "$BBX_SHARE/BrowserBox" ]; then
    printf "${YELLOW}No BrowserBox installation found. Running interactive install...${NC}\n"
    install
    return $?
  fi
  
  update_background
  local repo_tag=$(get_latest_repo_version)
  [ -n "$BBX_NO_UPDATE" ] || check_prepare_and_install "$repo_tag"
}

# Background update function
update_background() {
  if [[ -n "$BBX_NO_UPDATE" ]]; then
    return 0
  fi

  load_config
  local repo_tag="$(get_latest_repo_version)"
  local tagdoo="${repo_tag#v}"

  printf "${YELLOW}Checking update lock...${NC}\n" >> "$LOG_FILE"
  # Check lock files
  if is_lock_file_recent "$PREPARING_FILE"; then
    printf "${YELLOW}Another update is being prepared. Skipping...${NC}\n"
    return 0
  fi

  if check_prepare_and_install "$repo_tag"; then
    return 0
  fi

  printf "${YELLOW}Requesting update lock...${NC}\n" >> "$LOG_FILE"
  # Create preparing lock file
  $SUDO mkdir -p "$BBX_SHARE" || { printf "${RED}Failed to create install directory $BBX_SHARE ... ${NC}\n" >> "$LOG_FILE";  $SUDO rm -f "$PREPARING_FILE" ; exit 1; }
  printf "%s\n%s\n" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$BBX_NEW_DIR" | $SUDO tee "$PREPARING_FILE" >/dev/null || { printf "${RED}Failed to create $PREPARING_FILE${NC}\n" >> "$LOG_FILE";  $SUDO rm -f "$PREPARING_FILE" ; exit 1; }
  printf "${YELLOW}Starting background update to $repo_tag...${NC}\n" >> "$LOG_FILE"
  # Clean up any existing BBX_NEW_DIR
  $SUDO rm -rf "$BBX_NEW_DIR" || { printf "${RED}Failed to clean $BBX_NEW_DIR${NC}\n" >> "$LOG_FILE";  $SUDO rm -f "$PREPARING_FILE" ; exit 1; }
  mkdir -p "$BBX_NEW_DIR" || { printf "${RED}Failed to create $BBX_NEW_DIR/BrowserBox${NC}\n" >> "$LOG_FILE";  $SUDO rm -f "$PREPARING_FILE" ; exit 1; }
  DLURL="${REPO_URL}/archive/refs/tags/${repo_tag}.zip";
  echo "Getting: $DLURL" >> "$LOG_FILE"
  curl -sSL --connect-timeout 8 "$DLURL" -o "$BBX_NEW_DIR/BrowserBox.zip" || {
    printf "${YELLOW}Skipping update due to timeout or failure in connecting to BrowserBox repo${NC}\n" >> "$LOG_FILE"
    $SUDO rm -f "$PREPARING_FILE"
    $SUDO rm -f "$BBX_NEW_DIR/BrowserBox.zip" 2>/dev/null
    $SUDO rm -rf "$BBX_NEW_DIR" 2>/dev/null
    return 1
  }
  printf "${YELLOW}Unzipping archive for $repo_tag...${NC}\n" >> "$LOG_FILE"
  unzip -q -o "$BBX_NEW_DIR/BrowserBox.zip" -d "$BBX_NEW_DIR/BrowserBox-zip" || { printf "${RED}Failed to extract BrowserBox repo${NC}\n" >> "$LOG_FILE";  $SUDO rm -f "$PREPARING_FILE" ; exit 1; }
  printf "${YELLOW}Moving folder into place...${NC}\n" >> "$LOG_FILE"
  mv "$BBX_NEW_DIR/BrowserBox-zip/BrowserBox-$tagdoo" "$BBX_NEW_DIR/BrowserBox" || { printf "${RED}Failed to move extracted files${NC}\n" >> "$LOG_FILE";  $SUDO rm -f "$PREPARING_FILE" ; exit 1; }
  $SUDO rm -rf "$BBX_NEW_DIR/BrowserBox-zip" "$BBX_NEW_DIR/BrowserBox.zip"
  chmod +x "$BBX_NEW_DIR/BrowserBox/deploy-scripts/global_install.sh" || { printf "${RED}Failed to make global_install.sh executable${NC}\n" >> "$LOG_FILE";  $SUDO rm -f "$PREPARING_FILE" ; exit 1; }
  printf "${YELLOW}Preparing update...${NC}\n" >> "$LOG_FILE"
  cd "$BBX_NEW_DIR/BrowserBox"
  export BBX_NO_COPY=1
  yes yes | ./deploy-scripts/global_install.sh "$BBX_HOSTNAME" "$EMAIL" >> "$LOG_FILE" 2>&1 || { printf "${RED}Failed to run global_install.sh${NC}\n" >> "$LOG_FILE";  $SUDO rm -f "$PREPARING_FILE" ; exit 1; }
    # Mark as prepared
  printf "${YELLOW}Marking update as prepared...${NC}\n" >> "$LOG_FILE"
  printf "%s\n%s\n" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$BBX_NEW_DIR" | $SUDO tee "$PREPARED_FILE" >/dev/null || { printf "${RED}Failed to create $PREPARED_FILE${NC}\n" >> "$LOG_FILE";  $SUDO rm -f "$PREPARING_FILE" ; exit 1; }
  # Remove preparing lock file
  printf "${YELLOW}Completing preparation step (removing update lock)...${NC}\n" >> "$LOG_FILE"
  $SUDO rm -f "$PREPARING_FILE" || printf "${YELLOW}Warning: Failed to remove $PREPARING_FILE${NC}\n" >> "$LOG_FILE"
  printf "${GREEN}Background update prepared in $BBX_NEW_DIR${NC}\n" >> "$LOG_FILE"
}

license() {
    printf "${BLUE}BrowserBox License Information:${NC}\n"
    draw_box "Terms: https://dosaygo.com/terms.txt"
    draw_box "License: $REPO_URL/blob/${branch}/LICENSE.md"
    draw_box "Privacy: https://dosaygo.com/privacy.txt"
    draw_box "Get a License: https://dosaygo.com/license"
    printf "Run 'bbx certify' to enter your product key.\n"
}

status() {
    load_config
    printf "${YELLOW}Checking BrowserBox status...${NC}\n"
    if [ -n "$PORT" ] && curl -s --max-time 2 "https://$BBX_HOSTNAME:$PORT" >/dev/null 2>&1; then
        draw_box "Status: Running (port $PORT)"
    elif pgrep -u "$(whoami)" browserbox; then
        draw_box "Status: Running (current user)"
    else
        draw_box "Status: Not Running"
    fi
}

# stop-user subcommand
stop_user() {
    load_config
    local user="$1"
    local delay_seconds="${2:-0}"
    if [ -z "$user" ]; then
        printf "${RED}Usage: bbx stop-user <username> [delay_seconds]${NC}\n"
        exit 1
    fi
    if ! id "$user" >/dev/null 2>&1; then
        printf "${RED}User $user does not exist.${NC}\n"
        exit 1
    fi

    # Ensure 'at' is installed
    if ! command -v at >/dev/null 2>&1; then
        printf "${YELLOW}Installing 'at' command...${NC}\n"
        if [ -f /etc/debian_version ]; then
            $SUDO apt-get update && $SUDO apt-get install -y at
        elif [ -f /etc/redhat-release ]; then
            $SUDO yum install -y at || $SUDO dnf install -y at
        else
            printf "${RED}Unsupported OS. Please install 'at' manually.${NC}\n"
            exit 1
        fi
        $SUDO systemctl start atd.service 2>/dev/null || true
    fi

    printf "${YELLOW}Stopping BrowserBox for $user in $delay_seconds seconds...${NC}\n"
    local is_temp_user=false
    if [[ "$user" =~ ^bbusert ]]; then
        is_temp_user=true
        printf "${YELLOW}Detected temporary user $user - will remove home directory and user after stopping.${NC}\n"
    fi

    local current_time=$(date +%s)
    local should_schedule=true
    local home_dir=$(get_home_dir "$user")
    local expiry_file="$home_dir/.config/dosyago/bbpro/expiry_time"

    # Check for existing expiry time
    if $SUDO test -f "$expiry_file"; then
        local existing_expiry_time=$($SUDO cat "$expiry_file")
        if [[ $existing_expiry_time -lt $current_time ]]; then
            should_schedule=false
            printf "${YELLOW}Existing expiry time ($existing_expiry_time) is in the past. Stopping immediately.${NC}\n"
        fi
    fi

    if $should_schedule && [ "$delay_seconds" -gt 0 ]; then
        local delay_minutes=$((delay_seconds / 60))
        # Cancel existing 'at' jobs for this user
        existing_jobs=$(atq | awk '{print $1}')
        for job in $existing_jobs; do
            if at -c "$job" | grep -q "stop_bbpro.*$user"; then
                atrm "$job"
            fi
        done
        # Schedule stop_bbpro
        echo "$SUDO -u \"$user\" stop_bbpro" | at now + "${delay_minutes}" minutes 2>/dev/null
        # Update expiry time
        local new_expiry_timestamp=$((current_time + delay_seconds))
        $SUDO -u "$user" bash -c "mkdir -p \"${home_dir}/.config/dosyago/bbpro\"; echo \"$new_expiry_timestamp\" > \"$expiry_file\""
        printf "${GREEN}Scheduled stop for $user at $new_expiry_timestamp${NC}\n"
    else
        # Immediate stop
        $SUDO -u "$user" bash -c "PATH=/usr/local/bin:\$PATH stop_bbpro" 2>/dev/null || { printf "${RED}Failed to stop BrowserBox for $user${NC}\n"; exit 1; }
        printf "${GREEN}BrowserBox stopped for $user${NC}\n"
    fi

    # If temporary user, nuke it after stopping
    if $is_temp_user; then
        printf "${YELLOW}Removing temporary user $user and home directory...${NC}\n"
        $SUDO pkill -u "$user" 2>/dev/null # Kill any remaining processes
        $SUDO userdel -r "$user" 2>/dev/null || { printf "${RED}Failed to delete $user${NC}\n"; exit 1; }
        printf "${GREEN}Temporary user $user removed${NC}\n"
    fi
}

# Helper: Get user's home directory
get_home_dir() {
    local user="$1"
    if [ "$(uname -s)" = "Darwin" ]; then
        echo "/Users/$user"
    else
        echo "/home/$user"
    fi
}

create_user() {
    local user="$1"
    if [ "$(uname -s)" = "Darwin" ]; then
        $SUDO sysadminctl -deleteUser "$user" -secure 2>/dev/null
        local pw=$(openssl rand -base64 12)
        $SUDO sysadminctl -addUser "$user" -fullName "BrowserBox user $user" -password "$pw" -home "/Users/$user" -shell /bin/bash
        $SUDO dseditgroup -o edit -a "$user" -t user staff
        $SUDO createhomedir -c -u "$user" >/dev/null
        $SUDO -u "$user" bash -c 'echo "export PATH=\$PATH:/usr/local/bin" >> ~/.bash_profile'
        $SUDO -u "$user" bash -c 'echo "export PATH=\$PATH:/usr/local/bin" >> ~/.bashrc'
        $SUDO -u "$user" security create-keychain -p "$pw" "${user}.keychain"
        $SUDO -u "$user" security default-keychain -s "${user}.keychain"
        $SUDO -u "$user" security login-keychain -s "${user}.keychain"
        $SUDO -u "$user" security set-keychain-settings "${user}.keychain"
        $SUDO -u "$user" security unlock-keychain -p "$pw" "${user}.keychain"
    else
        $SUDO groupdel -f "$user" 2>/dev/null
        if [ -f /etc/redhat-release ]; then
            $SUDO useradd -m -s /bin/bash -c "BrowserBox user" "$user"
        else
            $SUDO adduser --disabled-password --gecos "BrowserBox user" "$user" >/dev/null 2>&1
        fi
        # Add BrowserBox-specific groups (no sudoers)
        for group in browsers renice; do
            if ! getent group "$group" >/dev/null; then
                $SUDO groupadd "$group" 2>/dev/null
            fi
            $SUDO usermod -aG "$group" "$user" 2>/dev/null
        done
        # Enable lingering for systemd (Linux only)
        if command -v loginctl >/dev/null 2>&1; then
            $SUDO loginctl enable-linger "$user" 2>/dev/null
        fi
    fi
    id "$user" >/dev/null 2>&1 || { printf "${RED}Failed to create user $user${NC}\n"; exit 1; }
    printf "${GREEN}Created user: $user${NC}\n"
}

# run-as subcommand
run_as() {
    # Initial checks for the calling user
    if [ "$(id -u)" -eq 0 ]; then
        printf "${RED}ERROR: Cannot run 'bbx run-as' as root. Use a non-root user with passwordless sudo.${NC}\n"
        exit 1
    fi
    if ! command -v node >/dev/null 2>&1 || ! [ -d "$HOME/.nvm" ]; then
        printf "${RED}ERROR: Calling user must have Node.js and nvm installed. Install via 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash' and then 'nvm install v22'.${NC}\n"
        exit 1
    fi
    if ! sudo -n true 2>/dev/null; then
        printf "${RED}ERROR: Calling user must have passwordless sudo. Edit /etc/sudoers with visudo.${NC}\n"
        exit 1
    fi
    if [ -f /etc/debian_version ]; then
        os_type="debian"
    elif [ -f /etc/redhat-release ]; then
        os_type="redhat"
    elif [ "$(uname -s)" = "Darwin" ]; then
        os_type="darwin"
        printf "\n${RED}${BOLD}run-as is not currently supported on Darwin/macOS at the moment.${NC}\n"
        printf "  Instead you can manually switch to the user you want to run BrowserBox, and use ${GREEN}bbx${NC} from that account.\n\n"
        exit 1
    fi

    load_config
    ensure_deps
    local user=""
    local port="${PORT:-$(find_free_port_block)}"
    local hostname="${BBX_HOSTNAME:-$(get_system_hostname)}"
    local temporary=false

    # Parse arguments with named flags
    while [ $# -gt 0 ]; do
        case "$1" in
            --temporary)
                temporary=true
                shift
                ;;
            --port|-p)
                port="$2"
                shift 2
                ;;
            *)
                if [ -z "$user" ]; then
                    user="$1"  # First non-flag argument is the username
                else
                    printf "${RED}Unknown or extra argument: $1${NC}\n"
                    printf "Usage: bbx run-as [--temporary] [--port|-p <port>] <username>${NC}\n"
                    exit 1
                fi
                shift
                ;;
        esac
    done

    # Generate username if none provided or handle --temporary
    local epoch=$(date +%s)
    local rand=$(openssl rand -hex 4)
    if [ -z "$user" ]; then
        if $temporary; then
            user="bbusert${epoch}-${rand}"
        else
            user="bbuser${epoch}-${rand}"
        fi
        printf "${YELLOW}No username provided. Generated: $user${NC}\n"
        create_user "$user"
    else
        if $temporary; then
            printf "${YELLOW}Ignoring provided username '$user' due to --temporary. Generating temporary user.${NC}\n"
            user="bbusert${epoch}-${rand}"
            create_user "$user"
        else
            if id "$user" >/dev/null 2>&1; then
                printf "${GREEN}Using existing user: $user${NC}\n"
            else
                printf "${YELLOW}Creating specified user: $user${NC}\n"
                create_user "$user"
            fi
        fi
    fi

    PORT="$port"
    BBX_HOSTNAME="$hostname"
    local HOME_DIR=$(get_home_dir "$user")

    # Ensure config directory exists with proper ownership
    $SUDO -u "$user" mkdir -p "$HOME_DIR/.config/dosyago/bbpro" || { printf "${RED}Failed to create config dir for $user${NC}\n"; exit 1; }

    # Rsync .nvm from calling user to target user
    printf "${YELLOW}Copying nvm and Node.js from $HOME/.nvm to $HOME_DIR/.nvm...${NC}\n"
    $SUDO rsync -aq --exclude='.git' "$HOME/.nvm/" "$HOME_DIR/.nvm/" || { printf "${RED}Failed to rsync .nvm directory${NC}\n"; exit 1; }
    GROUP="$(id -gn "$user")"
    $SUDO chown -R "$user":"$GROUP" "$HOME_DIR/.nvm" || { printf "${RED}Failed to chown .nvm directory${NC}\n"; exit 1; }
    NODE_VERSION="v22"
    $SUDO -i -u "$user" bash -c "source ~/.nvm/nvm.sh; nvm use $NODE_VERSION; nvm alias default $NODE_VERSION;" || { printf "${RED}Failed to set up nvm for $user${NC}\n"; exit 1; }

    # Test port accessibility
    pkill ncat
    for i in {-2..2}; do
        test_port_access $((port+i)) || { printf "${RED}Adjust firewall for $user to allow ports $((port-2))-$((port+2))/tcp${NC}\n"; exit 1; }
    done
    test_port_access $((port-3000)) || { printf "${RED}CDP endpoint port $((port-3000)) is blocked for $user${NC}\n"; exit 1; }

    # Generate fresh token
    TOKEN=$(openssl rand -hex 16)

    # Run setup_bbpro with explicit PATH and fresh token, redirecting output as the target user
    $SUDO -u "$user" bash -c "PATH=/usr/local/bin:\$PATH LICENSE_KEY="${LICENSE_KEY}" setup_bbpro --port $port --token $TOKEN > ~/.config/dosyago/bbpro/setup_output.txt 2>&1" || { printf "${RED}Setup failed for $user${NC}\n"; $SUDO cat "$HOME_DIR/.config/dosyago/bbpro/setup_output.txt"; exit 1; }

    # Use caller's LICENSE_KEY
    if [ -z "$LICENSE_KEY" ]; then
        printf "${RED}No product key set in LICENSE_KEY env var. Run 'bbx activate' or go to dosaygo.com to get a valid product key.${NC}\n"
        #exit 1
    fi
    $SUDO -u "$user" bash -c "PATH=/usr/local/bin:\$PATH; export LICENSE_KEY='$LICENSE_KEY'; bbcertify; bbpro" || { printf "${RED}Failed to run BrowserBox as $user${NC}\n"; exit 1; }
    sleep 2

    # Retrieve token
    if $SUDO test -f "$HOME_DIR/.config/dosyago/bbpro/test.env"; then
        TOKEN=$($SUDO -u "$user" bash -c "source ~/.config/dosyago/bbpro/test.env && echo \$LOGIN_TOKEN") || { printf "${RED}Failed to source test.env for $user${NC}\n"; exit 1; }
    fi
    if [ -z "$TOKEN" ] && $SUDO test -f "$HOME_DIR/.config/dosyago/bbpro/login.link"; then
        TOKEN=$($SUDO cat "$HOME_DIR/.config/dosyago/bbpro/login.link" | grep -oE 'token=[^&]+' | sed 's/token=//')
    fi
    [ -n "$TOKEN" ] || { printf "${RED}Failed to retrieve login token for $user${NC}\n"; exit 1; }

    draw_box "Login Link: https://$hostname:$port/login?token=$TOKEN"
    draw_box "Username: $user"
    save_config
}

version() {
    printf "${GREEN}bbx version $BBX_VERSION${NC}\n"
}

usage() {
    banner
    printf "${BOLD}Usage:${NC} bbx <command> [options]\n"
    printf "${BOLD}Commands:${NC}\n"
    printf "  ${GREEN}install${NC}        Install BrowserBox and bbx CLI\n"
    printf "  ${GREEN}uninstall${NC}      Remove BrowserBox, config, and all related files\n"
    printf "  ${CYAN}activate${NC}       Activate your copy of BrowserBox by purchasing a product key for 1 or more people\n"
    printf "                   \t\t\t\t\t${BOLD}${CYAN}bbx activate [number of people]${NC}\n"
    printf "  ${GREEN}setup${NC}          Set up BrowserBox \t\t\t${BOLD}bbx setup [--port|-p <p>] [--hostname|-h <h>] [--token|-t <t>]${NC}\n"
    printf "  ${GREEN}certify${NC}        Certify your license\n"
    printf "  ${GREEN}run${NC}            Run BrowserBox \t\t\t${BOLD}bbx run [--port|-p <port>] [--hostname|-h <hostname>]${NC}\n"
    printf "  ${GREEN}stop${NC}           Stop BrowserBox (current user)\n"
    printf "  ${GREEN}run-as${NC}         Run as a specific user \t\t${BOLD}bbx run-as [--temporary] [username] [port]${NC}\n"
    printf "  ${GREEN}stop-user${NC}      Stop BrowserBox for a specific user \t${BOLD}bbx stop-user <username> [delay_seconds]${NC}\n"
    printf "  ${GREEN}logs${NC}           Show BrowserBox logs\n"
    printf "  ${GREEN}update${NC}         Force and explicit update to latest BrowserBox\n"
    printf "  ${GREEN}status${NC}         Check BrowserBox status\n"
    printf "  ${PURPLE}tor-run${NC}        Run BrowserBox with Tor \t\t${BOLD}bbx tor-run [--no-anonymize] [--no-onion]${NC}\n"
    printf "  ${GREEN}docker-run${NC}     Run BrowserBox using Docker \t\t${BOLD}bbx docker-run [nickname] [--port|-p <port>]${NC}\n"
    printf "  ${GREEN}docker-stop${NC}    Stop a Dockerized BrowserBox \t\t${BOLD}bbx docker-stop <nickname>${NC}\n"
    printf "  ${BLUE}${BOLD}console*${NC}       See and interact with the BrowserBox command stream\n"
    printf "  ${BLUE}${BOLD}automate*${NC}      Run pptr or playwright scripts in a running BrowserBox\n"
    printf "  ${GREEN}--version${NC}      Show bbx version\n"
    printf "  ${GREEN}--help${NC}         Show this help\n"
    printf "\n${BLUE}${BOLD}*Coming Soon${NC}\n"
}

check_agreement() {
  if [[ -n "$BBX_TEST_AGREEMENT" ]]; then 
    if [ ! -f "$BB_CONFIG_DIR/.agreed" ]; then
      echo "$(date)" > "$BB_CONFIG_DIR/.agreed"
    fi
    return 0
  fi
  if [ ! -f "$BB_CONFIG_DIR/.agreed" ]; then
      printf "${BLUE}BrowserBox v11 Terms:${NC} https://dosaygo.com/terms.txt\n"
      printf "${BLUE}License:${NC} $REPO_URL/blob/${branch}/LICENSE.md\n"
      printf "${BLUE}Privacy:${NC} https://dosaygo.com/privacy.txt\n"
      read -r -p " Agree? (yes/no): " AGREE
      [ "$AGREE" = "yes" ] || { printf "${RED}ERROR: Must agree to terms!${NC}\n"; exit 1; }
      mkdir -p "$BB_CONFIG_DIR"
      touch "$BB_CONFIG_DIR/.agreed"
      echo "$(date)" > "$BB_CONFIG_DIR/.agreed"
  fi
}

activate() {
  local seats="${1:-1}"
  local session_id=$(openssl rand -hex 16)
  local metadata=$(printf '{"session_id":"%s"}' "$session_id")
  local client_ref_id=$(echo -n "$metadata" | base64 | tr '+/' '-_' | tr -d '=')
  local buy_url="https://browse.cloudtabs.net/l?cri=$client_ref_id&quantity=$seats"

  banner
  printf "${YELLOW}Launching Stripe Pricing Table to buy a license for $seats seat(s)...${NC}\n"
  printf "Visit this URL if the browser doesn't open:\n"
  draw_box "$buy_url"

  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$buy_url" 2>/dev/null
  elif command -v open >/dev/null 2>&1; then
    open "$buy_url" 2>/dev/null
  else
    printf "${RED}Couldn’t open browser. Please visit the URL above manually.${NC}\n"
  fi

  printf "${YELLOW}Waiting for payment and provisioning (this may take a few minutes)...${NC}\n"

  local attempts=0
  local max_attempts=240
  local poll_interval=10  # 5 seconds
  local spinner_interval=1  # 0.5 seconds
  local spinner_chars=$(printf "|/-\|")
  local spinner_idx=0
  local counter=0
  local state="unvisited"
  local license_key=""
  local seats_provisioned=0
  local total_seats=0

  trap 'printf "\nInterrupted\n"; exit 1' INT TERM

  while [ $attempts -lt $max_attempts ]; do
    if [ $((counter % spinner_interval)) -eq 0 ]; then
      spinner_idx=$(( (spinner_idx + 1) % 4 ))
      local spinner="${spinner_chars:$spinner_idx:1}"
    fi

    if [ $((counter % poll_interval)) -eq 0 ]; then
      local response=$(curl --connect-timeout 7 -s "https://browse.cloudtabs.net/api/license-status?session_id=$session_id")
      state=$(echo "$response" | jq -r '.state // "unvisited"')
      license_key=$(echo "$response" | jq -r '.license_key // ""')
      seats_provisioned=$(echo "$response" | jq -r '.seats_provisioned // 0')
      total_seats=$(echo "$response" | jq -r '.total_seats // 0')
      attempts=$((attempts + 1))
    fi

    case "$state" in
      "unvisited")
        printf "\r${BLUE}Status: Waiting for you to visit the payment page [${attempts}/${max_attempts}]${NC} %s                " "$spinner"
        ;;
      "visited_unpaid")
        printf "\r${BLUE}Status: Awaiting payment confirmation [${attempts}/${max_attempts}]${NC} %s                " "$spinner"
        ;;
      "paid_unprovisioned")
        printf "\r${BLUE}Status: Payment received, provisioning $total_seats seats [${attempts}/${max_attempts}]${NC} %s                " "$spinner"
        ;;
      "provisioned_complete")
        printf "\n"
        LICENSE_KEY="$license_key"
        SEATS="$total_seats"
        save_config
        printf "${GREEN}Success! License key: $LICENSE_KEY, $SEATS seats fully provisioned.${NC}\n"
        draw_box "BrowserBox is ready to use with $SEATS seats!"
        trap - INT TERM
        return 0
        ;;
      *)
        printf "\n${RED}Error: Unknown state (${state})${NC}\n"
        trap - INT TERM
        return 1
        ;;
    esac

    sleep 0.5
    counter=$((counter + 1))
  done

  printf "\n${RED}Timeout: Provisioning took too long. Check your email for updates.${NC}\n"
  trap - INT TERM
  return 1
}

[ "$1" != "uninstall" ] && check_agreement
# Call check_and_prepare_update with the first argument
[ -n "$BBX_NO_UPDATE" ] || check_and_prepare_update "$1"
case "$1" in
    install) shift 1; install "$@";;
    uninstall) shift 1; uninstall "$@";;
    setup) shift 1; setup "$@";;
    certify) shift 1; certify "$@";;
    run) shift 1; run "$@";;
    stop) shift 1; stop "$@";;
    stop-user) shift 1; stop_user "$@";;
    logs) shift 1; logs "$@";;
    update) shift 1; update "$@";;
    update-background) shift 1; update_background "$@";;
    activate) shift 1; activate "$@";;
    status) shift 1; status "$@";;
    run-as) shift 1; run_as "$@";;
    tor-run) shift 1; banner_color=$PURPLE; tor_run "$@";;
    docker-run) shift 1; docker_run "$@";;
    docker-stop) shift 1; docker_stop "$@";;
    --version|-v) shift 1; version "$@";;
    --help|-h) shift 1; usage "$@";;
    "") usage;;
    *) printf "${RED}Unknown command: $1${NC}\n"; usage; exit 1;;
esac
