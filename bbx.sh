#!/bin/bash

##########################################################
#  ____                                  ____
# | __ ) _ __ _____      _____  ___ _ __| __ )  _____  __
# |  _ \| '__/ _ \ \ /\ / / __|/ _ \ '__|  _ \ / _ \ \/ /
# | |_) | | | (_) \ V  V /\__ \  __/ |  | |_) | (_) >  <
# |____/|_|  \___/ \_/\_/ |___/\___|_|  |____/ \___/_/\_
#
##########################################################

if [[ -n "$BBX_DEBUG" ]]; then
  set -x
fi

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
BOLD='\033[1m'

# Version
BBX_VERSION="10.0.2"

# ASCII Banner
banner() {
    printf "${BLUE}${BOLD}"
    cat << 'EOF'
  ____                                  ____
 | __ ) _ __ _____      _____  ___ _ __| __ )  _____  __
 |  _ \| '__/ _ \ \ /\ / / __|/ _ \ '__|  _ \ / _ \ \/ /
 | |_) | | | (_) \ V  V /\__ \  __/ |  | |_) | (_) >  <
 |____/|_|  \___/ \_/\_/ |___/\___|_|  |____/ \___/_/\_

EOF
    printf "${NC}\n"
}

# Box drawing helpers
draw_box() {
    local text="$1"
    local width=$((${#text} + 4))
    printf "┌"; printf "─"%.0s $(seq 1 "$width"); printf "┐\n"
    printf "│  %-${#text}s  │\n" "$text"
    printf "└"; printf "─"%.0s $(seq 1 "$width"); printf "┘\n"
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
    if [ -n "$BBX_LICENSE_KEY" ]; then
        LICENSE_KEY="$BBX_LICENSE_KEY"
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

# Dependency check
ensure_deps() {
    local deps=("curl" "nc" "at" "unzip")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" >/dev/null 2>&1; then
            printf "${YELLOW}Installing $dep...${NC}\n"
            if [ -f /etc/debian_version ]; then
                $SUDO apt-get update && $SUDO apt-get install -y "$dep"
            elif [ -f /etc/redhat-release ]; then
                $SUDO yum install -y "$dep" || $SUDO dnf install -y "$dep"
            elif [ "$(uname -s)" = "Darwin" ]; then
                brew install "$dep"
            else
                printf "${RED}Cannot install $dep. Please install it manually.${NC}\n"
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
    load_config
    ensure_deps
    printf "${GREEN}Installing BrowserBox CLI (bbx)...${NC}\n"
    mkdir -p "$BBX_HOME/BrowserBox" || { printf "${RED}Failed to create $BBX_HOME/BrowserBox${NC}\n"; exit 1; }
    printf "${YELLOW}Fetching BrowserBox repository...${NC}\n"
    curl -sL "$REPO_URL/archive/refs/heads/main.zip" -o "$BBX_HOME/BrowserBox.zip" || { printf "${RED}Failed to download BrowserBox repo${NC}\n"; exit 1; }
    rm -rf $BBX_HOME/BrowserBox/*
    unzip -q "$BBX_HOME/BrowserBox.zip" -d "$BBX_HOME/BrowserBox-zip" || { printf "${RED}Failed to extract BrowserBox repo${NC}\n"; exit 1; }
    mv "$BBX_HOME/BrowserBox-zip/BrowserBox-main"/* "$BBX_HOME/BrowserBox/" && rm -rf "$BBX_HOME/BrowserBox-zip"
    rm "$BBX_HOME/BrowserBox.zip"
    chmod +x "$BBX_HOME/BrowserBox/deploy-scripts/global_install.sh" || { printf "${RED}Failed to make global_install.sh executable${NC}\n"; exit 1; }
    local default_hostname=$(get_system_hostname)
    [ -n "$BBX_HOSTNAME" ] || read -r -p "Enter hostname (default: $default_hostname): " BBX_HOSTNAME
    BBX_HOSTNAME="${BBX_HOSTNAME:-$default_hostname}"
    if is_local_hostname "$BBX_HOSTNAME"; then
        ensure_hosts_entry "$BBX_HOSTNAME"
    fi
    [ -n "$EMAIL" ] || read -r -p "Enter your email for Let’s Encrypt (optional for $BBX_HOSTNAME): " EMAIL
    if [ -t 0 ]; then
        printf "${YELLOW}Running BrowserBox installer interactively...${NC}\n"
        cd "$BBX_HOME/BrowserBox" && ./deploy-scripts/global_install.sh "$BBX_HOSTNAME" "$EMAIL"
    else
        printf "${YELLOW}Running BrowserBox installer non-interactively (auto-accepting prompts)...${NC}\n"
        cd "$BBX_HOME/BrowserBox" && (yes | ./deploy-scripts/global_install.sh "$BBX_HOSTNAME" "$EMAIL")
    fi
    [ $? -eq 0 ] || { printf "${RED}Installation failed. Check $BBX_HOME/BrowserBox/deploy-scripts/global_install.sh output.${NC}\n"; exit 1; }
    $SUDO curl -sL "$REPO_URL/raw/main/bbx" -o "$BBX_BIN" || { printf "${RED}Failed to install bbx${NC}\n"; $SUDO rm -f "$BBX_BIN"; exit 1; }
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

setup() {
    load_config
    ensure_deps
    local port="${2:-$(find_free_port_block)}"
    local default_hostname=$(get_system_hostname)
    local hostname="${3:-${BBX_HOSTNAME:-$default_hostname}}"
    PORT="$port"
    BBX_HOSTNAME="$hostname"
    printf "${YELLOW}Setting up BrowserBox on $hostname:$port...${NC}\n"
    if ! is_local_hostname "$hostname"; then
        printf "${BLUE}DNS Note:${NC} Ensure an A/AAAA record points from $hostname to this machine’s IP.\n"
        curl -sL "$REPO_URL/raw/main/deploy-scripts/wait_for_hostname.sh" -o "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh" || { printf "${RED}Failed to download wait_for_hostname.sh${NC}\n"; exit 1; }
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

certify() {
    load_config
    printf "${YELLOW}Certifying BrowserBox license...${NC}\n"
    get_license_key
    export LICENSE_KEY="$LICENSE_KEY"
    bbcertify || { printf "${RED}Certification failed. Check your license key.${NC}\n"; exit 1; }
    save_config
    printf "${GREEN}Certification complete.${NC}\n"
}

run() {
    load_config
    local port="${2:-$PORT}"
    local default_hostname=$(get_system_hostname)
    local hostname="${3:-${BBX_HOSTNAME:-$default_hostname}}"
    [ -n "$port" ] || { printf "${RED}Run 'bbx setup' first to set a port.${NC}\n"; exit 1; }
    PORT="$port"
    BBX_HOSTNAME="$hostname"
    printf "${YELLOW}Starting BrowserBox on $hostname:$port...${NC}\n"
    if ! is_local_hostname "$hostname"; then
        printf "${BLUE}DNS Note:${NC} Ensure an A/AAAA record points from $hostname to this machine’s IP.\n"
        curl -sL "$REPO_URL/raw/main/deploy-scripts/wait_for_hostname.sh" -o "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh" || { printf "${RED}Failed to download wait_for_hostname.sh${NC}\n"; exit 1; }
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
    [ -n "$TOKEN" ] || TOKEN=$(cat "$CONFIG_DIR/login.link" | grep -oP 'token=\K[^&]+')
    draw_box "Login Link: https://$hostname:$port/login?token=$TOKEN"
    save_config
}

stop() {
    load_config
    printf "${YELLOW}Stopping BrowserBox (current user)...${NC}\n"
    stop_bbpro || { printf "${RED}Failed to stop. Check if BrowserBox is running.${NC}\n"; exit 1; }
    printf "${GREEN}BrowserBox stopped.${NC}\n"
}

stop_user() {
    load_config
    local user="$2"
    local delay="${3:-0}"
    if [ -z "$user" ]; then
        printf "${RED}Usage: bbx stop-user <username> [delay_seconds]${NC}\n"
        exit 1
    fi
    if ! id "$user" >/dev/null 2>&1; then
        printf "${RED}User $user does not exist.${NC}\n"
        exit 1
    fi
    printf "${YELLOW}Scheduling stop for $user in $delay seconds...${NC}\n"
    curl -sL "$REPO_URL/raw/main/scale_server/stop_browser.sh" -o "$BBX_HOME/BrowserBox/deploy-scripts/stop_browser.sh" || { printf "${RED}Failed to download stop_browser.sh${NC}\n"; exit 1; }
    chmod +x "$BBX_HOME/BrowserBox/deploy-scripts/stop_browser.sh"
    "$BBX_HOME/BrowserBox/deploy-scripts/stop_browser.sh" "$user" "$delay" || { printf "${RED}Failed to stop $user’s session.${NC}\n"; exit 1; }
    printf "${GREEN}Stop scheduled for $user.${NC}\n"
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
    draw_box "License: $REPO_URL/blob/main/LICENSE.md"
    draw_box "Privacy: https://dosaygo.com/privacy.txt"
    draw_box "Get a License: https://dosaygo.com/license"
    printf "Run 'bbx certify' to enter your license key.\n"
}

status() {
    load_config
    printf "${YELLOW}Checking BrowserBox status...${NC}\n"
    if [ -n "$PORT" ] && curl -s --max-time 2 "http://localhost:$PORT" >/dev/null 2>&1; then
        draw_box "Status: Running (port $PORT)"
    elif command -v pm2 >/dev/null && pm2 list | grep -q "bbpro"; then
        draw_box "Status: Running (current user via pm2)"
    else
        draw_box "Status: Not Running"
    fi
}

run_as() {
    load_config
    ensure_deps
    local user="$2"
    local port="${3:-$(find_free_port_block)}"
    local hostname="${4:-${BBX_HOSTNAME:-localhost}}"
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
    draw_box "Login Link: https://$hostname:$port/login?token=$TOKEN"
    save_config
}

version() {
    printf "${GREEN}bbx version $BBX_VERSION${NC}\n"
}

usage() {
    banner
    printf "${BOLD}Usage:${NC} bbx <command> [options]\n\n"
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
    printf "  ${GREEN}license${NC}      Show license purchase URL\n"
    printf "  ${GREEN}status${NC}       Check BrowserBox status\n"
    printf "  ${GREEN}run-as${NC}       Run as a specific user [username] [port] [hostname]\n"
    printf "  ${GREEN}--version${NC}    Show bbx version\n"
    printf "  ${GREEN}--help${NC}       Show this help\n"
}

check_agreement() {
    if [ ! -f "$CONFIG_DIR/.agreed" ]; then
        printf "${BLUE}BrowserBox v10 Terms:${NC} https://dosaygo.com/terms.txt\n"
        printf "${BLUE}License:${NC} $REPO_URL/blob/main/LICENSE.md\n"
        printf "${BLUE}Privacy:${NC} https://dosaygo.com/privacy.txt\n"
        read -r -p " Agree? (yes/no): " AGREE
        [ "$AGREE" = "yes" ] || { printf "${RED}ERROR: Must agree to terms!${NC}\n"; exit 1; }
        mkdir -p "$CONFIG_DIR"
        touch "$CONFIG_DIR/.agreed"
    fi
}

[ "$1" != "install" ] && [ "$1" != "uninstall" ] && check_agreement
case "$1" in
    install) install ;;
    uninstall) uninstall ;;
    setup) setup "$@" ;;
    certify) certify ;;
    run) run "$@" ;;
    stop) stop ;;
    stop-user) stop_user "$@" ;;
    logs) logs ;;
    update) update ;;
    license) license ;;
    status) status ;;
    run-as) run_as "$@" ;;
    --version|-v) version ;;
    --help|-h) usage ;;
    "") usage ;;
    *) printf "${RED}Unknown command: $1${NC}\n"; usage; exit 1 ;;
esac
