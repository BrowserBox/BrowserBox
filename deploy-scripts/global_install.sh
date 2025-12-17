#!/usr/bin/env bash

#
# Installs and configures BrowserBox Pro on a machine.
#
# Usage:
#   ./global_install.sh <hostname> [email_for_letsencrypt]
#
# Environment Variables:
#   BBX_DEBUG: If set, runs the script in debug mode (set -x).
#   BBX_NODE_VERSION: Overrides the default Node.js version to install.
#   BBX_NO_COPY: If set, skips the final step of copying command scripts.
#   BBX_BINARY_BUILD: If set, skips npm-related installations, assuming a self-contained binary.
#   BBX_TEST_AGREEMENT: If set, bypasses the interactive license agreement prompt.
#

# --- Strict Mode --------------------------------------------------------------
set -u

# --- Configuration & Constants ------------------------------------------------
readonly ANSI_RED='\033[0;31m'
readonly ANSI_GREEN='\033[0;32m'
readonly ANSI_YELLOW='\033[1;33m'
readonly ANSI_BLUE='\033[0;34m'
readonly ANSI_NC='\033[0m'
readonly ANSI_BOLD='\033[1m'

readonly CONFIG_DIR="$HOME/.config/dosyago/bbpro"
readonly DEFAULT_NODE_VERSION="${BBX_NODE_VERSION:-22}"

export DEFAULT_NODE_VERSION

# --- Global Variables ---------------------------------------------------------
# These are set by functions and used by others.
BBX_EMAIL=""
BBX_HOSTNAME=""
SUDO=""
ZONE=""
APT=""
REPLY=""

# --- Helper Functions ---------------------------------------------------------

log_info() {
    printf "${ANSI_BLUE}[INFO] %s${ANSI_NC}\n" "$1" >&2
}

log_warning() {
    printf "${ANSI_YELLOW}[WARN] %s${ANSI_NC}\n" "$1" >&2
}

log_error() {
    printf "${ANSI_RED}[ERROR] %s${ANSI_NC}\n" "$1" >&2
}

# Safely read user input, handling interactive and non-interactive sessions.
read_input() {
    local prompt="$1"
    if [ -t 0 ]; then # Interactive
        read -p "$prompt" -r REPLY
    else # Non-interactive (e.g., piped input)
        read -r REPLY
        REPLY=${REPLY:0:1} # Take the first character
    fi
    echo >&2 # for spacing
}

# Detects the operating system.
get_os_type() {
    case "$(uname -s)" in
        Darwin*) echo "macOS" ;;
        Linux*)  echo "Linux" ;;
        MING*)   echo "win" ;;
        *)       echo "unknown" ;;
    esac
}

# Sets up the SUDO variable for privileged commands.
setup_sudo() {
    if command -v sudo &>/dev/null; then
        if sudo -n true &>/dev/null; then
            SUDO="$(command -v sudo) -n"
        else
            SUDO="sudo"
        fi
    elif [[ "$(get_os_type)" == "Linux" ]]; then
        log_warning "sudo command not found. Attempting to install..."
        if command -v apt &>/dev/null; then
            apt update && apt install -y sudo
        elif command -v dnf &>/dev/null; then
            dnf update && dnf install -y sudo
        fi
        # Re-check for sudo
        if command -v sudo &>/dev/null; then SUDO="sudo"; fi
    fi

    if [[ -z "$SUDO" ]]; then
        log_warning "Could not find or install sudo. Privileged operations may fail."
    else
        export SUDO # Export for child scripts
    fi
}

# Wrapper for getent-like functionality without installing getent
getent_hosts() {
  local hostname="$1"
  # If on macOS, etc, manually search /etc/hosts
  if ! command -v getent &>/dev/null; then
    grep -E "^\s*([^#]+)\s+$hostname" /etc/hosts || echo ""
  else
    getent hosts "$hostname" || echo ""
  fi
}

