#!/usr/bin/env bash
# shellcheck shell=bash

# Strict mode
set -euo pipefail
IFS=$'\n\t'
unset npm_config_prefix

# Avoid optional deps (native modules like lmdb) by default
export NPM_CONFIG_OPTIONAL=false
export NPM_CONFIG_INCLUDE_OPTIONAL=false

if [[ -n "${BBX_DEBUG-}" ]]; then
  set -x
fi

readonly ANSI_RED='\033[0;31m'
readonly ANSI_GREEN='\033[0;32m'
readonly ANSI_YELLOW='\033[1;33m'
readonly ANSI_BLUE='\033[0;34m'
readonly ANSI_NC='\033[0m'
readonly ANSI_BOLD='\033[1m'

# ---- Configuration ----------------------------------------------------------
NODE_VERSION="${BBX_NODE_VERSION:-${DEFAULT_NODE_VERSION:-22}}"
CONFIG_DIR="${HOME}/.config/dosyago/bbpro"
DOCVIEWER_LOG_FILE="${CONFIG_DIR}/docviewer-install-nohup.out"
CUSTOM_WRTC_DIR="${CONFIG_DIR}/build/Release"
GLOBAL_CUSTOM_WRTC_DIR="/usr/local/share/dosyago/build/Release"
docviewer_dir="src/services/pool/chai"

# ---- Global Variables -------------------------------------------------------
# These are set by functions and used by others.
PRODUCTION=""
if [[ -n "${BBX_BINARY_BUILD-}" ]]; then
  PRODUCTION="--omit=dev"
fi
REPLY=""
APT=""
PLAT=""
CUSTOM_WRTC_BUILD_URL=""
CUSTOM_WRTC_BUILD_FILENAME=""
# Use an array for sudo to handle arguments robustly
declare -a SUDO=()

