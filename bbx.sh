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
BBX_VERSION="10.0.3"
branch="bx3" # change to main for dist
banner_color=$BLUE

# Sudo check
SUDO=$(command -v sudo >/dev/null && echo "sudo -n" || echo "")
if [ "$EUID" -ne 0 ] && ! $SUDO true 2>/dev/null; then
    printf "${RED}ERROR: Requires root or passwordless sudo. Edit /etc/sudoers with visudo if needed.${NC}\n"
    exit 1
fi

# Default paths
BBX_HOME="${HOME}/.bbx"
COMMAND_DIR=""
REPO_URL="https://github.com/BrowserBox/BrowserBox"
BBX_SHARE="/usr/local/share/dosyago"

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

# Config file (secondary to test.env and login.link)
CONFIG_DIR="$HOME/.config/dosyago/bbpro"
CONFIG_FILE="$CONFIG_DIR/config"
TICKET_FILE="$CONFIG_DIR/tickets/ticket.json"
[ ! -d "$CONFIG_DIR" ] && mkdir -p "$CONFIG_DIR"

load_config() {
    [ -f "$CONFIG_FILE" ] && source "$CONFIG_FILE"
    # Override with test.env if it exists
    [ -f "$CONFIG_DIR/test.env" ] && source "$CONFIG_DIR/test.env" && PORT="${APP_PORT:-$PORT}" && TOKEN="${LOGIN_TOKEN:-$TOKEN}"
}

save_config() {
    mkdir -p "$CONFIG_DIR"
    cat > "$CONFIG_FILE" <<EOF
EMAIL="${EMAIL:-}"
LICENSE_KEY="${LICENSE_KEY:-}"
BBX_HOSTNAME="${BBX_HOSTNAME:-}"
TOKEN="${TOKEN:-}"
PORT="${PORT:-}"
EOF
    chmod 600 "$CONFIG_FILE"
}

# Get license key, show warning only on new entry
get_license_key() {
    if [ -n "$LICENSE_KEY" ]; then
        return
    fi
    read -r -p "Enter License Key (get one at sales@dosaygo.com): " LICENSE_KEY
    [ -n "$LICENSE_KEY" ] || { printf "${RED}ERROR: License key required!${NC}\n"; exit 1; }
    printf "${YELLOW}Note: License will be saved unencrypted at $CONFIG_FILE. Ensure file permissions are restricted (e.g., chmod 600).${NC}\n"
}

# Ensure setup_tor is run for the user (assume global, check Tor service)
ensure_setup_tor() {
    local user="$1"
    local tor_running=false
    if [[ "$(uname -s)" == "Darwin" ]]; then
        brew services list | grep -q "tor.*started" && tor_running=true
    else
        systemctl is-active tor >/dev/null 2>&1 && tor_running=true
    fi
    if ! $tor_running || ! command -v tor >/dev/null 2>&1; then
        printf "${YELLOW}Setting up Tor for user $user...${NC}\n"
        $SUDO setup_tor "$user" || { printf "${RED}Failed to setup Tor for $user${NC}\n"; exit 1; }
    fi
}

# Certify with updated bbcertify behavior
certify_with_retry() {
    bbcertify || { printf "${RED}Certification failed. Check LICENSE_KEY or server status.${NC}\n"; exit 1; }
    printf "${GREEN}Certification complete.${NC}\n"
}

install() {
    banner
    pre_install
    load_config
    ensure_deps
    printf "${GREEN}Installing BrowserBox CLI (bbx)...${NC}\n"
    mkdir -p "$BBX_HOME/BrowserBox" || { printf "${RED}Failed to create $BBX_HOME/BrowserBox${NC}\n"; exit 1; }
    printf "${YELLOW}Fetching BrowserBox repository...${NC}\n"
    curl -sL "$REPO_URL/archive/refs/heads/${branch}.zip" -o "$BBX_HOME/BrowserBox.zip" || { printf "${RED}Failed to download BrowserBox repo${NC}\n"; exit 1; }
    rm -rf "$BBX_HOME/BrowserBox/*"
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
        printf "${YELLOW}Running BrowserBox installer non-interactively...${NC}\n"
        cd "$BBX_HOME/BrowserBox" && (yes | ./deploy-scripts/global_install.sh "$BBX_HOSTNAME" "$EMAIL")
    fi
    [ $? -eq 0 ] || { printf "${RED}Installation failed${NC}\n"; exit 1; }
    printf "${YELLOW}Updating npm and pm2...${NC}\n"
    source "${HOME}/.nvm/nvm.sh"
    npm i -g npm@latest
    npm i -g pm2@latest
    printf "${YELLOW}Installing bbx command globally...${NC}\n"
    if [[ ":$PATH:" == *":/usr/local/bin:"* ]] && $SUDO test -w /usr/local/bin; then
      COMMAND_DIR="/usr/local/bin"
    elif $SUDO test -w /usr/bin; then
      COMMAND_DIR="/usr/bin"
    else
      COMMAND_DIR="$HOME/.local/bin"
      mkdir -p "$COMMAND_DIR"
    fi
    BBX_BIN="${COMMAND_DIR}/bbx"
    $SUDO curl -sL "$REPO_URL/raw/${branch}/bbx.sh" -o "$BBX_BIN" || { printf "${RED}Failed to install bbx${NC}\n"; $SUDO rm -f "$BBX_BIN"; exit 1; }
    $SUDO chmod +x "$BBX_BIN"
    save_config
    printf "${GREEN}bbx v$BBX_VERSION installed successfully! Run 'bbx --help' for usage.${NC}\n"
}