# Check if hostname is local
is_local_hostname() {
  local hostname="$1"
  local resolved_ips ip
  local public_dns_servers=("8.8.8.8" "1.1.1.1" "208.67.222.222")
  local has_valid_result=0

  # Try DNS resolution
  for dns in "${public_dns_servers[@]}"; do
    resolved_ips=$(command -v dig >/dev/null 2>&1 && dig +short "$hostname" A @"$dns")
    if [[ "$?" -eq 0 ]] && [[ -n "$resolved_ips" ]]; then
      has_valid_result=1
      while IFS= read -r ip; do
        ip="${ip%.}"
        # Public if NOT in known private ranges
        if [[ ! "$ip" =~ ^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1$|fe80:) ]]; then
          return 1 # Public
        fi
      done <<< "$resolved_ips"
    fi
  done

  # If all results were private or none resolved, treat as local
  if [[ "$has_valid_result" -eq 1 ]]; then
    return 0 # All IPs private => local
  fi

  # Fallback: check /etc/hosts (or similar)
  ip=$(getent_hosts "$hostname" | awk '{print $1}' | head -n1)
  if [[ "$ip" =~ ^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1$|fe80:) ]]; then
    return 0 # Local
  fi

  return 0 # Unresolvable => local
}

# Adds the local machine's hostname to /etc/hosts to ensure it's resolvable.
add_local_hostname_to_hosts() {
    local default_host="$(hostname -f || uname -n || echo "unknown")"
    local hostname="${1:-${BXX_HOSTNAME:-$default_host}}"
    if ! grep -q "127.0.0.1.*$hostname" /etc/hosts; then
        log_info "Adding local hostname '$hostname' to /etc/hosts..."
        echo "127.0.0.1 $hostname" | $SUDO tee -a /etc/hosts > /dev/null
    fi
}

# Determines package manager and performs initial system setup.
initialize_package_manager() {
    log_info "Initializing package manager..."
    # shellcheck source=/etc/os-release
    source /etc/os-release &>/dev/null || true
    
    case "$(get_os_type)" in
        macOS)
            # Add common Homebrew paths to PATH before checking
            # Apple Silicon: /opt/homebrew/bin
            # Intel: /usr/local/bin
            if [[ -x /opt/homebrew/bin/brew ]] && [[ ":$PATH:" != *":/opt/homebrew/bin:"* ]]; then
                export PATH="/opt/homebrew/bin:$PATH"
            fi
            if [[ -x /usr/local/bin/brew ]] && [[ ":$PATH:" != *":/usr/local/bin:"* ]]; then
                export PATH="/usr/local/bin:$PATH"
            fi
            APT="$(command -v brew || true)"
            ;;
        Linux)
            if command -v apt &>/dev/null; then
                APT="apt"
                # shellcheck source=/dev/null
                source ./deploy-scripts/non-interactive.sh || true
            elif command -v dnf &>/dev/null; then
                APT="dnf"
                $SUDO dnf -y upgrade --refresh
                $SUDO dnf config-manager --set-enabled crb || true
                $SUDO dnf install -y 'https://dl.fedoraproject.org/pub/epel/epel-release-latest-$(rpm -E %rhel).noarch.rpm'
                if command -v firewall-cmd &>/dev/null; then
                    ZONE="$($SUDO firewall-cmd --get-default-zone || echo 'public')"
                    $SUDO firewall-cmd --permanent --zone="$ZONE" --add-service=http
                    $SUDO firewall-cmd --permanent --zone="$ZONE" --add-service=https
                    $SUDO firewall-cmd --reload
                fi
            fi
            ;;
    esac

    if [[ -z "$APT" ]]; then
        log_warning "No supported package manager (apt, dnf, brew) found. Some features may be limited."
        # For macOS, brew is optional - binary builds can work without it
        if [[ "$(get_os_type)" != "macOS" ]]; then
            log_error "Package manager required on Linux systems."
            return 1
        fi
    else
        log_info "Using package manager: $APT"
        export APT
    fi
}