# Helpers for sudo usage
has_sudo() {
    [[ ${#SUDO[@]} -gt 0 ]]
}

run_sudo() {
    if has_sudo; then
        "${SUDO[@]}" "$@"
    else
        "$@"
    fi
}

# ---- Helper Functions -------------------------------------------------------

log_info() {
    printf "${ANSI_BLUE}[INFO] %s${ANSI_NC}\n" "$1" >&2
}

log_warning() {
    printf "${ANSI_YELLOW}[WARN] %s${ANSI_NC}\n" "$1" >&2
}

log_error() {
    printf "${ANSI_RED}[ERROR] %s${ANSI_NC}\n" "$1" >&2
}

# Function to safely read user input, handling interactive and non-interactive sessions.
read_input() {
    local prompt="$1"
    if [[ "$PLAT" != "win"* && -t 0 ]]; then
        read -p "$prompt" -r REPLY
    elif [[ "$PLAT" != "win"* ]]; then
        # Non-interactive, read first char from stdin if available
        read -n 1 -r REPLY || true
    else
        # Default to 'y' on Windows or in non-interactive environments without piped input
        REPLY="y"
    fi
    echo >&2 # for spacing
}

# Ensures the script exits gracefully on Windows-like environments.
guard_windows_and_unsupported() {
    if [[ ! -f "bbpro_dir" ]] && [[ -z "${BBX_BINARY_BUILD-}" ]]; then
        log_error "This script must be run from the BrowserBox project root. Exiting."
        exit 1
    fi

    PLAT="$(node -p "process.platform")"

    if [[ "$PLAT" == "win32" || "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || -n "${WINDIR-}" || "$(uname -s)" =~ ^(MINGW|CYGWIN) || -n "${WSL_DISTRO_NAME-}" ]]; then
        log_info "Detected a Windows-based environment. Exiting bash post-install script."
        exit 0
    fi
}

# Sets up the SUDO variable for privileged commands.
setup_sudo() {
    if command -v sudo &>/dev/null; then
        # Use non-interactive sudo if possible to prevent hanging in scripts.
        if sudo -n true &>/dev/null; then
            SUDO=(sudo -n)
        else
            SUDO=(sudo)
        fi
    else
        SUDO=()
    fi
}

# Configures and installs Node.js using NVM.
setup_node_with_nvm() {
    log_info "Setting up Node.js version ${NODE_VERSION} with NVM..."
    # Source NVM, ignoring errors if it's not found (it might be installed by a later step).
    # shellcheck source=/dev/null
    source "${HOME}/.nvm/nvm.sh" || true
    nvm install "${NODE_VERSION}"
    nvm use "${NODE_VERSION}"
    nvm alias default "${NODE_VERSION}"
}

# Performs a check for the required architecture on macOS.
macos_arch_check() {
    if [[ "$PLAT" == "darwin" && "$(arch)" != "i386" ]]; then
        log_info "Running on non-Rosetta (non-i386) architecture on macOS. Continuing..."
        # Original script had `true` here, preserving behavior.
    fi
}

# Copies a custom binding file required for a specific WebRTC library.
copy_roamhq_binding() {
    local binding_source="./config/roamhq-wrtc-lib-binding.js"
    local binding_dest="./node_modules/@roamhq/wrtc/lib/binding.js"
    if [ -f "$binding_source" ]; then
        log_info "Copying custom @roamhq/wrtc binding file..."
        mkdir -p "$(dirname "$binding_dest")"
        cp "$binding_source" "$binding_dest"
    else
        log_error "Required binding file not found at ${binding_source}."
    fi
}

# Determines the system's package manager and performs initial setup.
initialize_package_manager() {
    log_info "Initializing package manager..."
    if [[ "$PLAT" == "darwin" ]]; then
        APT="$(command -v brew || true)"
    elif command -v apt &>/dev/null; then
        APT="apt"
        # shellcheck source=/dev/null
        source ./deploy-scripts/non-interactive.sh || true
    elif command -v dnf &>/dev/null; then
        APT="dnf"
        if has_sudo; then
            run_sudo dnf config-manager --set-enabled crb || true
            run_sudo dnf -y upgrade --refresh
            run_sudo dnf -y install https://download1.rpmfusion.org/free/el/rpmfusion-free-release-$(rpm -E %rhel).noarch.rpm
            run_sudo dnf -y install https://download1.rpmfusion.org/nonfree/el/rpmfusion-nonfree-release-$(rpm -E %rhel).noarch.rpm
            if command -v firewall-cmd &>/dev/null; then
                run_sudo firewall-cmd --permanent --zone="${ZONE:-public}" --add-service=http
                run_sudo firewall-cmd --permanent --zone="${ZONE:-public}" --add-service=https
                run_sudo firewall-cmd --reload
            fi
        fi
    else
        log_error "No supported package manager (apt, dnf, brew) found. Some features may fail."
        return 1
    fi
    log_info "Using package manager: ${APT}"
}

# Determines if a custom WebRTC build is needed for the current Linux distro.
fetch_custom_wrtc_build_if_applicable() {
    if [[ "$PLAT" != "linux" ]]; then
        return
    fi

    # shellcheck source=/etc/os-release
    source /etc/os-release || true
    local base_url="https://github.com/dosyago/node-webrtc/releases/download/v1.0.0"

    case "${ID-}" in
        debian)
            if [[ "${VERSION_ID-}" == "11" ]]; then
                CUSTOM_WRTC_BUILD_FILENAME="debian-11-wrtc.node"
            fi
            ;;
        almalinux)
            if [[ "${VERSION_ID-}" == 8* ]]; then
                CUSTOM_WRTC_BUILD_FILENAME="almalinux-8-wrtc.node"
            fi
            ;;
        centos | rhel)
            if [[ "${VERSION_ID-}" == 8* ]]; then
                CUSTOM_WRTC_BUILD_FILENAME="centos-8-wrtc.node"
            else
                CUSTOM_WRTC_BUILD_FILENAME="centos-9-wrtc.node"
            fi
            ;;
    esac

    if [ -n "$CUSTOM_WRTC_BUILD_FILENAME" ]; then
        CUSTOM_WRTC_BUILD_URL="${base_url}/${CUSTOM_WRTC_BUILD_FILENAME}"
        log_info "Custom WebRTC build needed for this OS: ${CUSTOM_WRTC_BUILD_FILENAME}"
        if has_sudo && [ -n "$APT" ]; then
             run_sudo "$APT" install -y wget tar
        fi
        log_info "Downloading from ${CUSTOM_WRTC_BUILD_URL}..."
        wget -q -O "$CUSTOM_WRTC_BUILD_FILENAME" "$CUSTOM_WRTC_BUILD_URL"
    fi
}

# Installs the downloaded custom WebRTC build, if it exists.
try_install_custom_wrtc_build_if_needed() {
    if [ -f "$CUSTOM_WRTC_BUILD_FILENAME" ]; then
        log_info "Installing custom WebRTC build..."
        mkdir -p "$CUSTOM_WRTC_DIR"
        chmod +x "$CUSTOM_WRTC_BUILD_FILENAME"
        mv "$CUSTOM_WRTC_BUILD_FILENAME" "${CUSTOM_WRTC_DIR}/wrtc.node"

        if has_sudo; then
            run_sudo mkdir -p "$GLOBAL_CUSTOM_WRTC_DIR"
            run_sudo cp "${CUSTOM_WRTC_DIR}/wrtc.node" "${GLOBAL_CUSTOM_WRTC_DIR}/"
        fi
    else
        log_info "No custom WebRTC build to install. Assuming default works."
    fi
}

# Asks user and runs the machine-wide setup script if confirmed.
run_setup_machine_if_desired() {
    if [[ "$PLAT" == "win"* ]]; then
        return
    fi

    # Preserving original behavior of an unconditional "Enter to continue"
    read -p "Enter to continue" -r || true
    REPLY=""

    read_input "Want to run setup_machine script? (first-time install or major update) [y/N]: "
    if [[ "$REPLY" =~ ^[Yy] ]]; then
        log_info "Running full machine setup..."
        bash ./scripts/setup_machine.sh
    else
        log_info "Skipping machine setup. Proceeding with npm installs..."
    fi
}

# Installs npm dependencies for all sub-projects.
install_project_packages() {
    log_info "Installing all project npm dependencies..."

    local sub_projects=(
        "src/zombie-lord"
        "src/public/voodoo"
        "src/zombie-lord/custom-launcher"
        "src/services/instance/parec-server"
        "src/services/pool/crdp-secure-proxy-server"
        "$docviewer_dir"
    )

    for project_dir in "${sub_projects[@]}"; do
        log_info "--- Installing for ${project_dir} ---"
        (
            cd "$project_dir"
            npm i $PRODUCTION --omit=optional --no-optional
            npm dedupe || true
            npm audit fix --omit=optional || true # --force to handle complex cases
        )
    done
}

# Asks user and optionally installs the secure document viewer and its dependencies.
install_doc_viewer_if_desired() {
  if [[ "$PLAT" == "win"* ]]; then
      log_info "Chai Secure DocViewer Service not currently supported on Windows..."
      return
  fi

  cwd="$(pwd)"
  cd "$docviewer_dir"
  local yes_docs="false"
  if [[ "${IS_DOCKER_BUILD-}" == "true" ]] && [[ "$(echo "${INSTALL_DOC_VIEWER-}" | tr '[:upper:]' '[:lower:]')" == "true" ]]; then
      yes_docs="true"
  elif [[ "$(echo "${INSTALL_DOC_VIEWER-}" | tr '[:upper:]' '[:lower:]')" == "false" ]]; then
      yes_docs="false"
  else
      read_input "Add secure document viewer for PDFs, DOCX, etc.? (lengthy install) [y/N]: "
      if [[ "$REPLY" =~ ^[Yy] ]]; then
          yes_docs="true"
      fi
  fi

  if [[ "$yes_docs" == "true" ]]; then
      log_info "Installing OS dependencies for secure document viewer in the background..."
      mkdir -p "$(dirname "$DOCVIEWER_LOG_FILE")"
      if [[ "${IS_DOCKER_BUILD-}" == "true" ]]; then
          (yes | ./scripts/setup_docviewer.sh) > "$DOCVIEWER_LOG_FILE" 2>&1
      elif command -v nohup &>/dev/null; then
          nohup bash -c 'yes | ./scripts/setup_docviewer.sh' > "$DOCVIEWER_LOG_FILE" 2>&1 &
      else
          bash -c 'yes | ./scripts/setup_docviewer.sh' > "$DOCVIEWER_LOG_FILE" 2>&1 &
      fi
      log_info "Installation started in the background. Monitor progress with: tail -f ${DOCVIEWER_LOG_FILE}"
  else
      log_info "Skipping optional document viewer installation."
  fi

  cd "$cwd"
}

# Installs Ruffle (Flash emulator) if the configuration requires it.
try_install_ruffle_if_requested() {
    if [[ -n "${BBX_BINARY_BUILD-}" ]]; then
      echo "Deferring to binary build for Flash emulator."
      return 0
    fi

    log_info "Checking if Ruffle (Flash Player emulator) is needed..."
    if [[ "$(node ./src/show_useflash.js)" != "false" ]]; then
        log_info "Ruffle is required. Installing dependencies and downloading..."
        if ! command -v jq &>/dev/null && has_sudo && [ -n "$APT" ]; then
            "${SUDO[@]}" "$APT" install -y jq
        fi
        ./scripts/download_ruffle.sh
    else
        log_info "Ruffle not required by config."
    fi
}

# ---- Main Execution ---------------------------------------------------------
main() {
    local EXTERNAL_ONLY=false
    if [[ "${1-}" == "--external-dependencies-only" ]]; then
        EXTERNAL_ONLY=true
        log_info "Running in --external-dependencies-only mode. Skipping all npm package installations."
    fi

    guard_windows_and_unsupported
    setup_sudo

    initialize_package_manager
    fetch_custom_wrtc_build_if_applicable
    try_install_custom_wrtc_build_if_needed

    setup_node_with_nvm
    
    macos_arch_check
    run_setup_machine_if_desired
    install_doc_viewer_if_desired

    # The 'jq' dependency is handled within try_install_ruffle_if_requested
    try_install_ruffle_if_requested


    if [[ "$EXTERNAL_ONLY" == "true" ]]; then
        log_info "External dependency setup complete. Exiting."
        exit 0
    fi

    # --- Full Installation (if not --external-dependencies-only) ---
    
    log_info "Installing main project dependencies..."

    copy_roamhq_binding
    install_project_packages

    log_info "Finalizing dependencies..."
    npm i --save-exact esbuild@latest
    npm audit fix --omit=optional || true

    echo "$(date)" > .bbpro_install_dir
    log_info "BrowserBox post-installation script complete."
    exit 0
}

main "$@"