setup() {
    load_config
    ensure_deps
    local port="${1:-${PORT:-$(find_free_port_block)}}"
    local default_hostname=$(get_system_hostname)
    local hostname="${2:-${BBX_HOSTNAME:-$default_hostname}}"
    PORT="$port"
    BBX_HOSTNAME="$hostname"
    printf "${YELLOW}Setting up BrowserBox on $hostname:$port...${NC}\n"
    if ! is_local_hostname "$hostname"; then
        printf "${BLUE}DNS Note:${NC} Ensure an A/AAAA record points from $hostname to this machine's IP.\n"
        curl -sL "$REPO_URL/raw/${branch}/deploy-scripts/wait_for_hostname.sh" -o "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh" || { printf "${RED}Failed to download wait_for_hostname.sh${NC}\n"; exit 1; }
        chmod +x "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh"
        "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh" "$hostname" || { printf "${RED}Hostname $hostname not resolving${NC}\n"; exit 1; }
    else
        ensure_hosts_entry "$hostname"
    fi
    [ -n "$TOKEN" ] || TOKEN=$(openssl rand -hex 16)
    setup_bbpro --port "$port" --token "$TOKEN" > "$CONFIG_DIR/setup_output.txt" 2>/dev/null || { printf "${RED}Port range $((port-2))-$((port+2)) not free${NC}\n"; exit 1; }
    for i in {-2..2}; do
        test_port_access $((port+i)) || { printf "${RED}Adjust firewall to allow ports $((port-2))-$((port+2))/tcp${NC}\n"; exit 1; }
    done
    test_port_access $((port-3000)) || { printf "${RED}CDP port $((port-3000)) blocked${NC}\n"; exit 1; }
    setup_bbpro --port "$port" --token "$TOKEN" > "$CONFIG_DIR/login.link" 2>/dev/null || { printf "${RED}Setup failed${NC}\n"; exit 1; }
    source "$CONFIG_DIR/test.env" && PORT="${APP_PORT:-$port}" && TOKEN="${LOGIN_TOKEN:-$TOKEN}" || { printf "${YELLOW}Warning: test.env not found${NC}\n"; }
    save_config
    printf "${GREEN}Setup complete.${NC}\n"
    draw_box "Login Link: $(cat "$CONFIG_DIR/login.link" 2>/dev/null || echo "https://$hostname:$port/login?token=$TOKEN")"
}