# Legacy note: Chai document assets used to be synchronized here when the
# installer ran from a source checkout. The binary installer now owns that step.
# Downloads and installs a custom WebRTC binary for specific Linux distributions.
install_custom_wrtc_if_needed() {
    if [[ "$(get_os_type)" != "Linux" ]]; then return; fi
    # shellcheck source=/etc/os-release
    source /etc/os-release || true
    
    local wrtc_filename=""
    local base_url="https://github.com/dosyago/node-webrtc/releases/download/v1.0.0"

    case "${ID-}" in
        debian) [[ "${VERSION_ID-}" == "11" ]] && wrtc_filename="debian-11-wrtc.node" ;;
        almalinux) [[ "${VERSION_ID-}" == 8* ]] && wrtc_filename="almalinux-8-wrtc.node" ;;
        centos|rhel) [[ "${VERSION_ID-}" == 8* ]] && wrtc_filename="centos-8-wrtc.node" || wrtc_filename="centos-9-wrtc.node" ;;
    esac

    if [[ -n "$wrtc_filename" ]]; then
        log_info "Custom WebRTC build needed: $wrtc_filename"
        $SUDO "$APT" install -y wget tar
        wget -q -O "$wrtc_filename" "$base_url/$wrtc_filename"
        
        $SUDO mkdir -p /usr/local/share/dosyago/build/Release
        $SUDO mv "$wrtc_filename" "/usr/local/share/dosyago/build/Release/wrtc.node"
        $SUDO chmod +x "/usr/local/share/dosyago/build/Release/wrtc.node"
        log_info "Custom WebRTC build installed."
    fi
}

# Displays license and terms, and asks for user agreement.
check_license_agreement() {
    if [[ -n "${BBX_TEST_AGREEMENT-}" ]] || [ -f "$CONFIG_DIR/.agreed" ]; then
        return 0
    fi

    printf "${ANSI_BLUE}${ANSI_BOLD}Welcome to BrowserBox Installation${ANSI_NC}\n"
    printf "${ANSI_YELLOW}Before proceeding, please note:${ANSI_NC}\n"
    printf "  - A valid, purchased license is required for use.\n"
    printf "  - By installing, you agree to the terms available at https://dosaygo.com\n"
    printf "  - Commercial use (including evaluation) requires a license.\n\n"
    
    read_input "Do you agree to these terms and confirm a license for use? (yes/no): "
    if [[ "$REPLY" =~ ^[Yy] ]]; then
        log_info "Terms accepted. Proceeding..."
        mkdir -p "$CONFIG_DIR"
        touch "${CONFIG_DIR}/.agreed"
        echo "$BBX_EMAIL" >> "${CONFIG_DIR}/.agreed"
    else
        log_error "Terms not accepted. Exiting installation."
        exit 1
    fi
}

# Opens firewall ports.
open_firewall_ports() {
    local port=$1
    log_info "Opening firewall port $port..."
    if command -v firewall-cmd &>/dev/null; then
        $SUDO firewall-cmd --zone="${ZONE:-public}" --add-port="${port}/tcp" --permanent
        $SUDO firewall-cmd --reload
    elif command -v ufw &>/dev/null; then
        $SUDO ufw allow "$port/tcp"
    else
        log_warning "No recognized firewall tool (firewalld, ufw) found. Port $port may need to be opened manually."
    fi
}

# Sets up SSL certificates using mkcert for local hostnames or LetsEncrypt for public ones.
setup_ssl() {
    local hostname="$1"
    local email="${2-}"

    if is_local_hostname "$hostname"; then
        log_info "Local hostname detected. Setting up SSL with mkcert..."
        if ! command -v mkcert &>/dev/null; then
            log_info "Installing mkcert..."
            case "$(get_os_type)" in
                macOS)
                    if command -v brew &>/dev/null; then
                        brew install nss mkcert
                    else
                        log_warning "Homebrew not found. Please install mkcert manually or install Homebrew."
                        log_warning "Visit: https://brew.sh"
                        return 0  # Continue without mkcert for now
                    fi
                    ;;
                win)   log_error "Please install mkcert manually on Windows." ; exit 1 ;;
                *)     $SUDO "$APT" install -y libnss3-tools wget && \
                       tmpdir="$(mktemp -d)" && \
                       wget -qO "${tmpdir}/mkcert" "https://dl.filippo.io/mkcert/latest?for=linux/$(dpkg --print-architecture 2>/dev/null || uname -m)" && \
                       chmod +x "${tmpdir}/mkcert" && $SUDO mv "${tmpdir}/mkcert" /usr/local/bin/ && rm -rf "${tmpdir}" ;;
            esac
        fi
        mkcert -install
        mkdir -p "$HOME/sslcerts"
        (cd "$HOME/sslcerts" && mkcert --cert-file fullchain.pem --key-file privkey.pem "$hostname" localhost 127.0.0.1)
    else
        log_info "Public hostname detected. Setting up SSL with LetsEncrypt (via tls script)..."
        if [[ -z "$email" ]]; then
            log_error "An email address (for LetsEncrypt) is required as the second argument for public hostnames."
            exit 1
        fi
        export BB_USER_EMAIL="$email"
        ./deploy-scripts/wait_for_hostname.sh "$hostname"
        ./deploy-scripts/tls "$hostname"
    fi
    log_info "SSL setup complete."
}

