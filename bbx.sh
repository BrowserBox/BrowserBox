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

if [[ -n "$BBX_DEBUG" ]]; then
  set -x
fi

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
PURPLE='\033[95m'  # Bright magenta, defined as purple
BLUE='\033[0;34m'
PINK='\033[95m'    # Bright magenta, closest to pink in ANSI
NC='\033[0m'
BOLD='\033[1m'

# Version
BBX_VERSION="10.0.2"
branch="main" # change to main for dist
banner_color=$BLUE

# Check if in screen or if UTF-8 is not supported
if [ -n "$STY" ] || ! tput u8 >/dev/null 2>&1; then
  # Use ASCII characters for borders
  top_left="+"
  top_right="+"
  bottom_left="+"
  bottom_right="+"
  horizontal="-"
  vertical="|"
else
  # Use printf to set UTF-8 byte sequences for Unicode borders
  top_left=$(printf "\xe2\x94\x8c")    # Upper-left corner
  top_right=$(printf "\xe2\x94\x90")   # Upper-right corner
  bottom_left=$(printf "\xe2\x94\x94") # Lower-left corner
  bottom_right=$(printf "\xe2\x94\x98") # Lower-right corner
  horizontal=$(printf "\xe2\x94\x80")  # Horizontal line
  vertical=$(printf "\xe2\x94\x82")    # Vertical line
fi


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

# Pre-install function to ensure proper setup
pre_install() {
    # Check if we're running as root
    if [ "$(id -u)" -eq 0 ]; then
        echo "Warning: Do not install as root."

        # Prompt for a non-root user to run the install as
        read -p "Enter a non-root username to run the installation: " install_user

        # Check if the user exists
        if id "$install_user" &>/dev/null; then
            echo "User $install_user found."
        else
            echo "User $install_user does not exist. Please create the user first."
            exit 1
        fi

        # Check if sudo is installed
        if ! command -v sudo &>/dev/null; then
            echo "Sudo not found, installing sudo..."
            if [ -f /etc/debian_version ]; then
                # For Debian/Ubuntu
                apt update && apt install -y sudo
            elif [ -f /etc/redhat-release ]; then
                # For RHEL/CentOS
                yum install -y sudo
            else
                echo "Unsupported distribution."
                exit 1
            fi
        fi

        groupadd sudoers

        # Ensure passwordless sudo is configured for the 'sudoers' group
        if ! grep -q "%sudoers" /etc/sudoers; then
            echo "%sudoers ALL=(ALL:ALL) NOPASSWD:ALL" >> /etc/sudoers
        fi

        # Add the install user to the 'sudoers' group
        usermod -aG sudoers "$install_user"

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

        # Download the install script using curl and save it to a file
        echo "Downloading the installation script..."
        curl -sSL "https://raw.githubusercontent.com/BrowserBox/BrowserBox/refs/heads/$branch/bbx.sh" -o /tmp/bbx.sh
        chmod +x /tmp/bbx.sh
        chown "${install_user}:${install_user}" /tmp/bbx.sh

        # Now switch to the non-root user
        echo "Switching to user $install_user..."
        su - "$install_user" -c "
            # Make the script executable and run it as the non-root user
            /tmp/bbx.sh install
        "

        # Exit to end the script
        exit 0
    else
        # If not running as root, continue with the normal install
        echo "Running as non-root user, proceeding with installation..."
    fi
}