run() {
    banner
    load_config
    local port="${1:-${PORT:-$(find_free_port_block)}}"
    local default_hostname=$(get_system_hostname)
    local hostname="${2:-${BBX_HOSTNAME:-$default_hostname}}"
    PORT="$port"
    BBX_HOSTNAME="$hostname"
    setup "$port" "$hostname"
    printf "${YELLOW}Starting BrowserBox on $hostname:$port...${NC}\n"
    if ! is_local_hostname "$hostname"; then
        printf "${BLUE}DNS Note:${NC} Ensure an A/AAAA record points from $hostname to this machine's IP.\n"
        "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh" "$hostname" || { printf "${RED}Hostname $hostname not resolving${NC}\n"; exit 1; }
    else
        ensure_hosts_entry "$hostname"
    fi
    get_license_key
    export LICENSE_KEY="$LICENSE_KEY"
    certify_with_retry
    bbpro || { printf "${RED}Failed to start${NC}\n"; exit 1; }
    sleep 2
    source "$CONFIG_DIR/test.env" && PORT="${APP_PORT:-$port}" && TOKEN="${LOGIN_TOKEN:-$TOKEN}" || { printf "${YELLOW}Warning: test.env not found${NC}\n"; }
    local login_link=$(cat "$CONFIG_DIR/login.link" 2>/dev/null || echo "https://$hostname:$port/login?token=$TOKEN")
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
    [ -n "$PORT" ] || {
        printf "${RED}Running 'bbx setup' first...${NC}\n";
        bbx setup;
    }
    [ -n "$BBX_HOSTNAME" ] || {
        printf "${RED}Running 'bbx setup' first...${NC}\n";
        bbx setup;
    }
    [ -n "$TOKEN" ] || TOKEN=$(openssl rand -hex 16)
    printf "${YELLOW}Starting BrowserBox with Tor...${NC}\n"
    ensure_setup_tor "$(whoami)"

    # Determine Tor group dynamically
    if [[ "$(uname -s)" == "Darwin" ]]; then
        TOR_GROUP="_tor"  # Homebrew default
        TORDIR="$(brew --prefix)/var/lib/tor"
    else
        TORDIR="/var/lib/tor"
        TOR_GROUP=$(ls -ld "$TORDIR" | awk '{print $4}' 2>/dev/null) || TOR_GROUP="debian-tor"
        [[ -z "$TOR_GROUP" || "$TOR_GROUP" == "root" ]] && TOR_GROUP=$(getent group | grep -E 'tor|debian-tor|toranon' | cut -d: -f1 | head -n1) || TOR_GROUP="debian-tor"
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
    $setup_cmd > "$CONFIG_DIR/tor_setup_output.txt" 2>/dev/null || { printf "${RED}Setup failed${NC}\n"; tail -n 5 "$CONFIG_DIR/tor_setup_output.txt"; exit 1; }
    source "$CONFIG_DIR/test.env" && PORT="${APP_PORT:-$PORT}" && TOKEN="${LOGIN_TOKEN:-$TOKEN}" || { printf "${YELLOW}Warning: test.env not found${NC}\n"; }
    get_license_key
    export LICENSE_KEY="$LICENSE_KEY"
    certify_with_retry
    local login_link=""
    if $onion; then
        printf "${YELLOW}Running as onion site...${NC}\n"
        if $in_tor_group; then
            # Run torbb directly if user is in TOR_GROUP
            login_link=$(torbb 2> "$CONFIG_DIR/torbb_errors.txt")
        elif command -v sg >/dev/null 2>&1; then
            # Use safe heredoc with env
            export CONFIG_DIR
            login_link=$(sg "$TOR_GROUP" -c "env CONFIG_DIR='$CONFIG_DIR' bash" << 'EOF' 2> "$CONFIG_DIR/torbb_errors.txt"
torbb
EOF
            )
        else
            # Fallback without sg
            login_link=$(torbb 2> "$CONFIG_DIR/torbb_errors.txt")
        fi
        [ $? -eq 0 ] && [ -n "$login_link" ] || { printf "${RED}torbb failed${NC}\n"; tail -n 5 "$CONFIG_DIR/torbb_errors.txt"; exit 1; }
        BBX_HOSTNAME=$(echo "$login_link" | sed 's|https://\([^/]*\)/login?token=.*|\1|')
    else
        for i in {-2..2}; do
            test_port_access $((PORT+i)) || { printf "${RED}Adjust firewall for ports $((PORT-2))-$((PORT+2))/tcp${NC}\n"; exit 1; }
        done
        test_port_access $((PORT-3000)) || { printf "${RED}CDP port $((PORT-3000)) blocked${NC}\n"; exit 1; }
        bbpro || { printf "${RED}Failed to start${NC}\n"; exit 1; }
        login_link=$(cat "$CONFIG_DIR/login.link" 2>/dev/null || echo "https://$BBX_HOSTNAME:$PORT/login?token=$TOKEN")
    fi
    sleep 2
    printf "${GREEN}BrowserBox with Tor started.${NC}\n"
    draw_box "Login Link: $login_link"
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
        read -p "Enter a regular user to run the installation: " install_user
        if [ -z "$install_user" ]; then
            printf "${RED}ERROR: A username is required${NC}\n"
            exit 1
        fi

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
        chown "${install_user}:${install_user}" /tmp/bbx.sh

        # Switch to the non-root user and run install
        echo "Switching to user $install_user..."
        su - "$install_user" -c "/tmp/bbx.sh install"

        # Replace the root shell with the new user's shell
        exec su - "$install_user"
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
    local deps=("curl" "rsync" "debian:netcat-openbsd,redhat:nmap-ncat,darwin:netcat/nc" "at" "unzip" "debian:dnsutils,redhat:bind-utils,darwin:bind/dig" "git" "openssl" "debian:login,redhat:util-linux/sg")
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
    
    # Check and reset hostname if unresolvable
    if ! is_local_hostname "$BBX_HOSTNAME" && ! dig +short "$BBX_HOSTNAME" A >/dev/null 2>&1; then
        printf "${YELLOW}Current hostname $BBX_HOSTNAME not resolvable, resetting to default...${NC}\n"
        BBX_HOSTNAME=$(get_system_hostname)
    fi
    
    # Ensure BBX_HOME exists
    mkdir -p "$BBX_HOME/BrowserBox" || { printf "${RED}Failed to create $BBX_HOME/BrowserBox${NC}\n"; exit 1; }
    
    # Fetch the latest ZIP from GitHub
    printf "${YELLOW}Fetching BrowserBox repository (${branch} branch)...${NC}\n"
    curl -sL "$REPO_URL/archive/refs/heads/${branch}.zip" -o "$BBX_HOME/BrowserBox.zip" || { printf "${RED}Failed to download BrowserBox repo${NC}\n"; exit 1; }
    
    # Clean temp directory, extract ZIP, and merge with rsync
    printf "${YELLOW}Extracting and updating BrowserBox files...${NC}\n"
    rm -rf "$BBX_HOME/BrowserBox-zip"  # Ensure temp dir is fresh
    unzip -q -o "$BBX_HOME/BrowserBox.zip" -d "$BBX_HOME/BrowserBox-zip" || { printf "${RED}Failed to extract BrowserBox repo${NC}\n"; exit 1; }
    rsync -a --delete "$BBX_HOME/BrowserBox-zip/BrowserBox-${branch}/" "$BBX_HOME/BrowserBox/" || { printf "${RED}Failed to merge updated files${NC}\n"; exit 1; }
    rm -rf "$BBX_HOME/BrowserBox-zip" "$BBX_HOME/BrowserBox.zip"
    
    # Make global_install.sh executable
    chmod +x "$BBX_HOME/BrowserBox/deploy-scripts/global_install.sh" || { printf "${RED}Failed to make global_install.sh executable${NC}\n"; exit 1; }
    
    # Run unattended global install with existing hostname and email
    printf "${YELLOW}Running BrowserBox installer non-interactively...${NC}\n"
    cd "$BBX_HOME/BrowserBox" && (yes | ./deploy-scripts/global_install.sh "$BBX_HOSTNAME" "$EMAIL") || { printf "${RED}Installation failed${NC}\n"; exit 1; }
    
    # Update npm and pm2
    printf "${YELLOW}Updating npm and pm2...${NC}\n"
    source "${HOME}/.nvm/nvm.sh"
    npm i -g npm@latest
    npm i -g pm2@latest
    
    # Install bbx command globally
    printf "${YELLOW}Installing bbx command globally...${NC}\n"
    if [[ ":$PATH:" == *":/usr/local/bin:"* ]] && $SUDO test -w /usr/local/bin; then
      COMMAND_DIR="/usr/local/bin"
    elif $SUDO test -w /usr/bin; then
      COMMAND_DIR="/usr/bin"
    else
      COMMAND_DIR="$HOME/.local/bin"
      mkdir -p "$COMMAND_DIR"
    fi
    BBX_BIN="${COMMAND_DIR}/bbx"
    $SUDO curl -sL "$REPO_URL/raw/${branch}/bbx.sh" -o "$BBX_BIN" || { printf "${RED}Failed to install bbx${NC}\n"; $SUDO rm -f "$BBX_BIN"; exit 1; }
    $SUDO chmod +x "$BBX_BIN"
    
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
        $SUDO -u "$user" stop_bbpro 2>/dev/null || { printf "${RED}Failed to stop BrowserBox for $user${NC}\n"; exit 1; }
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

    load_config
    ensure_deps
    local user=""
    local port="${PORT:-$(find_free_port_block)}"
    local hostname="${BBX_HOSTNAME:-$(get_system_hostname)}"
    local temporary=false

    # Parse arguments
    while [ $# -gt 0 ]; do
        case "$1" in
            --temporary)
                temporary=true
                shift
                ;;
            *)
                if [ -z "$user" ]; then
                    user="$1"
                elif [ -z "$port" ]; then
                    port="$1"
                else
                    hostname="$1"
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
    [ -n "$TOKEN" ] || TOKEN=$(openssl rand -hex 16)
    local HOME_DIR=$(get_home_dir "$user")

    # Ensure config directory exists with proper ownership
    $SUDO -u "$user" mkdir -p "$HOME_DIR/.config/dosyago/bbpro" || { printf "${RED}Failed to create config dir for $user${NC}\n"; exit 1; }

    # Rsync .nvm from calling user to target user
    printf "${YELLOW}Copying nvm and Node.js from $HOME/.nvm to $HOME_DIR/.nvm...${NC}\n"
    $SUDO rsync -aq --exclude='.git' "$HOME/.nvm/" "$HOME_DIR/.nvm/" || { printf "${RED}Failed to rsync .nvm directory${NC}\n"; exit 1; }
    $SUDO chown -R "$user":"$user" "$HOME_DIR/.nvm" || { printf "${RED}Failed to chown .nvm directory${NC}\n"; exit 1; }
    NODE_VERSION=$($SUDO bash -c 'source ~/.nvm/nvm.sh; nvm current') || NODE_VERSION="v22"
    $SUDO -i -u "$user" bash -c "source ~/.nvm/nvm.sh; nvm use $NODE_VERSION; nvm alias default $NODE_VERSION;" || { printf "${RED}Failed to set up nvm for $user${NC}\n"; exit 1; }

    # Run setup_bbpro
    $SUDO su - "$user" -c "setup_bbpro --port $port --token $TOKEN" || { printf "${RED}Setup failed for $user${NC}\n"; exit 1; }

    # Test port accessibility
    for i in {-2..2}; do
        test_port_access $((port+i)) || { printf "${RED}Adjust firewall for $user to allow ports $((port-2))-$((port+2))/tcp${NC}\n"; exit 1; }
    done
    test_port_access $((port-3000)) || { printf "${RED}CDP endpoint port $((port-3000)) is blocked for $user${NC}\n"; exit 1; }

    # Use caller's LICENSE_KEY
    if [ -z "$LICENSE_KEY" ]; then
        printf "${RED}Caller must have a license key set in LICENSE_KEY env var${NC}\n"
        exit 1
    fi
    $SUDO su - "$user" -c "export LICENSE_KEY='$LICENSE_KEY'; bbcertify && bbpro" || { printf "${RED}Failed to run BrowserBox as $user${NC}\n"; exit 1; }
    sleep 2

    # Retrieve token
    if $SUDO test -f "$HOME_DIR/.config/dosyago/bbpro/test.env"; then
        TOKEN=$($SUDO su - "$user" -c "source ~/.config/dosyago/bbpro/test.env && echo \$LOGIN_TOKEN") || { printf "${RED}Failed to source test.env for $user${NC}\n"; exit 1; }
    fi
    if [ -z "$TOKEN" ] && $SUDO test -f "$HOME_DIR/.config/dosyago/bbpro/login.link"; then
        TOKEN=$($SUDO cat "$HOME_DIR/.config/dosyago/bbpro/login.link" | grep -oE 'token=[^&]+' | sed 's/token=//')
    fi
    [ -n "$TOKEN" ] || { printf "${RED}Failed to retrieve login token for $user${NC}\n"; exit 1; }

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
    printf "  ${RED}activate${NC}     Activate your copy of BrowserBox by purchasing a license key for 1 or more seats.\n"
    printf "  ${GREEN}setup${NC}        Set up BrowserBox [port] [hostname]\n"
    printf "  ${GREEN}certify${NC}      Certify your license\n"
    printf "  ${GREEN}run${NC}          Start BrowserBox [port] [hostname]\n"
    printf "  ${GREEN}stop${NC}         Stop BrowserBox (current user)\n"
    printf "  ${GREEN}run-as${NC}       Run as a specific user [--temporary] [username] [port]\n"
    printf "                  --temporary: stop-user deletes the user.\n"
    printf "  ${GREEN}stop-user${NC}    Stop BrowserBox for a specific user [username] [delay_seconds]\n"
    printf "  ${GREEN}logs${NC}         Show BrowserBox logs\n"
    printf "  ${GREEN}update${NC}       Update BrowserBox\n"
    printf "  ${GREEN}status${NC}       Check BrowserBox status\n"
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
    install) shift 1; install "$@";;
    uninstall) shift 1; uninstall "$@";;
    setup) shift 1; setup "$@";;
    certify) shift 1; certify "$@";;
    run) shift 1; run "$@";;
    stop) shift 1; stop "$@";;
    stop-user) shift 1; stop_user "$@";;
    logs) shift 1; logs "$@";;
    update) shift 1; update "$@";;
    activate) shift 1; activate "$@";;
    status) shift 1; status "$@";;
    run-as) shift 1; run_as "$@";;
    tor-run) shift 1; banner_color=$PURPLE; tor_run "$@";;
    --version|-v) shift 1; version "$@";;
    --help|-h) shift 1; usage "$@";;
    "") usage;;
    *) printf "${RED}Unknown command: $1${NC}\n"; usage; exit 1;;
esac