# Installs Node.js via the dedicated script.
install_node() {
    log_info "Installing Node.js v${DEFAULT_NODE_VERSION}..."
    ./deploy-scripts/install_node.sh "$DEFAULT_NODE_VERSION"
    # shellcheck source=/dev/null
    source "${HOME}/.nvm/nvm.sh" || true
}

# --- Main Execution -----------------------------------------------------------
main() {
    # --- Initial Setup ---
    if [[ -n "${BBX_DEBUG-}" ]]; then set -x; fi
    unset npm_config_prefix # Avoid user-level npm config issues

    local hostname="${1-}"
    if [[ -z "$hostname" ]]; then
        log_error "Usage: $0 <hostname> <your_email_for_terms_acceptance>"
        log_error "A hostname (e.g., 'localhost' or 'bbx.example.com') is required."
        exit 1
    fi

    local email="${2-}"

    if [[ -z "$email" ]]; then
        log_error "Usage: $0 <hostname> <your_email_for_terms_acceptance>"
        log_error "An email is required."
        exit 1
    fi

    BBX_EMAIL="${email}"
    BBX_HOSTNAME="${hostname}"

    setup_sudo
    check_license_agreement
    add_local_hostname_to_hosts 

    # --- System Preparation ---
    initialize_package_manager
    install_custom_wrtc_if_needed
    $SUDO ./deploy-scripts/disk_extend.sh
    
    if [[ "$(get_os_type)" == "Linux" ]]; then
      $SUDO "$APT" update && $SUDO "$APT" -y upgrade
      $SUDO "$APT" install -y net-tools dnsutils jq
      open_firewall_ports 80
      open_firewall_ports 443
    elif [[ "$(get_os_type)" == "macOS" ]]; then
        if command -v brew &>/dev/null; then
            if ! command -v jq &>/dev/null; then
              brew install jq
            fi
            if ! brew --prefix gnu-getopt &>/dev/null; then
              brew install gnu-getopt
            fi
            brew unlink gnu-getopt &>/dev/null
            brew link --force gnu-getopt &>/dev/null
        else
            log_warning "Homebrew not found. Skipping optional package installation (jq, gnu-getopt)."
            log_warning "Some features may be limited. To install Homebrew, visit: https://brew.sh"
        fi
    fi

    # --- SSL and Node.js ---
    setup_ssl "$@"
    install_node

    # --- Project Installation ---
    log_info "Preparing project..."

    if [[ -z "${BBX_BINARY_BUILD-}" ]]; then
        log_info "Running full npm installation..."
        if ! npm i; then
            log_warning "Initial 'npm i' failed. Attempting recovery..."
            npm run clean
            if [[ "$(get_os_type)" == "Linux" ]]; then
                $SUDO "$APT" install -y build-essential
            fi
            npm i # Retry
        fi
        log_info "npm install complete."
    else
        log_info "Binary build detected. Skipping npm installations."
        log_info "Running postinstall for external dependencies only..."
        ./scripts/postinstall.sh --external-dependencies-only
    fi

    # Legacy note: Chai document assets used to be copied from the source tree
    # during installs. With the migration to binary-only distribution the
    # browserbox installer now seeds ~/.config/dosyago/bbpro/chai, so the source
    # installer intentionally skips that work.

    # --- Finalization ---
    if [[ -z "${BBX_NO_COPY-}" ]]; then
        log_info "Copying command scripts to system path..."
        local copy_script="./deploy-scripts/cp_commands_only.sh"
        if [[ -z "${BBX_BINARY_BUILD-}" ]]; then
            copy_script="./deploy-scripts/copy_install.sh"
        fi
        "$copy_script" "$(pwd)"
    else
        log_warning "Skipping script copy step due to BBX_NO_COPY."
    fi

    log_info "BrowserBox Pro installation complete!"
}

main "$@"