# Box drawing helper function
draw_box() {
    local text="$1"
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

# Config file
CONFIG_DIR="$HOME/.config/dosyago/bbpro"
CONFIG_FILE="$CONFIG_DIR/config"
[ ! -d "$CONFIG_DIR" ] && mkdir -p "$CONFIG_DIR"
load_config() {
    [ -f "$CONFIG_FILE" ] && source "$CONFIG_FILE"
}

save_config() {
    mkdir -p "$CONFIG_DIR"
    cat > "$CONFIG_FILE" <<EOF
EMAIL="$EMAIL"
LICENSE_KEY="$LICENSE_KEY"
BBX_HOSTNAME="$BBX_HOSTNAME"
TOKEN="$TOKEN"
PORT="$PORT"
EOF
    chmod 600 "$CONFIG_FILE"
    printf "${YELLOW}Note: License key stored in plaintext at $CONFIG_FILE. Ensure file permissions are restricted (e.g., chmod 600).${NC}\n"
}

# Get system hostname
get_system_hostname() {
    # Use $HOSTNAME if set, otherwise fallback to `hostname`
    echo "${HOSTNAME:-$(hostname)}"
}

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

# Get license key (env var or config, prompt if missing)
get_license_key() {
    if [ -n "$LICENSE_KEY" ]; then
        LICENSE_KEY="$LICENSE_KEY"
    elif [ -z "$LICENSE_KEY" ]; then
        read -r -p "Enter License Key (get one at sales@dosaygo.com): " LICENSE_KEY
        [ -n "$LICENSE_KEY" ] || { printf "${RED}ERROR: License key required!${NC}\n"; exit 1; }
    fi
}

# Sudo check
SUDO=$(command -v sudo >/dev/null && echo "sudo -n" || echo "")
if [ "$EUID" -ne 0 ] && ! $SUDO true 2>/dev/null; then
    printf "${RED}ERROR: Requires root or passwordless sudo. Edit /etc/sudoers with visudo if needed.${NC}\n"
    exit 1
fi

# Default paths
BBX_HOME="${HOME}/.bbx"
BBX_BIN="/usr/local/bin/bbx"
REPO_URL="https://github.com/BrowserBox/BrowserBox"
BBX_SHARE="/usr/local/share/dosyago"

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
    local deps=("curl" "rsync" "debian:netcat-openbsd,redhat:nmap-ncat,darwin:netcat/nc" "at" "unzip" "debian:dnsutils,redhat:bind-utils,darwin:bind/dig" "git" "openssl")
    for dep in "${deps[@]}"; do
        # Parse the dependency
        IFS=':' read -r pkg_name tool_name <<< "$(parse_dep "$dep")"

        # Check if the tool exists
        if ! command -v "$tool_name" >/dev/null 2>&1; then
            printf "${YELLOW}Installing $pkg_name (for $tool_name)...${NC}\n"

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
        fi
    done
}

# Find a free block of 5 ports + CDP endpoint
find_free_port_block() {
    local start_port=4024
    local end_port=65533
    for ((port=start_port+2; port<=end_port-2; port++)); do
        local free=true
        for ((i=-2; i<=2; i++)); do
            if ! bash -c "exec 6<>/dev/tcp/127.0.0.1/$((port+i))" 2>/dev/null; then
                : # Port is free
            else
                free=false
                break
            fi
        done
        if $free && ! bash -c "exec 6<>/dev/tcp/127.0.0.1/$((port-3000))" 2>/dev/null; then
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
    (echo -e "HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nOK" | nc -l "$port" >/dev/null 2>&1) &
    local pid=$!
    sleep 1
    if curl -s --max-time 2 "http://localhost:$port" | grep -q "OK"; then
        printf "${GREEN}Port $port is accessible.${NC}\n"
        kill $pid 2>/dev/null
        return 0
    else
        printf "${RED}Port $port is blocked by firewall. Open with ufw/firewall-cmd.${NC}\n"
        kill $pid 2>/dev/null
        return 1
    fi
}

# Subcommands
install() {
    banner
    pre_install
    load_config
    ensure_deps
    printf "${GREEN}Installing BrowserBox CLI (bbx)...${NC}\n"
    mkdir -p "$BBX_HOME/BrowserBox" || { printf "${RED}Failed to create $BBX_HOME/BrowserBox${NC}\n"; exit 1; }
    printf "${YELLOW}Fetching BrowserBox repository...${NC}\n"
    curl -sL "$REPO_URL/archive/refs/heads/${branch}.zip" -o "$BBX_HOME/BrowserBox.zip" || { printf "${RED}Failed to download BrowserBox repo${NC}\n"; exit 1; }
    rm -rf $BBX_HOME/BrowserBox/*
    unzip -q "$BBX_HOME/BrowserBox.zip" -d "$BBX_HOME/BrowserBox-zip" || { printf "${RED}Failed to extract BrowserBox repo${NC}\n"; exit 1; }
    mv "$BBX_HOME/BrowserBox-zip/BrowserBox-${branch}"/* "$BBX_HOME/BrowserBox/" && rm -rf "$BBX_HOME/BrowserBox-zip"
    rm "$BBX_HOME/BrowserBox.zip"
    chmod +x "$BBX_HOME/BrowserBox/deploy-scripts/global_install.sh" || { printf "${RED}Failed to make global_install.sh executable${NC}\n"; exit 1; }
    local default_hostname=$(get_system_hostname)
    [ -n "$BBX_HOSTNAME" ] || read -r -p "Enter hostname (default: $default_hostname): " BBX_HOSTNAME
    BBX_HOSTNAME="${BBX_HOSTNAME:-$default_hostname}"
    if is_local_hostname "$BBX_HOSTNAME"; then
        ensure_hosts_entry "$BBX_HOSTNAME"
    fi
    [ -n "$EMAIL" ] || read -r -p "Enter your email for Let's Encrypt (optional for $BBX_HOSTNAME): " EMAIL
    if [ -t 0 ]; then
        printf "${YELLOW}Running BrowserBox installer interactively...${NC}\n"
        cd "$BBX_HOME/BrowserBox" && ./deploy-scripts/global_install.sh "$BBX_HOSTNAME" "$EMAIL"
    else
        printf "${YELLOW}Running BrowserBox installer non-interactively (auto-accepting prompts)...${NC}\n"
        cd "$BBX_HOME/BrowserBox" && (yes | ./deploy-scripts/global_install.sh "$BBX_HOSTNAME" "$EMAIL")
    fi
    [ $? -eq 0 ] || { printf "${RED}Installation failed. Check $BBX_HOME/BrowserBox/deploy-scripts/global_install.sh output.${NC}\n"; exit 1; }
    $SUDO curl -sL "$REPO_URL/raw/${branch}/bbx.sh" -o "$BBX_BIN" || { printf "${RED}Failed to install bbx${NC}\n"; $SUDO rm -f "$BBX_BIN"; exit 1; }
    $SUDO chmod +x "$BBX_BIN"
    save_config
    printf "${GREEN}bbx v$BBX_VERSION installed successfully! Run 'bbx --help' for usage.${NC}\n"
}

uninstall() {
    printf "${YELLOW}Uninstalling BrowserBox...${NC}\n"
    printf "${BLUE}This will remove all BrowserBox files, including config and installation directories.${NC}\n"
    read -r -p "Are you sure you want to proceed? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        printf "${RED}Uninstall cancelled.${NC}\n"
        exit 0
    fi
    if [ -d "$CONFIG_DIR" ]; then
        printf "${YELLOW}Removing config directory: $CONFIG_DIR...${NC}\n"
        read -r -p "Confirm removal of $CONFIG_DIR? (yes/no): " CONFIRM_CONFIG
        if [ "$CONFIRM_CONFIG" = "yes" ]; then
            rm -rf "$CONFIG_DIR" && printf "${GREEN}Removed $CONFIG_DIR${NC}\n" || printf "${RED}Failed to remove $CONFIG_DIR${NC}\n"
        else
            printf "${YELLOW}Skipping $CONFIG_DIR removal${NC}\n"
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
            $SUDO rm -f "$BBX_BIN" && printf "${GREEN}Removed $BBX_BIN${NC}\n" || printf "${RED}Failed to remove $BBX_BIN${NC}\n"
        else
            printf "${YELLOW}Skipping $BBX_BIN removal${NC}\n"
        fi
    fi
    printf "${GREEN}Uninstall complete. Run 'bbx install' to reinstall if needed.${NC}\n"
}

certify() {
    load_config
    printf "${YELLOW}Certifying BrowserBox license...${NC}\n"
    get_license_key
    export LICENSE_KEY="$LICENSE_KEY"
    bbcertify || { printf "${RED}Certification failed. Check your license key.${NC}\n"; exit 1; }
    save_config
    printf "${GREEN}Certification complete.${NC}\n"
}

stop() {
    load_config
    printf "${YELLOW}Stopping BrowserBox (current user)...${NC}\n"
    stop_bbpro || { printf "${RED}Failed to stop. Check if BrowserBox is running.${NC}\n"; exit 1; }
    printf "${GREEN}BrowserBox stopped.${NC}\n"
}

logs() {
    printf "${YELLOW}Displaying BrowserBox logs...${NC}\n"
    if command -v pm2 >/dev/null; then
        pm2 logs || { printf "${RED}pm2 logs failed${NC}\n"; exit 1; }
    else
        printf "${RED}pm2 not found. Install pm2 (npm i -g pm2) or check logs manually.${NC}\n"
        exit 1
    fi
}

update() {
    load_config
    printf "${YELLOW}Updating BrowserBox...${NC}\n"
    (cd "$BBX_HOME/BrowserBox" && git pull && ./deploy-scripts/global_install.sh "${BBX_HOSTNAME:-localhost}" "$EMAIL") || { printf "${RED}Update failed. Check network or permissions.${NC}\n"; exit 1; }
    printf "${GREEN}Update complete.${NC}\n"
}

license() {
    printf "${BLUE}BrowserBox License Information:${NC}\n"
    draw_box "Terms: https://dosaygo.com/terms.txt"
    draw_box "License: $REPO_URL/blob/${branch}/LICENSE.md"
    draw_box "Privacy: https://dosaygo.com/privacy.txt"
    draw_box "Get a License: https://dosaygo.com/license"
    printf "Run 'bbx certify' to enter your license key.\n"
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

# setup subcommand
setup() {
    load_config
    ensure_deps
    local port="${1:-$(find_free_port_block)}"
    local default_hostname=$(get_system_hostname)
    local hostname="${2:-${BBX_HOSTNAME:-$default_hostname}}"
    PORT="$port"
    BBX_HOSTNAME="$hostname"
    printf "${YELLOW}Setting up BrowserBox on $hostname:$port...${NC}\n"
    if ! is_local_hostname "$hostname"; then
        printf "${BLUE}DNS Note:${NC} Ensure an A/AAAA record points from $hostname to this machine's IP.\n"
        curl -sL "$REPO_URL/raw/${branch}/deploy-scripts/wait_for_hostname.sh" -o "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh" || { printf "${RED}Failed to download wait_for_hostname.sh${NC}\n"; exit 1; }
        chmod +x "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh"
        "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh" "$hostname" || { printf "${RED}Hostname $hostname not resolving. Set up DNS and try again.${NC}\n"; exit 1; }
    else
        ensure_hosts_entry "$hostname"
    fi
    setup_bbpro --port "$port" > "$CONFIG_DIR/setup_output.txt" 2>/dev/null || { printf "${RED}Port range $((port-2))-$((port+2)) not free locally.${NC}\n"; exit 1; }
    for i in {-2..2}; do
        test_port_access $((port+i)) || { printf "${RED}Adjust firewall to allow ports $((port-2))-$((port+2))/tcp${NC}\n"; exit 1; }
    done
    test_port_access $((port-3000)) || { printf "${RED}CDP endpoint port $((port-3000)) is blocked. Adjust firewall.${NC}\n"; exit 1; }
    [ -n "$TOKEN" ] || TOKEN=$(openssl rand -hex 16)
    setup_bbpro --port "$port" --token "$TOKEN" > "$CONFIG_DIR/login.link" 2>/dev/null || { printf "${RED}Setup failed${NC}\n"; exit 1; }
    save_config
    printf "${GREEN}Setup complete.${NC}\n"
    draw_box "Login Link: https://$hostname:$port/login?token=$TOKEN"
}

# run subcommand
run() {
    banner
    load_config
    local port="${1:-$PORT}"
    local default_hostname=$(get_system_hostname)
    local hostname="${2:-${BBX_HOSTNAME:-$default_hostname}}"
    PORT="$port"
    BBX_HOSTNAME="$hostname"
    setup "$port" "$hostname"
    printf "${YELLOW}Starting BrowserBox on $hostname:$port...${NC}\n"
    if ! is_local_hostname "$hostname"; then
        printf "${BLUE}DNS Note:${NC} Ensure an A/AAAA record points from $hostname to this machine's IP.\n"
        curl -sL "$REPO_URL/raw/${branch}/deploy-scripts/wait_for_hostname.sh" -o "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh" || { printf "${RED}Failed to download wait_for_hostname.sh${NC}\n"; exit 1; }
        chmod +x "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh"
        "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh" "$hostname" || { printf "${RED}Hostname $hostname not resolving. Set up DNS and try again.${NC}\n"; exit 1; }
    else
        ensure_hosts_entry "$hostname"
    fi
    get_license_key
    export LICENSE_KEY="$LICENSE_KEY"
    bbcertify || { printf "${RED}Certification failed. Invalid or expired license key.${NC}\n"; exit 1; }
    bbpro || { printf "${RED}Failed to start. Ensure setup is complete and dependencies are installed.${NC}\n"; exit 1; }
    sleep 2
    # Source test.env for TOKEN if available, otherwise parse login.link
    if [ -f "$CONFIG_DIR/test.env" ]; then
        source "$CONFIG_DIR/test.env" || { printf "${RED}Failed to source $CONFIG_DIR/test.env${NC}\n"; exit 1; }
        PORT="${APP_PORT}"
        TOKEN="${LOGIN_TOKEN}"
    fi
    [ -n "$TOKEN" ] || TOKEN=$(cat "$CONFIG_DIR/login.link" | grep -oE 'token=[^&]+' | sed 's/token=//')
    draw_box "Login Link: https://$hostname:$port/login?token=$TOKEN"
    save_config
}

# stop-user subcommand
stop_user() {
    load_config
    local user="$1"
    local delay="${2:-0}"
    if [ -z "$user" ]; then
        printf "${RED}Usage: bbx stop-user <username> [delay_seconds]${NC}\n"
        exit 1
    fi
    if ! id "$user" >/dev/null 2>&1; then
        printf "${RED}User $user does not exist.${NC}\n"
        exit 1
    fi
    printf "${YELLOW}Scheduling stop for $user in $delay seconds...${NC}\n"
    # error we need to instalize stop_user from stop_browser here: note to do and request the stop_browser script
    "$BBX_HOME/BrowserBox/deploy-scripts/stop_browser.sh" "$user" "$delay" || { printf "${RED}Failed to stop $user's session.${NC}\n"; exit 1; }
    printf "${GREEN}Stop scheduled for $user.${NC}\n"
}

# run-as subcommand
run_as() {
    load_config
    ensure_deps
    local user="$1"
    local port="${2:-$(find_free_port_block)}"
    local hostname="${3:-${BBX_HOSTNAME:-localhost}}"
    if [ -z "$user" ]; then
        printf "${RED}Usage: bbx run-as <username> [port] [hostname]${NC}\n"
        exit 1
    fi
    if [ "$user" = "--random" ]; then
        user="bbuser_$(openssl rand -hex 4)"
        $SUDO adduser --disabled-password --gecos "BrowserBox user" "$user" || { printf "${RED}Failed to create user $user${NC}\n"; exit 1; }
        $SUDO usermod -aG renice,browsers "$user" 2>/dev/null
        printf "${GREEN}Created temporary user: $user${NC}\n"
    elif ! id "$user" >/dev/null 2>&1; then
        printf "${RED}User $user does not exist. Use --random or create the user first.${NC}\n"
        exit 1
    fi
    PORT="$port"
    BBX_HOSTNAME="$hostname"
    [ -n "$TOKEN" ] || TOKEN=$(openssl rand -hex 16)
    $SUDO -u "$user" mkdir -p "/home/$user/.config/dosyago/bbpro" || { printf "${RED}Failed to create config dir for $user${NC}\n"; exit 1; }
    $SUDO -u "$user" setup_bbpro --port "$port" --token "$TOKEN" > "/home/$user/.config/dosyago/bbpro/login.link" 2>/dev/null || { printf "${RED}Setup failed for $user${NC}\n"; exit 1; }
    for i in {-2..2}; do
        test_port_access $((port+i)) || { printf "${RED}Adjust firewall for $user to allow ports $((port-2))-$((port+2))/tcp${NC}\n"; exit 1; }
    done
    test_port_access $((port-3000)) || { printf "${RED}CDP endpoint port $((port-3000)) is blocked for $user${NC}\n"; exit 1; }
    get_license_key
    export LICENSE_KEY="$LICENSE_KEY"
    $SUDO -u "$user" bbcertify || { printf "${RED}Certification failed for $user. Invalid or expired license key.${NC}\n"; exit 1; }
    $SUDO -u "$user" bbpro || { printf "${RED}Failed to run as $user${NC}\n"; exit 1; }
    sleep 2
    # Source test.env for TOKEN if available
    if [ -f "/home/$user/.config/dosyago/bbpro/test.env" ]; then
        source "/home/$user/.config/dosyago/bbpro/test.env" || { printf "${RED}Failed to source test.env for $user${NC}\n"; exit 1; }
        TOKEN="${LOGIN_TOKEN}"
    fi
    [ -n "$TOKEN" ] || TOKEN=$(cat "/home/$user/.config/dosyago/bbpro/login.link" | grep -oE 'token=[^&]+' | sed 's/token=//')
    draw_box "Login Link: https://$hostname:$port/login?token=$TOKEN"
    save_config
}

version() {
    printf "${GREEN}bbx version $BBX_VERSION${NC}\n"
}

usage() {
    banner
    printf "${BOLD}Usage:${NC} bbx <command> [options]\n"
    printf "\n${YELLOW}Note: the bbx tool is still in beta.\n"
    printf "\n"
    printf "Commands:\n"
    printf "  ${GREEN}install${NC}      Install BrowserBox and bbx CLI\n"
    printf "  ${GREEN}uninstall${NC}    Remove BrowserBox, config, and all related files\n"
    printf "  ${GREEN}setup${NC}        Set up BrowserBox [port] [hostname]\n"
    printf "  ${GREEN}certify${NC}      Certify your license\n"
    printf "  ${GREEN}run${NC}          Start BrowserBox [port] [hostname]\n"
    printf "  ${GREEN}stop${NC}         Stop BrowserBox (current user)\n"
    printf "  ${GREEN}stop-user${NC}    Stop BrowserBox for a specific user [username] [delay_seconds]\n"
    printf "  ${GREEN}logs${NC}         Show BrowserBox logs\n"
    printf "  ${GREEN}update${NC}       Update BrowserBox\n"
    printf "  ${BLUE}${BOLD}buy-license${NC}  Purchase a license key and seats\n"
    printf "  ${GREEN}status${NC}       Check BrowserBox status\n"
    printf "  ${GREEN}run-as${NC}       Run as a specific user [username] [port] [hostname]\n"
    printf "  ${PURPLE}tor-run${NC}      Run BrowserBox with Tor [--no-anonymize] [--no-onion]\n"
    printf "  ${BLUE}${BOLD}console*${NC}     See and interact with the BrowserBox command stream\n"
    printf "  ${BLUE}${BOLD}automate*${NC}    Run pptr or playwright scripts in a running BrowserBox\n"
    printf "  ${GREEN}--version${NC}    Show bbx version\n"
    printf "  ${GREEN}--help${NC}       Show this help\n"
    printf "\n${BLUE}${BOLD}*Coming Soon${NC}\n"
}

check_agreement() {
    if [ ! -f "$CONFIG_DIR/.agreed" ]; then
        printf "${BLUE}BrowserBox v10 Terms:${NC} https://dosaygo.com/terms.txt\n"
        printf "${BLUE}License:${NC} $REPO_URL/blob/${branch}/LICENSE.md\n"
        printf "${BLUE}Privacy:${NC} https://dosaygo.com/privacy.txt\n"
        read -r -p " Agree? (yes/no): " AGREE
        [ "$AGREE" = "yes" ] || { printf "${RED}ERROR: Must agree to terms!${NC}\n"; exit 1; }
        mkdir -p "$CONFIG_DIR"
        touch "$CONFIG_DIR/.agreed"
    fi
}

# Tor setup and run function
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

    # Validate at least one Tor mode is enabled
    if ! $anonymize && ! $onion; then
        printf "${RED}ERROR: At least one of --anonymize or --onion must be enabled.${NC}\n"
        exit 1
    fi

    # Ensure prior setup
    [ -n "$PORT" ] || { printf "${RED}ERROR: Run 'bbx setup' first to configure port.${NC}\n"; exit 1; }
    [ -n "$BBX_HOSTNAME" ] || { printf "${RED}ERROR: Run 'bbx setup' first to configure hostname.${NC}\n"; exit 1; }
    [ -n "$TOKEN" ] || TOKEN=$(openssl rand -hex 16)  # Fallback if not set

    printf "${YELLOW}Starting BrowserBox with Tor...${NC}\n"

    # Setup phase with setup_bbpro
    local setup_cmd="setup_bbpro --port $PORT --token $TOKEN"
    if $anonymize; then
        setup_cmd="$setup_cmd --ontor"
    fi
    if ! $onion && ! is_local_hostname "$BBX_HOSTNAME"; then
        printf "${BLUE}DNS Note:${NC} Ensure an A/AAAA record points from $BBX_HOSTNAME to this machine's IP.\n"
        "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh" "$BBX_HOSTNAME" || { printf "${RED}Hostname $BBX_HOSTNAME not resolving.${NC}\n"; exit 1; }
    elif ! $onion; then
        ensure_hosts_entry "$BBX_HOSTNAME"
    fi
    $setup_cmd > "$CONFIG_DIR/tor_setup_output.txt" 2>/dev/null || { printf "${RED}Setup failed. Check local port availability ($((PORT-2))-$((PORT+2))).${NC}\n"; tail -n 5 "$CONFIG_DIR/tor_setup_output.txt"; exit 1; }

    # Source test.env to get LOGIN_TOKEN
    source "$CONFIG_DIR/test.env" || { printf "${RED}Failed to source $CONFIG_DIR/test.env. Run setup again.${NC}\n"; exit 1; }
    TOKEN="${LOGIN_TOKEN}"  # Use LOGIN_TOKEN from test.env

    # Certify (required for both modes)
    get_license_key
    export LICENSE_KEY="$LICENSE_KEY"
    bbcertify || { printf "${RED}Certification failed.${NC}\n"; exit 1; }

    local login_link=""
    if $onion; then
        printf "${YELLOW}Running as onion site (capturing login link)...${NC}\n"
        # Run torbb once at runtime; stdout is the login link
        login_link=$(torbb 2> "$CONFIG_DIR/torbb_errors.txt")
        if [ $? -ne 0 ]; then
            printf "${RED}Failed to start onion site. Check $CONFIG_DIR/torbb_errors.txt:${NC}\n"
            tail -n 5 "$CONFIG_DIR/torbb_errors.txt"
            exit 1
        fi
        if [ -z "$login_link" ]; then
            printf "${RED}torbb output was empty. Check $CONFIG_DIR/torbb_errors.txt:${NC}\n"
            tail -n 5 "$CONFIG_DIR/torbb_errors.txt"
            exit 1
        fi
        # Update BBX_HOSTNAME for onion mode
        BBX_HOSTNAME=$(echo "$login_link" | sed 's|https://\([^/]*\)/login?token=.*|\1|')
        printf "${YELLOW}Onion mode: Skipping external firewall checks (handled by Tor).${NC}\n"
    else
        # Non-onion mode: Run bbpro and construct login link
        for i in {-2..2}; do
            test_port_access $((PORT+i)) || { printf "${RED}Adjust firewall for ports $((PORT-2))-$((PORT+2))/tcp${NC}\n"; exit 1; }
        done
        test_port_access $((PORT-3000)) || { printf "${RED}CDP port $((PORT-3000)) blocked. Adjust firewall.${NC}\n"; exit 1; }
        bbpro || { printf "${RED}Failed to start BrowserBox.${NC}\n"; exit 1; }
        login_link="https://$BBX_HOSTNAME:$PORT/login?token=$TOKEN"
    fi

    sleep 2
    save_config
    printf "${GREEN}BrowserBox with Tor started.${NC}\n"
    draw_box "Login Link: $login_link"
}

buy_license() {
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
      local response=$(curl -s "https://browse.cloudtabs.net/api/license-status?session_id=$session_id")
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

[ "$1" != "install" ] && [ "$1" != "uninstall" ] && check_agreement
case "$1" in
    install)
        shift 1
        install "$@"
        ;;
    uninstall)
        shift 1
        uninstall "$@"
        ;;
    setup)
        shift 1
        setup "$@"
        ;;
    certify)
        shift 1
        certify "$@"
        ;;
    run)
        shift 1
        run "$@"
        ;;
    stop)
        shift 1
        stop "$@"
        ;;
    stop-user)
        shift 1
        stop_user "$@"
        ;;
    logs)
        shift 1
        logs "$@"
        ;;
    update)
        shift 1
        update "$@"
        ;;
    buy-license)
        shift 1
        buy_license "$@"
        ;;
    status)
        shift 1
        status "$@"
        ;;
    run-as)
        shift 1
        run_as "$@"
        ;;
    tor-run)
        shift 1
        banner_color=$PURPLE
        tor_run "$@"
        ;;
    --version|-v)
        shift 1
        version "$@"
        ;;
    --help|-h)
        shift 1
        usage "$@"
        ;;
    "")
        usage
        ;;
    *)
        printf "${RED}Unknown command: $1${NC}\n"
        usage
        exit 1
        ;;
esac
