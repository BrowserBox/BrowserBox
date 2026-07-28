#!/usr/bin/env bash
# -*- coding: utf-8 -*-
##########################################################
#  ____                                  ____
# | __ ) _ __ _____      _____  ___ _ __| __ )  _____  __
# |  _ \| '__/ _ \ \ /\ / / __|/ _ \ '__|  _ \ / _ \ \/ /
# | |_) | | | (_) \ V  V /\__ \  __/ |  | |_) | (_) >  <
# |____/|_|  \___/ \_/\_/ |___/\___|_|  |____/ \___/_/\_\
# 
##########################################################

is_debug_enabled() {
  case "$(printf '%s' "${BBX_DEBUG:-}" | tr '[:upper:]' '[:lower:]')" in
    1|true|yes|y|on|debug) return 0 ;;
    *) return 1 ;;
  esac
}

if is_debug_enabled; then
  export BBX_DEBUG
  set -x
fi

# Preserve BBX_MINIMAL_MODE from the caller environment across script chains.
if [[ -n "${BBX_MINIMAL_MODE+x}" ]]; then
  export BBX_MINIMAL_MODE
fi

# BBX_BROWSER_PATH: friendly alias for CHROME_PATH covering any Chrome-type
# browser (Chrome, Chromium, Brave, Edge, …). Normalized here once so every
# CHROME_PATH check downstream — has_browser_dep, _has_chrome, the Node
# launcher's chrome-finder — honors it unchanged. Explicit CHROME_PATH wins.
if [[ -n "${BBX_BROWSER_PATH:-}" && -z "${CHROME_PATH:-}" ]]; then
  export CHROME_PATH="${BBX_BROWSER_PATH}"
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

# ASCII Banner
banner() {
    printf "${banner_color}${BOLD}"
    cat << 'EOF'
  
   ███████████                                                                ███████████
  ░░███░░░░░███                                                              ░░███░░░░░███
   ░███    ░███ ████████   ██████  █████ ███ █████  █████   ██████  ████████  ░███    ░███  ██████  █████ █████
   ░██████████ ░░███░░███ ███░░███░░███ ░███░░███  ███░░   ███░░███░░███░░███ ░██████████  ███░░███░░███ ░░███
   ░███░░░░░███ ░███ ░░░ ░███ ░███ ░███ ░███ ░███ ░░█████ ░███████  ░███ ░░░  ░███░░░░░███░███ ░███ ░░░█████░
   ░███    ░███ ░███     ░███ ░███ ░░███████████   ░░░░███░███░░░   ░███      ░███    ░███░███ ░███  ███░░░███
   ███████████  █████    ░░██████   ░░████░████    ██████ ░░██████  █████     ███████████ ░░██████  █████ █████
  ░░░░░░░░░░░  ░░░░░      ░░░░░░     ░░░░ ░░░░    ░░░░░░   ░░░░░░  ░░░░░     ░░░░░░░░░░░   ░░░░░░  ░░░░░ ░░░░░
  
EOF
    printf "${NC}\n"
}

# Prefer GH_TOKEN if provided; fall back to GITHUB_TOKEN so private/internal
# releases can be accessed without extra env juggling.
if [[ -z "${GH_TOKEN:-}" && -n "${GITHUB_TOKEN:-}" ]]; then
  GH_TOKEN="$GITHUB_TOKEN"
fi

# Function to find Tor control auth cookie across different platforms
find_tor_cookie() {
  # Ordered by priority: Homebrew > system > user home.
  # Tor Browser is deliberately excluded — it runs a separate tor
  # instance (ports 9150/9151) that does not serve our hidden services.
  local cookie_locations=(
    # macOS Homebrew (ARM)
    "/opt/homebrew/var/lib/tor/control_auth_cookie"
    # macOS Homebrew (Intel)
    "/usr/local/var/lib/tor/control_auth_cookie"
    # Linux systemd
    "/run/tor/control.authcookie"
    # Linux Debian/Ubuntu standard
    "/var/lib/tor/control_auth_cookie"
    # Linux manual/alternate
    "/var/run/tor/control.authcookie"
    # User home directory
    "${HOME}/.tor/control_auth_cookie"
  )

  for cookie in "${cookie_locations[@]}"; do
    if [[ -r "$cookie" ]]; then
      echo "$cookie"
      return 0
    fi
    # Try with sudo if not readable
    if ${SUDO:-sudo} test -r "$cookie" 2>/dev/null; then
      echo "$cookie"
      return 0
    fi
  done

  # Return empty if not found
  return 1
}

# Returns the Tor SOCKS proxy URL (socks5h://127.0.0.1:<port>).
# Reads SocksPort from known torrc locations; defaults to 9050.
_bbx_tor_socks_url() {
  local socks_port=9050
  local torrc=""
  for _f in /opt/homebrew/etc/tor/torrc /usr/local/etc/tor/torrc /etc/tor/torrc "${HOME}/.tor/torrc"; do
    if [[ -f "$_f" ]]; then torrc="$_f"; break; fi
  done
  if [[ -n "$torrc" ]]; then
    local _p
    _p=$(grep "^SocksPort" "$torrc" 2>/dev/null | awk '{print $2}' | head -1)
    [[ "$_p" =~ ^[0-9]+$ ]] && socks_port="$_p"
  fi
  echo "socks5h://127.0.0.1:${socks_port}"
}

_bbx_sed_inplace() {
  local expr="$1"
  local file="$2"
  if [[ "$(uname -s)" == "Darwin" ]]; then
    sed -i '' -e "$expr" "$file"
  else
    sed -i -e "$expr" "$file"
  fi
}


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

# ====================================================================
# BINARY DISTRIBUTION SUPPORT
# Functions for downloading and managing pre-compiled BrowserBox binaries
# ====================================================================

# Configuration
PUBLIC_REPO="${BBX_RELEASE_REPO:-BrowserBox/BrowserBox}"
BINARY_NAME="browserbox"
GLOBAL_BIN_DIR="/usr/local/bin"
SUDO_BIN="$(command -v sudo || true)"

# Prefer global install; require writable /usr/local/bin (or sudo)
if [[ -w "$GLOBAL_BIN_DIR" ]]; then
  BINARY_DIR="$GLOBAL_BIN_DIR"
  INSTALL_CMD="install -m 755"
  mkdir -p "$BINARY_DIR"
else
  if [[ -n "$SUDO_BIN" ]]; then
    BINARY_DIR="$GLOBAL_BIN_DIR"
    INSTALL_CMD="$SUDO_BIN install -m 755"
    "$SUDO_BIN" mkdir -p "$BINARY_DIR"
  else
    echo -e "${RED}Cannot install to $GLOBAL_BIN_DIR (not writable and sudo unavailable).${NC}" >&2
    echo "BrowserBox requires a global install; please run with sudo or make $GLOBAL_BIN_DIR writable." >&2
    exit 1
  fi
fi

BINARY_PATH="${BINARY_DIR}/${BINARY_NAME}"

# Function to detect OS and architecture
detect_platform() {
  case "$(uname -s)" in
    Linux*) echo "linux" ;;
    Darwin*) echo "macos" ;;
    *)
      echo -e "${RED}Unsupported OS: $(uname -s)${NC}" >&2
      echo "This installer only supports Linux and macOS." >&2
      echo "For Windows, use: irm dosaygo.com/browserbox | iex" >&2
      exit 1
      ;;
  esac
}

# Function to get the latest release tag from GitHub
get_latest_release() {
  # Skip API call if BBX_NO_UPDATE is set; if caller passed BBX_RELEASE_TAG, use it.
  if [[ -n "$BBX_NO_UPDATE" ]]; then
    if [[ -n "${BBX_RELEASE_TAG:-}" ]]; then
      echo "$BBX_RELEASE_TAG"
      return 0
    fi
    echo "unknown"
    return 1
  fi

  local repo="$1"
  local tag=""
  if [[ "$repo" != "BrowserBox/BrowserBox" && -z "${GH_TOKEN:-}" ]]; then
    echo -e "${RED}A token (GH_TOKEN or GITHUB_TOKEN) is required to read releases from private/internal repo ${repo}.${NC}" >&2
    exit 1
  fi

  mkdir -p "$BB_CONFIG_DIR"
  local cache_file="${BB_CONFIG_DIR}/latest_release_${repo//\//_}.cache"
  local now ts cached
  now="$(date +%s)"
  if [[ -f "$cache_file" ]]; then
    read -r ts cached <"$cache_file" || true
    if [[ -n "$ts" && -n "$cached" ]] && (( now - ts < 3600 )); then
      echo "$cached"
      return 0
    fi
  fi

  # Try using curl with GitHub API
  if command -v curl >/dev/null 2>&1; then
    local api_url="https://api.github.com/repos/${repo}/releases/latest"
    local curl_auth=()
    if [[ -n "${GH_TOKEN:-}" ]]; then
      curl_auth=(-H "Authorization: Bearer ${GH_TOKEN}")
    fi
    local response
    response=$(curl -sS --connect-timeout 10 "${curl_auth[@]}" "$api_url" 2>/dev/null || echo "")
    
    if [[ -n "$response" ]]; then
      # Try jq first
      if command -v jq >/dev/null 2>&1; then
        tag=$(echo "$response" | jq -r '.tag_name // empty' 2>/dev/null)
      else
        # Fallback to sed
        tag=$(echo "$response" | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]\+\)".*/\1/p' | head -n1)
      fi
    fi
  fi
  
  if [[ -z "$tag" ]]; then
    echo -e "${RED}Failed to fetch latest release from ${repo}${NC}" >&2
    exit 1
  fi

  printf '%s %s\n' "$now" "$tag" >"$cache_file" || true
  
  echo "$tag"
}

# Function to download the binary
# Returns the path to the downloaded executable on stdout
# All progress/logs go to stderr
download_binary() {
  local platform="$1"
  local tag="$2"
  local asset_name
  case "$platform" in
    macos) asset_name="browserbox-macos-arm64" ;;
    linux) asset_name="browserbox-linux-x64" ;;
    *) echo -e "${RED}Unsupported platform: $platform${NC}" >&2; exit 1 ;;
  esac
  
  local temp_file
  temp_file="$(mktemp "${TMPDIR:-/tmp}/browserbox.XXXX")"
  
  # Log to stderr >&2 so it is NOT captured by the caller
  echo -e "${CYAN}Downloading BrowserBox ${tag} for ${platform}...${NC}" >&2
  
  if ! command -v curl >/dev/null 2>&1; then
    echo -e "${RED}Error: curl is required but not installed.${NC}" >&2
    exit 1
  fi
  
  local curl_auth=()
  if [[ -n "${GH_TOKEN:-}" ]]; then
    curl_auth=(-H "Authorization: Bearer ${GH_TOKEN}")
  fi

  # 1. HANDLE PRIVATE / INTERNAL RELEASES
  if [[ -n "${GH_TOKEN:-}" || "$PUBLIC_REPO" != "BrowserBox/BrowserBox" ]]; then
    local release_json asset_id api_download_url
    if [[ -z "${GH_TOKEN:-}" ]]; then
      echo -e "${RED}GH_TOKEN is required for private repo ${PUBLIC_REPO}${NC}" >&2
      exit 1
    fi

    # Fetch metadata (Silent -sS, errors go to stderr)
    release_json=$(curl -sS --fail -H "Authorization: Bearer ${GH_TOKEN}" "https://api.github.com/repos/${PUBLIC_REPO}/releases/tags/${tag}") || {
      echo -e "${RED}Failed to fetch release metadata for ${tag}${NC}" >&2
      exit 1
    }

    # Parse Asset ID
    if command -v jq >/dev/null 2>&1; then
      asset_id=$(printf '%s' "$release_json" | jq -r --arg name "$asset_name" '.assets[] | select(.name==$name) | .id' | head -n1)
    else
      asset_id=$(printf '%s\n' "$release_json" | awk -v name="$asset_name" '
        BEGIN{RS="{";FS=","}
        {
          has=0;id=""
          for(i=1;i<=NF;i++){
            if($i ~ "\"name\"" && $i ~ name){has=1}
            if($i ~ "\"id\""){gsub(/[^0-9]/,"",$i); id=$i}
          }
          if(has && id!=""){print id; exit}
        }')
    fi

    if [[ -z "$asset_id" ]]; then
      echo -e "${RED}Asset ${asset_name} not found on release ${tag}${NC}" >&2
      exit 1
    fi

    api_download_url="https://api.github.com/repos/${PUBLIC_REPO}/releases/assets/${asset_id}"
    
    # DOWNLOAD PRIVATE BINARY
    # IMPORTANT: --progress-bar writes to stderr by default.
    # Do NOT use 2>&1 here, or the bar will be captured.
    if ! curl -L --fail --progress-bar --connect-timeout 60 \
        -H "Authorization: Bearer ${GH_TOKEN}" \
        -H "Accept: application/octet-stream" \
        -o "$temp_file" "$api_download_url"; then
      echo -e "${RED}Failed to download binary via asset API${NC}" >&2
      rm -f "$temp_file"
      exit 1
    fi

  else
    # 2. HANDLE PUBLIC RELEASES
    local download_url="https://github.com/${PUBLIC_REPO}/releases/download/${tag}/${asset_name}"
    
    # DOWNLOAD PUBLIC BINARY
    # Do NOT use 2>&1.
    if ! curl -L --fail --progress-bar --connect-timeout 60 "${curl_auth[@]}" -o "$temp_file" "$download_url"; then
      echo -e "${RED}Failed to download binary from ${download_url}${NC}" >&2
      echo -e "${YELLOW}Possible causes: No release asset, network issue, or bad tag.${NC}" >&2
      rm -f "$temp_file"
      exit 1
    fi
  fi
  
  if [[ ! -s "$temp_file" ]]; then
    echo -e "${RED}Downloaded file is empty${NC}" >&2
    rm -f "$temp_file"
    exit 1
  fi

  chmod +x "$temp_file"
  
  # ONLY this goes to stdout
  echo "$temp_file"
}

# Function to check if binary exists and is executable
binary_exists() {
  [[ -f "$BINARY_PATH" ]] && [[ -x "$BINARY_PATH" ]]
}

extract_semver() {
  local text="$1" line
  while IFS= read -r line; do
    if [[ "$line" =~ ([vV]?[0-9]+(\.[0-9]+){1,2}(-[0-9A-Za-z\.-]+)?) ]]; then
      echo "${BASH_REMATCH[1]}"
      return 0
    fi
  done <<< "$text"
  return 1
}

# Function to get current binary version
get_binary_version() {
  if binary_exists; then
    local output
    output="$("$BINARY_PATH" --version 2>/dev/null || true)"
    if extract_semver "$output"; then
      return 0
    fi
    echo "unknown"
  else
    echo "not_installed"
  fi
}

# Semver helpers from legacy installer (stable > rc; explicit patch tie-break)
_parse_tag() {
  local s="$1" core pre a b c rcnum
  PAR_MAJ=0 PAR_MIN=0 PAR_PAT=0 PAR_STABLE=1 PAR_RCNUM=0
  PAR_HASPATCH=0

  [[ ${s:0:1} == "v" ]] && s="${s:1}"

  core="${s%%-*}"
  if [[ "$core" == "$s" ]]; then pre=""; else pre="${s#"$core"-}"; fi

  IFS='.' read -r a b c <<<"$core"

  [[ "$a" =~ ^[0-9]+$ ]] || return 1
  [[ "$b" =~ ^[0-9]+$ ]] || return 1
  if [[ -z "$c" ]]; then
    PAR_HASPATCH=0
    PAR_PAT=0
  else
    [[ "$c" =~ ^[0-9]+$ ]] || return 1
    PAR_HASPATCH=1
    PAR_PAT=$c
  fi

  PAR_MAJ=$a
  PAR_MIN=$b

  if [[ -n "$pre" ]]; then
    if [[ "$pre" == rc ]]; then
      PAR_STABLE=0; PAR_RCNUM=0
    elif [[ "$pre" == rc.* ]]; then
      rcnum="${pre#rc.}"
      [[ "$rcnum" =~ ^[0-9]+$ ]] || return 1
      PAR_STABLE=0; PAR_RCNUM=$rcnum
    else
      return 1
    fi
  fi
  return 0
}

_better_than() {
  local cMaj=$1 cMin=$2 cPat=$3 cSt=$4 cRc=$5 cHP=$6
  local bMaj=$7 bMin=$8 bPat=$9 bSt=${10} bRc=${11} bHP=${12}

  if   (( cMaj > bMaj )); then return 0
  elif (( cMaj < bMaj )); then return 1; fi
  if   (( cMin > bMin )); then return 0
  elif (( cMin < bMin )); then return 1; fi
  if   (( cPat > bPat )); then return 0
  elif (( cPat < bPat )); then return 1; fi

  if (( cSt != bSt )); then
    (( cSt > bSt )) && return 0 || return 1
  fi

  if (( cSt == 0 )); then
    if   (( cRc > bRc )); then return 0
    elif (( cRc < bRc )); then return 1; fi
  fi

  if (( cHP != bHP )); then
    (( cHP > bHP )) && return 0 || return 1
  fi

  return 1
}

version_is_newer() {
  local candidate="$1" baseline="$2"
  _parse_tag "$candidate" || return 1
  local cMaj=$PAR_MAJ cMin=$PAR_MIN cPat=$PAR_PAT cSt=$PAR_STABLE cRc=$PAR_RCNUM cHP=$PAR_HASPATCH
  _parse_tag "$baseline" || return 1
  local bMaj=$PAR_MAJ bMin=$PAR_MIN bPat=$PAR_PAT bSt=$PAR_STABLE bRc=$PAR_RCNUM bHP=$PAR_HASPATCH
  _better_than "$cMaj" "$cMin" "$cPat" "$cSt" "$cRc" "$cHP" "$bMaj" "$bMin" "$bPat" "$bSt" "$bRc" "$bHP"
}



# Call the function right away
protecc_win_sysadmins

ensure_modern_bash() {
  : "${MIN_BASH_MAJOR:=5}"

  # Only run this bootstrap on macOS (Darwin)
  case "$(uname -s)" in
    Darwin) ;;  # proceed
    *) return 0 ;;  # not macOS, skip entirely
  esac

  # If we're not in bash at all, try to exec the best bash we have first.
  if [ -z "${BASH_VERSION:-}" ]; then
    for b in /opt/homebrew/bin/bash /usr/local/bin/bash /bin/bash; do
      [ -x "$b" ] && exec "$b" "$0" "$@"
    done
  fi

  # Avoid infinite loops
  if [ -n "${__ENSURE_BASH_REEXECED:-}" ]; then
    return 0
  fi

  # Version check
  if [ -n "${BASH_VERSINFO:-}" ] && [ "${BASH_VERSINFO[0]}" -ge "$MIN_BASH_MAJOR" ]; then
    return 0
  fi

  _log() { printf '[ensure-bash] %s\n' "$*" >&2; }

  _find_new_bash() {
    if command -v brew >/dev/null 2>&1; then
      local p
      p="$(brew --prefix 2>/dev/null || true)"
      [ -n "$p" ] && [ -x "$p/bin/bash" ] && { printf '%s/bin/bash\n' "$p"; return 0; }
    fi
    for b in /opt/homebrew/bin/bash /usr/local/bin/bash; do
      [ -x "$b" ] && { printf '%s\n' "$b"; return 0; }
    done
    return 1
  }

  _install_brew_if_needed() {
    if command -v brew >/dev/null 2>&1; then
      return 0
    fi
    _log "Homebrew not found; installing non-interactively…"
    NONINTERACTIVE=1 CI=1 /bin/bash -c \
      "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || {
      _log "Homebrew install failed."
      return 1
    }
    if [ -x /opt/homebrew/bin/brew ]; then
      eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [ -x /usr/local/bin/brew ]; then
      eval "$(/usr/local/bin/brew shellenv)"
    fi
    command -v brew >/dev/null 2>&1
  }

  _install_bash_if_needed() {
    if _find_new_bash >/dev/null 2>&1; then
      return 0
    fi
    _log "Installing modern Bash with Homebrew…"
    brew list bash >/dev/null 2>&1 || brew install bash || return 1
    return 0
  }

  _log "Current bash: ${BASH_VERSION:-unknown}; upgrading to Bash >= ${MIN_BASH_MAJOR}…"

  _install_brew_if_needed || { _log "Cannot proceed without Homebrew."; exit 1; }
  _install_bash_if_needed || { _log "Installing bash failed."; exit 1; }

  newbash="$(_find_new_bash)" || { _log "New bash not found after install."; exit 1; }

  __ENSURE_BASH_REEXECED=1 exec "$newbash" "$0" "$@"
}

# Call the guard immediately
# We don't need modern bash
# ensure_modern_bash "$@"


# Sudo check - respect BBX_SUDOLESS for Docker/Cloud Run environments
if [[ "${BBX_SUDOLESS:-false}" == "true" ]]; then
  SUDO=""
else
  SUDO=$(command -v sudo >/dev/null && echo "sudo -n" || echo "")
  if ([ "$EUID" -ne 0 ] && ! $SUDO true 2>/dev/null); then
      banner
      printf "${RED}Warning: ${NC}${BOLD}bbx${NC}${RED} is easier to use with passwordless sudo, and may misfunction without it.${NC}\n\tEdit /etc/sudoers with visudo to enable.\n"
      exit 1
  fi
fi

# --for <target_user>: cross-cutting principal-switching support.
# Allows a privileged operator to run BBX commands on behalf of an
# unprivileged target runtime user. The operator supplies privilege
# for system-level work; the target user owns runtime state and processes.
BBX_FOR_USER=""
BBX_OPERATOR_USER=""

_bbx_for_active() { [[ -n "$BBX_FOR_USER" ]]; }

# Extract --for <user> from positional args before command dispatch.
_bbx_new_args=()
while (( $# )); do
  if [[ "$1" == "--for" ]]; then
    if [[ -z "${2:-}" ]]; then
      printf "${RED}Error: --for requires a username argument${NC}\n"
      exit 1
    fi
    BBX_FOR_USER="$2"
    shift 2
  elif [[ "$1" == --for=* ]]; then
    BBX_FOR_USER="${1#--for=}"
    if [[ -z "$BBX_FOR_USER" ]]; then
      printf "${RED}Error: --for requires a username argument${NC}\n"
      exit 1
    fi
    shift
  else
    _bbx_new_args+=("$1")
    shift
  fi
done
set -- "${_bbx_new_args[@]}"
unset _bbx_new_args

if _bbx_for_active; then
  BBX_OPERATOR_USER="$(id -un)"

  # --for is incompatible with sudoless mode
  if [[ "${BBX_SUDOLESS:-false}" == "true" ]]; then
    printf "${RED}Error: --for requires sudo and is incompatible with BBX_SUDOLESS=true.${NC}\n"
    exit 1
  fi

  # Target user must exist
  if ! id "$BBX_FOR_USER" >/dev/null 2>&1; then
    printf "${RED}Error: --for target user '%s' does not exist.${NC}\n" "$BBX_FOR_USER"
    printf "  Create the user first, then retry.\n"
    exit 1
  fi

  # Operator must not be root (use a non-root account with sudo)
  if [[ "$(id -u)" -eq 0 ]]; then
    printf "${RED}Error: --for must be invoked from a non-root operator account with passwordless sudo.${NC}\n"
    exit 1
  fi

  # Operator must have passwordless sudo
  if ! sudo -n true 2>/dev/null; then
    printf "${RED}Error: --for requires the operator (%s) to have passwordless sudo.${NC}\n" "$BBX_OPERATOR_USER"
    printf "  Edit /etc/sudoers with visudo to enable.\n"
    exit 1
  fi

  # Operator and target must be different users
  if [[ "$BBX_FOR_USER" == "$BBX_OPERATOR_USER" ]]; then
    printf "${YELLOW}Warning: --for target is the same as the operator. Running normally.${NC}\n"
    BBX_FOR_USER=""
    BBX_OPERATOR_USER=""
  else
    printf "${CYAN}[--for %s] Operating on behalf of target user (operator: %s)${NC}\n" "$BBX_FOR_USER" "$BBX_OPERATOR_USER"
  fi
fi

# env
export BBX_DONT_KILL_CHROME_ON_STOP="${BBX_DONT_KILL_CHROME_ON_STOP-true}"
export BBX_REQUIRE_RELEASE=1

# Map BBX_SSLCERTS_DIR to SSLCERTS_DIR for setup_nginx, tls, and Node runtime
if [[ -n "${BBX_SSLCERTS_DIR:-}" ]]; then
  export SSLCERTS_DIR="${BBX_SSLCERTS_DIR}"
fi
BBX_CALLER_DOMAIN="${DOMAIN:-}"
export BBX_CALLER_DOMAIN

# Default paths
BBX_HOME="${HOME}/.bbx"
BBX_NEW_DIR="${BBX_HOME}/new"
COMMAND_DIR=""
REPO_URL="https://github.com/BrowserBox/BrowserBox-source"
owner_repo="${REPO_URL#https://github.com/}"
BBX_SHARE="/usr/local/share/dosaygo"
if [[ ":$PATH:" == *":/usr/local/bin:"* ]] && $SUDO test -w /usr/local/bin; then
  COMMAND_DIR="/usr/local/bin"
elif $SUDO test -w /usr/bin; then
  COMMAND_DIR="/usr/bin"
else
  COMMAND_DIR="$HOME/.local/bin"
  mkdir -p "$COMMAND_DIR"
  printf "${YELLOW}WARNING: BrowserBox command directory set to use local direcotry \""$COMMAND_DIR"\". This will likely produce errors, especially for updates. Ensure you can write to a global executable direcotry to install the binaries.${NC}\n" >&2
fi
BBX_BIN="${COMMAND_DIR}/bbx"

# Config file (secondary to test.env and login.link)
BB_CONFIG_DIR="${HOME}/.config/dosaygo/bbpro"
CONFIG_FILE="${BB_CONFIG_DIR}/config"
CERT_META_FILE="${BB_CONFIG_DIR}/tickets/cert.meta.env"
[ ! -d "$BB_CONFIG_DIR" ] && mkdir -p "$BB_CONFIG_DIR"

# Docker containers file — commented out, not removed. Docker support may be re-enabled.
# DOCKER_CONTAINERS_FILE="$BB_CONFIG_DIR/docker_containers.json"
# [ ! -f "$DOCKER_CONTAINERS_FILE" ] && echo "{}" > "$DOCKER_CONTAINERS_FILE"

# Cloudflare tunnel PID file for background mode tracking
CF_PID_FILE="${BB_CONFIG_DIR}/cloudflared.pid"

# Sentinel file: prevents dying services from spawning a redundant `bbx stop`.
# Written by stop() before stop_bbpro; checked by branch-bbx-stop.js.
STOP_SENTINEL="${BB_CONFIG_DIR}/.stop-in-progress"

# Kill any existing Cloudflare tunnel started by bbx
kill_cf_tunnel() {
  local quiet="${1:-}"
  if [[ -f "$CF_PID_FILE" ]]; then
    local cf_pid
    cf_pid="$(cat "$CF_PID_FILE" 2>/dev/null)"
    if [[ -n "$cf_pid" ]] && kill -0 "$cf_pid" 2>/dev/null; then
      [[ "$quiet" != "quiet" ]] && printf "${YELLOW}Stopping existing Cloudflare tunnel (PID: $cf_pid)...${NC}\n"
      kill "$cf_pid" 2>/dev/null || true
      # Wait up to 5 seconds for graceful shutdown
      local wait_count=0
      while kill -0 "$cf_pid" 2>/dev/null && [[ $wait_count -lt 10 ]]; do
        sleep 0.5
        wait_count=$((wait_count + 1))
      done
      # Force kill if still running
      if kill -0 "$cf_pid" 2>/dev/null; then
        kill -9 "$cf_pid" 2>/dev/null || true
      fi
      [[ "$quiet" != "quiet" ]] && printf "${GREEN}Cloudflare tunnel stopped.${NC}\n"
    fi
    rm -f "$CF_PID_FILE"
  fi
  # Also kill any orphan cloudflared quick-tunnel processes started by this user
  pkill -u "$(id -u)" -f "cloudflared.*tunnel.*--url" 2>/dev/null || true
}

# Version tracking and update lock files
# Note: VERSION_FILE and PREPARED_VERSION_FILE are deprecated in binary-based installation
# Version info is now obtained from `browserbox --version` command via get_canonical_bbx_version()
LOG_FILE="${BB_CONFIG_DIR}/update.log"
PREPARING_FILE="${BBX_SHARE}/preparing"
PREPARED_FILE="${BBX_SHARE}/prepared"

# Legacy note: Chai static assets used to be synchronized from a local source tree
# here. As part of the migration away from source-based installs, that logic now
# lives solely inside the binary `browserbox --install/--full-install` flow.

# Clean up any leftover temp installer scripts
clean_temp_installers() {
  local TMPDIR="$HOME/.cache/myscript-installer"
  find "$TMPDIR" -type f -name 'installer-*' -exec rm -f {} \; 2>/dev/null
}

# Ensure installation_id exists with a UUID
ensure_installation_id() {
  local INSTALL_ID_DIR="${HOME}/.config/dosaygo/bbpro"
  local INSTALL_ID_FILE="${INSTALL_ID_DIR}/installation_id"
  
  # Create directory if it doesn't exist with owner-only permissions
  if [ ! -d "$INSTALL_ID_DIR" ]; then
    mkdir -p "$INSTALL_ID_DIR" 2>/dev/null || {
      [[ -n "$BBX_DEBUG" ]] && echo "Warning: Could not create $INSTALL_ID_DIR (may be read-only)"
      return 0
    }
    chmod 700 "$INSTALL_ID_DIR" 2>/dev/null || true
  fi
  
  # Create installation_id file if it doesn't exist
  if [ ! -f "$INSTALL_ID_FILE" ]; then
    local uuid=""
    
    # Try various methods to generate a UUID
    if command -v uuidgen >/dev/null 2>&1; then
      uuid=$(uuidgen 2>/dev/null)
    elif command -v browserbox >/dev/null 2>&1; then
      uuid=$(browserbox uuid 2>/dev/null)
    elif command -v python3 >/dev/null 2>&1; then
      uuid=$(python3 -c "import uuid; print(uuid.uuid4())" 2>/dev/null)
    elif command -v python >/dev/null 2>&1; then
      uuid=$(python -c "import uuid; print(uuid.uuid4())" 2>/dev/null)
    elif command -v node >/dev/null 2>&1; then
      uuid=$(node -e "console.log(require('crypto').randomUUID())" 2>/dev/null)
    elif command -v openssl >/dev/null 2>&1; then
      # Generate a UUID-like string using openssl
      uuid=$(openssl rand -hex 16 | sed 's/\(........\)\(....\)\(....\)\(....\)\(............\)/\1-\2-\3-\4-\5/' 2>/dev/null)
    fi
    
    if [ -n "$uuid" ]; then
      echo "$uuid" > "$INSTALL_ID_FILE" 2>/dev/null || {
        [[ -n "$BBX_DEBUG" ]] && echo "Warning: Could not write installation_id (may be read-only)"
        return 0
      }
      chmod 600 "$INSTALL_ID_FILE" 2>/dev/null || true
      [[ -n "$BBX_DEBUG" ]] && echo "Created installation_id: $uuid"
    else
      [[ -n "$BBX_DEBUG" ]] && echo "Warning: Could not generate UUID for installation_id"
    fi
  else
    [[ -n "$BBX_DEBUG" ]] && echo "installation_id already exists"
  fi
}

# Returns 0 if currently running from official location (not temp copy)
is_running_in_official() {
  local TMPDIR="$HOME/.cache/myscript-installer"
  [[ "$0" != "$TMPDIR/"* ]]
}

run_quietly() {
  if [[ -n ${BBX_DEBUG:-} ]]; then
    BBX_DEBUG="$BBX_DEBUG" "$@"
  else
    { BBX_DEBUG="$BBX_DEBUG" "$@"; } &>/dev/null
  fi
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

# -------------------------
# Pure-bash semver selector
# -------------------------

# --- in _parse_tag(), add a flag for "has explicit patch" --------------------
_parse_tag() {
  local s="$1" core pre a b c rcnum
  PAR_MAJ=0 PAR_MIN=0 PAR_PAT=0 PAR_STABLE=1 PAR_RCNUM=0
  PAR_HASPATCH=0     # <--- NEW

  [[ ${s:0:1} == "v" ]] && s="${s:1}"

  core="${s%%-*}"
  if [[ "$core" == "$s" ]]; then pre=""; else pre="${s#"$core"-}"; fi

  IFS='.' read -r a b c <<<"$core"

  [[ "$a" =~ ^[0-9]+$ ]] || return 1
  [[ "$b" =~ ^[0-9]+$ ]] || return 1
  if [[ -z "$c" ]]; then
    PAR_HASPATCH=0                  # explicit patch missing
    PAR_PAT=0
  else
    [[ "$c" =~ ^[0-9]+$ ]] || return 1
    PAR_HASPATCH=1                  # explicit patch present
    PAR_PAT=$c
  fi

  PAR_MAJ=$a
  PAR_MIN=$b

  if [[ -n "$pre" ]]; then
    if [[ "$pre" == rc ]]; then
      PAR_STABLE=0; PAR_RCNUM=0
    elif [[ "$pre" == rc.* ]]; then
      rcnum="${pre#rc.}"
      [[ "$rcnum" =~ ^[0-9]+$ ]] || return 1
      PAR_STABLE=0; PAR_RCNUM=$rcnum
    else
      return 1
    fi
  fi
  return 0
}


# --- in _better_than(), add a tie-break using PAR_HASPATCH -------------------
# Args: cMaj cMin cPat cStable cRcNum cHasPatch  bMaj bMin bPat bStable bRcNum bHasPatch
_better_than() {
  local cMaj=$1 cMin=$2 cPat=$3 cSt=$4 cRc=$5 cHP=$6
  local bMaj=$7 bMin=$8 bPat=$9 bSt=${10} bRc=${11} bHP=${12}

  # core compare
  if   (( cMaj > bMaj )); then return 0
  elif (( cMaj < bMaj )); then return 1; fi
  if   (( cMin > bMin )); then return 0
  elif (( cMin < bMin )); then return 1; fi
  if   (( cPat > bPat )); then return 0
  elif (( cPat < bPat )); then return 1; fi

  # same core: stable > rc
  if (( cSt != bSt )); then
    (( cSt > bSt )) && return 0 || return 1
  fi

  # both rc or both stable
  if (( cSt == 0 )); then
    if   (( cRc > bRc )); then return 0
    elif (( cRc < bRc )); then return 1; fi
  fi

  # FINAL TIE-BREAKER: prefer explicit patch (e.g., 2.1.0 over 2.1)
  if (( cHP != bHP )); then
    (( cHP > bHP )) && return 0 || return 1
  fi

  # equal
  return 1
}

# get_latest_release_tag_filtered <channel>
# channel: "stable" (default), "rc", or "any"
# Returns the *release* tag (not just a git tag). For "stable" we use the
# /releases/latest endpoint (non-draft, non-prerelease). For "rc" we scan
# releases for prerelease entries (or tags containing -rc). For "any" we
# scan all non-draft releases and pick the best by semver (stable > rc).
get_latest_release_tag_filtered() {
  # Skip API call if BBX_NO_UPDATE is set; allow caller-provided tag to short-circuit.
  if [[ -n "$BBX_NO_UPDATE" ]]; then
    if [[ -n "${BBX_RELEASE_TAG:-}" ]]; then
      echo "$BBX_RELEASE_TAG"
      return 0
    fi
    echo "unknown"
    return 1
  fi

  local channel="${1:-stable}"

  # Use PUBLIC_REPO for releases (releases are published to public repo, not source repo)
  local release_repo="${PUBLIC_REPO:-BrowserBox/BrowserBox}"
  local api="https://api.github.com/repos/${release_repo}"

  # For internal/non-public repos, skip strict tag validation to allow testing
  local is_internal_repo=false
  if [[ "$release_repo" != "BrowserBox/BrowserBox" ]]; then
    is_internal_repo=true
  fi

  # Curl opts (use token if present)
  local has_token=false
  local -a CURL_OPTS=( -sS --connect-timeout 8 -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" )
  if [[ -n "$GITHUB_TOKEN" ]]; then
    CURL_OPTS+=( -H "Authorization: Bearer $GITHUB_TOKEN" )
    has_token=true
  elif [[ -n "$GH_TOKEN" ]]; then
    CURL_OPTS+=( -H "Authorization: Bearer $GH_TOKEN" )
    has_token=true
  fi

  # Helper to safely parse tag_name (jq preferred, sed fallback)
  _extract_tag_name() {
    if command -v jq >/dev/null 2>&1; then
      jq -r '.tag_name // empty'
    else
      sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]\+\)".*/\1/p' | head -n1
    fi
  }

  # Helper to check for rate limit or other API errors
  _check_api_error() {
    local resp="$1"
    if [[ "$resp" == *'"message"'*'"API rate limit exceeded"'* ]] || [[ "$resp" == *'"message"'*'"rate limit"'* ]]; then
      echo "rate_limit"
    elif [[ "$resp" == *'"message"'*'"Not Found"'* ]]; then
      echo "not_found"
    elif [[ "$resp" == *'"message"'* ]] && [[ "$resp" != *'"tag_name"'* ]]; then
      echo "api_error"
    else
      echo "ok"
    fi
  }

  # Helper to use stale cache when API fails
  _use_stale_cache() {
    local cache_file="$1"
    local reason="$2"
    if [[ -f "$cache_file" ]]; then
      local ts cached
      read -r ts cached <"$cache_file" || true
      if [[ -n "$cached" && "$cached" != "unknown" ]]; then
        [[ -n "$BBX_DEBUG" ]] && printf "${YELLOW}Using cached version due to %s: %s${NC}\n" "$reason" "$cached" >&2
        echo "$cached"
        return 0
      fi
    fi
    return 1
  }

  if [[ "$channel" == "stable" ]]; then
    local cache_file="${BB_CONFIG_DIR}/latest_release_${channel}.cache"
    local now ts cached
    now="$(date +%s)"
    if [[ -f "$cache_file" ]]; then
      read -r ts cached <"$cache_file" || true
      if [[ -n "$ts" && -n "$cached" ]] && (( now - ts < 3600 )); then
        echo "$cached"
        return 0
      fi
    fi

    # GitHub's "latest" is the newest non-draft, non-prerelease release.
    local resp tag api_status
    resp="$(curl "${CURL_OPTS[@]}" "$api/releases/latest" 2>/dev/null)" || true
    api_status="$(_check_api_error "$resp")"

    if [[ "$api_status" == "rate_limit" ]]; then
      if [[ "$has_token" == "false" ]]; then
        printf "${YELLOW}GitHub API rate limit exceeded. Set GITHUB_TOKEN or GH_TOKEN to avoid this.${NC}\n" >&2
      else
        printf "${YELLOW}GitHub API rate limit exceeded (even with token).${NC}\n" >&2
      fi
      # Try to use stale cache
      if _use_stale_cache "$cache_file" "rate limit"; then
        return 0
      fi
      echo "unknown - rate limited"; return 1
    elif [[ "$api_status" == "not_found" ]]; then
      [[ -n "$BBX_DEBUG" ]] && printf "${YELLOW}No releases found in repository.${NC}\n" >&2
      echo "unknown"; return 1
    elif [[ "$api_status" == "api_error" ]]; then
      [[ -n "$BBX_DEBUG" ]] && printf "${YELLOW}GitHub API error occurred.${NC}\n" >&2
      # Try stale cache
      if _use_stale_cache "$cache_file" "API error"; then
        return 0
      fi
      echo "unknown"; return 1
    fi

    tag="$(printf '%s' "$resp" | _extract_tag_name)"

    # For internal repos, accept any non-draft release without strict tag validation
    if [[ "$is_internal_repo" == "true" ]]; then
      if [[ -n "$tag" && "$tag" != "null" ]]; then
        printf '%s %s\n' "$now" "$tag" >"$cache_file" || true
        echo "$tag"
        return 0
      fi
      # /releases/latest may fail for repos with only draft releases, try fetching list
      local list_resp first_non_draft
      list_resp="$(curl "${CURL_OPTS[@]}" "$api/releases?per_page=20" 2>/dev/null)" || true
      if command -v jq >/dev/null 2>&1; then
        first_non_draft="$(printf '%s' "$list_resp" | jq -r '[.[] | select(.draft==false)][0].tag_name // empty')"
      else
        # Fallback: just grab the first tag_name (less accurate but usable)
        first_non_draft="$(printf '%s' "$list_resp" | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]\+\)".*/\1/p' | head -n1)"
      fi
      if [[ -n "$first_non_draft" && "$first_non_draft" != "null" ]]; then
        printf '%s %s\n' "$now" "$first_non_draft" >"$cache_file" || true
        echo "$first_non_draft"
        return 0
      fi
    else
      # Public repo: filter out any accidental "-rc" tag names and validate semver
      if [[ -n "$tag" && "$tag" != "null" && "$tag" != *-rc* ]]; then
        # Validate with our semver parser to be safe
        if _parse_tag "$tag" && (( PAR_STABLE == 1 )); then
          printf '%s %s\n' "$now" "$tag" >"$cache_file" || true
          echo "$tag"
          return 0
        fi
      fi
    fi

    # If nothing found but we have stale cache, use it
    if _use_stale_cache "$cache_file" "no valid release found"; then
      return 0
    fi

    # If nothing found, fall through to failure (caller will fallback to tags)
    echo "unknown"; return 1
  fi

  # For "rc" and "any" we need to list releases and pick the best.
  # We'll iterate through all non-draft releases, filtering by channel.
  local cache_file="${BB_CONFIG_DIR}/latest_release_${channel}.cache"
  local now
  now="$(date +%s)"

  # Check cache first for rc/any channels too
  if [[ -f "$cache_file" ]]; then
    local ts cached
    read -r ts cached <"$cache_file" || true
    if [[ -n "$ts" && -n "$cached" ]] && (( now - ts < 3600 )); then
      echo "$cached"
      return 0
    fi
  fi

  local resp tags best_tag="" api_status
  resp="$(curl "${CURL_OPTS[@]}" "$api/releases?per_page=100" 2>/dev/null)" || true
  api_status="$(_check_api_error "$resp")"

  if [[ "$api_status" == "rate_limit" ]]; then
    if [[ "$has_token" == "false" ]]; then
      printf "${YELLOW}GitHub API rate limit exceeded. Set GITHUB_TOKEN or GH_TOKEN to avoid this.${NC}\n" >&2
    else
      printf "${YELLOW}GitHub API rate limit exceeded (even with token).${NC}\n" >&2
    fi
    if _use_stale_cache "$cache_file" "rate limit"; then
      return 0
    fi
    echo "unknown - rate limited"; return 1
  elif [[ "$api_status" != "ok" ]]; then
    [[ -n "$BBX_DEBUG" ]] && printf "${YELLOW}GitHub API error for channel ${channel}.${NC}\n" >&2
    if _use_stale_cache "$cache_file" "API error"; then
      return 0
    fi
    echo "unknown"; return 1
  fi

  # For internal repos, just return the first non-draft release without tag validation
  if [[ "$is_internal_repo" == "true" ]]; then
    local first_non_draft
    if command -v jq >/dev/null 2>&1; then
      first_non_draft="$(printf '%s' "$resp" | jq -r '[.[] | select(.draft==false)][0].tag_name // empty')"
    else
      first_non_draft="$(printf '%s' "$resp" | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]\+\)".*/\1/p' | head -n1)"
    fi
    if [[ -n "$first_non_draft" && "$first_non_draft" != "null" ]]; then
      printf '%s %s\n' "$now" "$first_non_draft" >"$cache_file" || true
      echo "$first_non_draft"
      return 0
    fi
    echo "unknown"; return 1
  fi

  if command -v jq >/dev/null 2>&1; then
    if [[ "$channel" == "rc" ]]; then
      tags="$(printf '%s' "$resp" | jq -r '.[] | select(.draft==false) | select(.prerelease==true or (.tag_name|test("-rc($|\\.)"))) | .tag_name')"
    else
      # any
      tags="$(printf '%s' "$resp" | jq -r '.[] | select(.draft==false) | .tag_name')"
    fi
  else
    # Very light fallback without jq: grab all tag_name lines then filter
    tags="$(printf '%s' "$resp" | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]\+\)".*/\1/p')"
    if [[ "$channel" == "rc" ]]; then
      tags="$(printf '%s\n' "$tags" | grep -E -- '-rc(\.|$)' || true)"
    fi
  fi

  # Walk tags with your semver comparator
  local bestMaj=0 bestMin=0 bestPat=0 bestStable=0 bestRc=0 bestHP=0
  local t
  while IFS= read -r t; do
    [[ -z "$t" ]] && continue
    if _parse_tag "$t"; then
      # For "any" we allow both; for "rc" we require rc; (stable handled above)
      if [[ "$channel" == "rc" && $PAR_STABLE -ne 0 ]]; then
        continue
      fi
      local cMaj=$PAR_MAJ cMin=$PAR_MIN cPat=$PAR_PAT cSt=$PAR_STABLE cRc=$PAR_RCNUM cHP=$PAR_HASPATCH
      if [[ -z "$best_tag" ]] || _better_than \
        "$cMaj" "$cMin" "$cPat" "$cSt" "$cRc" "$cHP" \
        "$bestMaj" "$bestMin" "$bestPat" "$bestStable" "$bestRc" "$bestHP"; then
        best_tag="$t"
        bestMaj=$cMaj; bestMin=$cMin; bestPat=$cPat; bestStable=$cSt; bestRc=$cRc; bestHP=$cHP
      fi
    fi
  done <<< "$tags"

  if [[ -n "$best_tag" ]]; then
    # Cache the result for rc/any channels
    printf '%s %s\n' "$now" "$best_tag" >"$cache_file" || true
    echo "$best_tag"; return 0
  fi

  # Try stale cache before giving up
  if _use_stale_cache "$cache_file" "no valid ${channel} release found"; then
    return 0
  fi

  echo "unknown"; return 1
}

# get_latest_tag_filtered <channel>
# (unchanged logic; still scans git tags. Kept here in case you want the updated copy.)
get_latest_tag_filtered() {
  local channel="${1:-stable}"
  local best_tag=""
  local bestMaj=0 bestMin=0 bestPat=0 bestStable=0 bestRc=0 bestHP=0
  local _hash ref tag

  while IFS=$'\t' read -r _hash ref; do
    [[ -z "$ref" ]] && continue
    tag="${ref#refs/tags/}"
    [[ "$tag" == *^{} ]] && continue

    if _parse_tag "$tag"; then
      # Filter by requested channel
      if [[ "$channel" == "stable" && $PAR_STABLE -eq 0 ]]; then
        continue
      elif [[ "$channel" == "rc" && $PAR_STABLE -ne 0 ]]; then
        continue
      fi
      local cMaj=$PAR_MAJ cMin=$PAR_MIN cPat=$PAR_PAT cSt=$PAR_STABLE cRc=$PAR_RCNUM cHP=$PAR_HASPATCH
      if [[ -z "$best_tag" ]] || _better_than \
          "$cMaj" "$cMin" "$cPat" "$cSt" "$cRc" "$cHP" \
          "$bestMaj" "$bestMin" "$bestPat" "$bestStable" "$bestRc" "$bestHP"; then
        best_tag="$t"
        bestMaj=$cMaj; bestMin=$cMin; bestPat=$cPat; bestStable=$cSt; bestRc=$cRc; bestHP=$cHP
      fi
    fi
  done

  [[ -n "$best_tag" ]] && { echo "$best_tag"; return 0; } || { echo "unknown"; return 1; }
}

# --- in get_latest_tag(), pass the new flag into comparator ------------------
# Back-compat: previous behavior was "latest (stable-preferred but could be rc)".
# We now default to "stable" to satisfy the new requirement.
get_latest_tag() {
  get_latest_tag_filtered "stable"
}

# get_latest_repo_version [stable|rc|any]
# Prefer *releases*; if unavailable, fall back to raw tags so the CLI still works.
# OPTIONAL: make tag-fallback opt-in to avoid picking non-released tags
get_latest_repo_version() {
  local channel="${1:-stable}"
  local out

  # 1) Releases first
  if out="$(get_latest_release_tag_filtered "$channel")" && [[ "$out" != "unknown" ]]; then
    echo "$out"; return 0
  fi

  # 2) If you want to REQUIRE releases, bail out here
  if [[ -n "$BBX_REQUIRE_RELEASE" ]]; then
    echo "unknown - cannot find any releases"; return 1
  fi

  # 3) Otherwise, fall back to tags
  if out=$(timeout 7s git ls-remote --tags --refs "$REPO_URL" 2>/dev/null | get_latest_tag_filtered "$channel"); then
    echo "$out"; return 0
  fi

  echo "unknown"; return 1
}


# normalize a user-supplied version to a tag with 'v' prefix
normalize_tag() {
  local v="$1"
  if [[ "$v" =~ ^v[0-9]+\.[0-9]+(\.[0-9]+)?(-rc(\.[0-9]+)?)?$ ]]; then
    echo "$v"
  elif [[ "$v" =~ ^[0-9]+\.[0-9]+(\.[0-9]+)?(-rc(\.[0-9]+)?)?$ ]]; then
    echo "v$v"
  else
    echo ""
  fi
}

# returns 0 if tag exists in remote
tag_exists_remote() {
  local tag="$1"
  git ls-remote --tags --refs "$REPO_URL" "refs/tags/$tag" >/dev/null 2>&1
}


# Version - lazy load to avoid API call on every script run
# Only fetch version when actually needed (not during BBX_NO_UPDATE mode)
BBX_VERSION="unknown"
branch="main" # change to main for dist
if [[ "$branch" != "main" ]]; then
  export BBX_BRANCH="$branch"
fi
banner_color=$CYAN

# Helper: Get version info from version.json
# DEPRECATED: This function is no longer used in binary-based installation.
# Version info is now obtained via get_canonical_bbx_version() which calls `browserbox --version`
get_version_info() {
  local file="$1"
  if [ -f "$file" ]; then
    # Assuming version.json has { "tag": "..." }
    jq -r '.tag' "$file" 2>/dev/null || echo "unknown"
  else
    echo "unknown"
  fi
}

# Helper: Get canonical BBX version from browserbox command or fallback
get_canonical_bbx_version() {
  local version=""
  
  # Try to get version from installed browserbox (preferred) or bbpro
  local version_cmd=""
  if command -v browserbox >/dev/null 2>&1; then
    version_cmd="browserbox"
  elif command -v bbpro >/dev/null 2>&1; then
    version_cmd="bbpro"
  fi

  if [[ -n "$version_cmd" ]]; then
    local bb_output
    bb_output="$("$version_cmd" --version 2>/dev/null || true)"
    if [[ -n "$bb_output" ]]; then
      # Extract version number using regex (supports any dot-separated numeric format: X.Y, X.Y.Z, etc.)
      # Handles formats like "BrowserBox version: 15.1.2", "v15.1.2", or just "15.1.2"
      version="$(echo "$bb_output" | grep -oE '[0-9]+(\.[0-9]+)+' | head -n1)"
    fi
  fi
  
  # Fallback to BBX_VERSION if set and valid
  # Note: BBX_VERSION can be "unknown", "unknown - cannot find any releases", or a valid version
  # We explicitly exclude "unknown" and "unknown - ..." variants
  if [[ -z "$version" ]] && [[ -n "${BBX_VERSION:-}" ]] && [[ "$BBX_VERSION" != "unknown" ]] && [[ "$BBX_VERSION" != "unknown - "* ]]; then
    # Strip leading 'v' if present
    version="${BBX_VERSION#v}"
  fi
  
  # Final fallback
  if [[ -z "$version" ]]; then
    version="unknown"
  fi
  
  echo "$version"
}

# Set the canonical version for use throughout the script
VERSION="$(get_canonical_bbx_version)"

if ! command -v bbpro &>/dev/null || ! test -d "${HOME}/.config/dosaygo/bbpro"; then
  if [[ "$1" != "install" ]] && [[ "$1" != "uninstall" ]] && [[ "$1" != "update-background" ]] && [[ "$1" != "--version" ]] && [[ "$1" != "-v" ]] && [[ "$1" != "--help" ]] && [[ "$1" != "-h" ]]; then
    banner
    printf "\n${RED}BrowserBox is not installed yet.${NC}\n"
    printf "\tRun: ${BOLD}curl -fsSL https://browserbox.io/install.sh | bash${NC}\n"
    printf "\tIf reinstalling, run ${BOLD}bbx uninstall${NC} first.\n"
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
    # Respect caller-provided values: do not let persisted config clobber explicit env.
    local env_license_key="${LICENSE_KEY:-}"
    local env_email="${EMAIL:-}"
    local env_hostname="${BBX_HOSTNAME:-}"
    local env_domain="${BBX_CALLER_DOMAIN:-}"

    # Load persistent config first
    [ -f "$CONFIG_FILE" ] && source "$CONFIG_FILE"

    if [[ -n "$env_license_key" ]]; then
        LICENSE_KEY="$env_license_key"
    fi
    if [[ -n "$env_email" ]]; then
        EMAIL="$env_email"
    fi
    if [[ -n "$env_hostname" ]]; then
        BBX_HOSTNAME="$env_hostname"
    fi

    if [[ -z "${EMAIL:-}" && -f "${BB_CONFIG_DIR}/.agreed" ]]; then
        local agreed_email=""
        agreed_email="$(tail -n1 "${BB_CONFIG_DIR}/.agreed" | tr -d '\r' | tr -d '\n')"
        if [[ "$agreed_email" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
            EMAIL="$agreed_email"
        fi
    fi

    # Then load runtime config, which can override for the session
    if [ -f "${BB_CONFIG_DIR}/test.env" ]; then
        # Preserve ambient context to detect "downgrade to localhost" attempts
        local ambient_hn="${BBX_HOSTNAME:-}"

        source "$BB_CONFIG_DIR/test.env"
        # user.env overrides survive bbx setup regeneration of test.env
        [ -f "${BB_CONFIG_DIR}/user.env" ] && source "${BB_CONFIG_DIR}/user.env" || true

        # For backward compatibility, ensure top-level vars are set from test.env
        PORT="${APP_PORT:-$PORT}"
        TOKEN="${LOGIN_TOKEN:-$TOKEN}"

        # PRECEDENCE RULES:
        # 1. Explicit DOMAIN/BBX_CALLER_DOMAIN wins (handled after source)
        # 2. Saved DOMAIN wins over ambient localhost
        if [[ -n "${DOMAIN:-}" ]] && [[ "$ambient_hn" == "localhost" ]]; then
            BBX_HOSTNAME="$DOMAIN"
        elif [[ -z "${BBX_HOSTNAME:-}" && -n "${DOMAIN:-}" ]]; then
            BBX_HOSTNAME="$DOMAIN"
        fi
    fi

    # Explicit overrides are authoritative, but ambient localhost does not 
    # downgrade a saved non-localhost hostname or route domain.
    if [[ -n "$env_hostname" ]]; then
        if [[ "$env_hostname" != "localhost" ]] || [[ -z "${BBX_HOSTNAME:-}" ]] || [[ "${BBX_HOSTNAME:-}" == "localhost" ]]; then
            BBX_HOSTNAME="$env_hostname"
        fi
    fi
    if [[ -n "$env_domain" ]]; then
        DOMAIN="$env_domain"
        BBX_HOSTNAME="$env_domain"
    fi

    # SSLCERTS_DIR in test.env is absolute and user-specific — it may reference
    # a different user's home (e.g. root's path from a build step). Always
    # reset to the current user's default unless BBX_SSLCERTS_DIR overrides.
    if [[ -n "${BBX_SSLCERTS_DIR:-}" ]]; then
        SSLCERTS_DIR="$BBX_SSLCERTS_DIR"
    else
        SSLCERTS_DIR="${HOME}/sslcerts"
    fi
}

load_config
# Trap EXIT signal to save config on script termination
trap save_config EXIT


save_config() {
  mkdir -p "$BB_CONFIG_DIR"
  chmod 700 "$BB_CONFIG_DIR"  # Restrict to owner only

  # Grab existing values from config (without sourcing / polluting env)
  local existing_key="" existing_email="" existing_hostname=""
  if [ -f "$CONFIG_FILE" ]; then
    existing_key=$(grep -E '^LICENSE_KEY=' "$CONFIG_FILE" | head -n1 | sed -E 's/^LICENSE_KEY="?([^"]*)"?$/\1/')
    existing_email=$(grep -E '^EMAIL=' "$CONFIG_FILE" | head -n1 | sed -E 's/^EMAIL="?([^"]*)"?$/\1/')
    existing_hostname=$(grep -E '^BBX_HOSTNAME=' "$CONFIG_FILE" | head -n1 | sed -E 's/^BBX_HOSTNAME="?([^"]*)"?$/\1/')
  fi

  # Decide what key to write:
  # - Prefer the current in-memory value if non-empty/valid
  # - Else keep the existing on-disk value
  # - Else write empty
  local _LIC_TO_WRITE=""
  if [[ -n "$LICENSE_KEY" && "$LICENSE_KEY" =~ ^[A-Z0-9]{4}(-[A-Z0-9]{4}){7}$ ]]; then
    _LIC_TO_WRITE="$LICENSE_KEY"
  elif [[ -n "$existing_key" && "$existing_key" =~ ^[A-Z0-9]{4}(-[A-Z0-9]{4}){7}$ ]]; then
    _LIC_TO_WRITE="$existing_key"
  else
    _LIC_TO_WRITE=""
  fi

  # Prefer in-memory EMAIL, fall back to on-disk
  local _EMAIL_TO_WRITE="${EMAIL:-$existing_email}"

  # Prefer in-memory BBX_HOSTNAME, fall back to on-disk
  local _HOST_TO_WRITE="${BBX_HOSTNAME:-$existing_hostname}"

  # Only save persistent, user-level data to the main config file.
  # Runtime data like PORT and TOKEN live in test.env.
  cat > "$CONFIG_FILE" <<EOF
EMAIL="${_EMAIL_TO_WRITE}"
LICENSE_KEY="${_LIC_TO_WRITE}"
BBX_HOSTNAME="${_HOST_TO_WRITE}"
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
    # Hard-fail in non-interactive contexts instead of blocking on read
    if [[ "${BBX_NONINTERACTIVE:-}" == "true" ]] || ! [[ -t 0 ]]; then
      printf "${RED}ERROR: LICENSE_KEY is empty and stdin is not a terminal.${NC}\n" >&2
      printf "${YELLOW}Set LICENSE_KEY in env or run 'bbx certify' interactively.${NC}\n" >&2
      return 1
    fi
    while true; do
      read -r -p "Enter License Key (e.g., U0TZ-GNMD-S889-RETG-YMCH-EAMR-ZOKU-2KRO): " LICENSE_KEY
      if [ -z "$LICENSE_KEY" ]; then
        printf "${RED}ERROR: License key cannot be empty. Try again.${NC}\n"
        continue
      fi
      if [[ "$LICENSE_KEY" =~ ^[A-Z0-9]{4}(-[A-Z0-9]{4}){7}$ ]]; then
        export LICENSE_KEY
        certout="$(bash -c "export LICENSE_KEY=\"$LICENSE_KEY\"; bbcertify --force-license --no-reservation 2>&1")"
        if [[ "$?" -eq 0 ]]; then
          printf "${GREEN}License key validated with server.${NC}\n"
          save_config
          return 0
        else
          printf "${RED}ERROR: License key invalid or server unreachable. Try again.${NC}\n"
          echo "Certification output: $certout"
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
    certout="$(bash -c "export LICENSE_KEY=\"$LICENSE_KEY\"; bbcertify --force-license --no-reservation 2>&1")"
    if [[ "$?" -eq 0 ]]; then
      printf "${GREEN}Existing product key is valid.${NC}\n"
      return 0
    else
      printf "${RED}Current product key ($LICENSE_KEY) is invalid. Run 'bbx certify' to update it.${NC}\n"
      echo "Certification output: $certout"
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

# Normalize hostnames for local/direct use paths.
# Wildcard hostnames are not valid literal host entries or local links.
normalize_hostname_for_local_use() {
  local hostname="$1"
  if [[ "$hostname" == *"*"* ]]; then
    printf 'localhost\n'
    return 0
  fi
  printf '%s\n' "$hostname"
}

# Wrapper for getent-like functionality without installing getent
getent_hosts() {
  local hostname="$1"
  # If on macOS, etc, manually search /etc/hosts
  if ! command -v getent &>/dev/null; then
    awk -v h="$hostname" '
      /^[[:space:]]*#/ { next }
      {
        for (i = 2; i <= NF; i++) {
          if ($i == h) {
            print
            break
          }
        }
      }
    ' /etc/hosts || echo ""
  else
    getent hosts "$hostname" || echo ""
  fi
}

# Check if hostname is local
is_ip_literal() {
  local hostname="$1"
  # IPv4
  if [[ "$hostname" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
    return 0
  fi
  # IPv6
  if [[ "$hostname" == *:* ]]; then
    return 0
  fi
  return 1
}

# Returns 0 if the given IP address is private/loopback/link-local, 1 if public.
is_private_ip() {
  local ip="$1"
  # IPv4 private ranges
  if [[ "$ip" =~ ^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.|0\.) ]]; then
    return 0
  fi
  # IPv6 loopback and link-local
  if [[ "$ip" == "::1" ]] || [[ "$ip" =~ ^[Ff][Ee]80: ]] || [[ "$ip" =~ ^[Ff][CcDd] ]]; then
    return 0
  fi
  return 1
}

is_local_hostname() {
  local hostname="$1"
  local resolved_ips ip
  local public_dns_servers=("8.8.8.8" "1.1.1.1" "208.67.222.222")
  local has_valid_result=0

  # .onion domains are Tor-only; treat as local (use mkcert, not certbot)
  if [[ "$hostname" == *.onion ]]; then
    return 0
  fi

  # IP literals: public IPs get LE via acme.sh (shortlived), private → mkcert
  if is_ip_literal "$hostname"; then
    if is_private_ip "$hostname"; then
      return 0  # local → mkcert
    fi
    return 1    # public IP → handled specially in tls script
  fi

  # Try DNS resolution
  for dns in "${public_dns_servers[@]}"; do
    if command -v dig >/dev/null 2>&1; then
      resolved_ips="$(dig +short "$hostname" A @"$dns" 2>/dev/null || true)"
    else
      resolved_ips=""
    fi
    if [[ -n "$resolved_ips" ]]; then
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
  ip="${ip%.}"
  if [[ -z "$ip" ]]; then
    return 0 # Unresolvable => local
  fi
  if [[ "$ip" =~ ^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1$|fe80:) ]]; then
    return 0 # Local
  fi

  return 1 # Public
}

# Ensure hostname is in /etc/hosts, allowing whitespace but not comments
hosts_entry_exists() {
  local ip="$1"
  local hostname="$2"
  awk -v ip="$ip" -v h="$hostname" '
    /^[[:space:]]*#/ { next }
    $1 == ip {
      for (i = 2; i <= NF; i++) {
        if ($i == h) {
          found = 1
          exit
        }
      }
    }
    END { exit(found ? 0 : 1) }
  ' /etc/hosts
}

ensure_hosts_entry() {
  local h="$1"
  if ! hosts_entry_exists "127.0.0.1" "$h"; then
    echo "127.0.0.1 $h" | $SUDO tee -a /etc/hosts >/dev/null
  fi
  if ! hosts_entry_exists "::1" "$h"; then
    echo "::1 $h" | $SUDO tee -a /etc/hosts >/dev/null
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

    # Start ncat in the background
    pkill ncat &>/dev/null
    (echo -e "HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nOK" | ncat -l "$port" >/dev/null 2>&1) &
    local pid=$!
    # Ensure ncat is killed on exit
    trap "kill $pid &>/dev/null" RETURN

    # Wait for the port to become available, with a timeout
    local attempts=0
    local max_attempts=10 # 5 seconds max wait (10 * 0.5s)
    while ! curl -s --max-time 2 "http://localhost:$port" | grep -q "OK"; do
        kill $pid &>/dev/null
        ((attempts++))
        if [ "$attempts" -ge "$max_attempts" ]; then
            printf "${RED}Port $port did not become available in time.${NC}\n"
            return 1
        fi
        sleep 0.5
        printf "${YELLOW}Testing port $port accessibility...${NC}\n"
        (echo -e "HTTP/1.1 200 OK\r\nContent-Length: 2\r\n\r\nOK" | ncat -l "$port" >/dev/null 2>&1) &
        pid=$!
    done

    kill $pid &>/dev/null

    printf "${GREEN}Port $port is accessible.${NC}\n"
    return 0
}

# Wait for BrowserBox to be ready on a local port.
# Usage: wait_for_local_ready <port> <http|https> [max_wait_seconds]
wait_for_local_ready() {
  local port="$1"
  local scheme="${2:-https}"
  local max_wait="${3:-90}"
  local interval=2
  local elapsed=0
  local curl_args=(-s -o /dev/null --connect-timeout 2 --max-time 3 --head)
  [[ "$scheme" == "https" ]] && curl_args+=(-k)

  printf "${YELLOW}Waiting for BrowserBox to be ready on port ${port} (${scheme})...${NC}\n"

  while [ $elapsed -lt $max_wait ]; do
    if curl "${curl_args[@]}" "${scheme}://127.0.0.1:${port}/" 2>/dev/null; then
      printf "${GREEN}BrowserBox is ready on port ${port} (${elapsed}s)${NC}\n"
      return 0
    fi
    sleep "$interval"
    elapsed=$((elapsed + interval))
  done

  printf "${RED}BrowserBox did not become ready on port ${port} within ${max_wait}s${NC}\n"
  return 1
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
        $SUDO bash -c "PATH=/opt/homebrew/bin:/usr/local/bin:\$PATH setup_tor '$user'" || { printf "${RED}Failed to setup Tor for $user${NC}\n"; exit 1; }
    fi
}

# Ensure cloudflared is installed
ensure_cloudflared() {
    if command -v cloudflared >/dev/null 2>&1; then
        return 0
    fi

    printf "${YELLOW}cloudflared not found. Installing...${NC}\n" >&2

    # Map uname -m to cloudflared asset arch names
    local um; um="$(uname -m)"
    local deb_arch bin_arch rpm_arch
    case "$um" in
        x86_64)        deb_arch="amd64"  bin_arch="amd64"  rpm_arch="x86_64"  ;;
        aarch64|arm64) deb_arch="arm64"  bin_arch="arm64"  rpm_arch="aarch64" ;;
        armv7l|armv6l) deb_arch="arm"    bin_arch="arm"    rpm_arch="arm"     ;;
        i686|i386)     deb_arch="386"    bin_arch="386"    rpm_arch="386"     ;;
        *)
            printf "${RED}Unsupported architecture: %s${NC}\n" "$um" >&2
            return 1
            ;;
    esac

    if [[ "$(uname -s)" == "Darwin" ]]; then
        if command -v brew >/dev/null 2>&1; then
            brew install cloudflared || {
                printf "${RED}Failed to install cloudflared via Homebrew${NC}\n" >&2
                return 1
            }
        else
            printf "${RED}Homebrew not found. Please install cloudflared manually from:${NC}\n" >&2
            printf "https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/\n" >&2
            return 1
        fi

    elif [[ -f /etc/debian_version ]]; then
        local installed=false

        # Try the official Cloudflare apt repo (provides managed updates via apt)
        local codename
        codename="$(. /etc/os-release 2>/dev/null && printf '%s' "${VERSION_CODENAME:-}")"
        [[ -z "$codename" ]] && codename="any"

        if curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
                | $SUDO tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null 2>&1 \
           && printf 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared %s main\n' "$codename" \
                | $SUDO tee /etc/apt/sources.list.d/cloudflared.list >/dev/null \
           && $SUDO apt-get update -qq \
           && $SUDO apt-get install -y cloudflared; then
            installed=true
            printf "${GREEN}Installed cloudflared via Cloudflare apt repo${NC}\n" >&2
        else
            printf "${YELLOW}Cloudflare apt repo failed, falling back to .deb download${NC}\n" >&2
            $SUDO rm -f /etc/apt/sources.list.d/cloudflared.list \
                        /usr/share/keyrings/cloudflare-main.gpg
        fi

        if [[ "$installed" == false ]]; then
            local tmp_deb; tmp_deb="$(mktemp /tmp/cloudflared-XXXXXX.deb)"
            curl -fsSL --output "$tmp_deb" \
                "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${deb_arch}.deb" || {
                printf "${RED}Failed to download cloudflared .deb${NC}\n" >&2
                rm -f "$tmp_deb"; return 1
            }
            $SUDO dpkg -i "$tmp_deb" || {
                printf "${RED}Failed to install cloudflared .deb${NC}\n" >&2
                rm -f "$tmp_deb"; return 1
            }
            rm -f "$tmp_deb"
            printf "${GREEN}Installed cloudflared via .deb download${NC}\n" >&2
        fi

    elif [[ -f /etc/redhat-release || -f /etc/fedora-release ]]; then
        local tmp_rpm; tmp_rpm="$(mktemp /tmp/cloudflared-XXXXXX.rpm)"
        curl -fsSL --output "$tmp_rpm" \
            "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${rpm_arch}.rpm" || {
            printf "${RED}Failed to download cloudflared .rpm${NC}\n" >&2
            rm -f "$tmp_rpm"; return 1
        }
        $SUDO rpm -i "$tmp_rpm" 2>/dev/null \
            || $SUDO dnf install -y "$tmp_rpm" \
            || {
                printf "${RED}Failed to install cloudflared .rpm${NC}\n" >&2
                rm -f "$tmp_rpm"; return 1
            }
        rm -f "$tmp_rpm"
        printf "${GREEN}Installed cloudflared via .rpm download${NC}\n" >&2

    else
        # Generic Linux: static binary
        local tmp_bin; tmp_bin="$(mktemp /tmp/cloudflared-XXXXXX)"
        curl -fsSL --output "$tmp_bin" \
            "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${bin_arch}" || {
            printf "${RED}Failed to download cloudflared binary${NC}\n" >&2
            rm -f "$tmp_bin"; return 1
        }
        $SUDO install -m 755 "$tmp_bin" /usr/local/bin/cloudflared || {
            printf "${RED}Failed to install cloudflared to /usr/local/bin${NC}\n" >&2
            rm -f "$tmp_bin"; return 1
        }
        rm -f "$tmp_bin"
        printf "${GREEN}Installed cloudflared via static binary${NC}\n" >&2
    fi

    if ! command -v cloudflared >/dev/null 2>&1; then
        printf "${RED}cloudflared installation failed validation${NC}\n" >&2
        return 1
    fi

    printf "${GREEN}cloudflared installed successfully (%s)${NC}\n" "$(cloudflared --version 2>&1 | head -1)" >&2
    return 0
}

install_bbx() {
    has_browser_dep() {
        # Respect explicit CHROME_PATH if set and executable
        if [[ -n "${CHROME_PATH:-}" && -x "${CHROME_PATH}" ]]; then
            return 0
        fi
        local candidates=(
            google-chrome-stable
            google-chrome
            chromium-browser
            chromium
            /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome
        )
        for c in "${candidates[@]}"; do
            if command -v "$c" >/dev/null 2>&1; then
                return 0
            fi
        done
        return 1
    }

    has_cert_dep() {
        command -v mkcert >/dev/null 2>&1 && return 0
        command -v certbot >/dev/null 2>&1 && return 0
        return 1
    }

    needs_full_install() {
        # If browserbox binary missing, or core deps missing, we must do full install.
        if ! command -v browserbox >/dev/null 2>&1; then
            return 0
        fi
        if ! has_browser_dep; then
            return 0
        fi
        if ! has_cert_dep; then
            return 0
        fi
        return 1
    }

    # 1. Loop Protection
    if [[ -n "$BBX_INSTALL_GUARD" ]]; then
        return 0
    fi
    export BBX_INSTALL_GUARD="true"

    # 2. Path Detection
    local is_update=false
    if needs_full_install; then
        is_update=false
    else
        is_update=true
    fi

    banner
    check_agreement
    pre_install || return 0
    load_config
    ensure_deps
    ensure_installation_id

  printf "${GREEN}Installing BrowserBox CLI (bbx)...${NC}\n"

  local platform
  platform=$(detect_platform)
  local tag="${BBX_RELEASE_TAG:-}"
  if [[ -z "$tag" ]]; then
    if [[ -n "${BBX_NO_UPDATE:-}" ]]; then
      echo -e "${RED}BBX_NO_UPDATE is set; provide BBX_RELEASE_TAG to install without hitting release APIs.${NC}" >&2
      return 1
    fi
    tag=$(get_latest_release "$PUBLIC_REPO")
  fi

    # 3. Idempotency & Download
    local current_ver
    current_ver=$(get_binary_version)
    local norm_tag="${tag#v}"
    local norm_curr="${current_ver#v}"

    local exe_to_run=""

    if [[ "$norm_curr" == "$norm_tag" ]] && binary_exists; then
         printf "${GREEN}BrowserBox binary $tag is already installed.${NC}\n"
         exe_to_run="$BINARY_PATH"
    else
         exe_to_run=$(download_binary "$platform" "$tag")
         exit_status=$?

         # Sanitize: output should be a single line path
         exe_to_run=$(echo "$exe_to_run" | tail -n1 | tr -d '[:space:]')

         if [[ $exit_status -ne 0 ]] || [[ -z "$exe_to_run" ]] || [[ ! -f "$exe_to_run" ]]; then
             printf "${RED}Download failed.${NC}\n"
             if [[ -n "$BBX_DEBUG" ]]; then echo "Debug: Download output was: $exe_to_run" >&2; fi
             exit 1
         fi

          # Download and install release manifest for integrity verification
          printf "${YELLOW}Downloading release manifest...${NC}\n"
          local temp_manifest_dir
          temp_manifest_dir="$(mktemp -d)"
          if ! download_release_manifest "$tag" "$temp_manifest_dir"; then
            printf "${RED}Failed to download the signed release manifest.${NC}\n"
            rm -rf "$temp_manifest_dir"
            rm -f "$exe_to_run"
            return 1
          fi
          local artifact_key
          case "$platform" in
            macos) artifact_key="darwin-arm64" ;;
            linux) artifact_key="linux-x64" ;;
            *) printf "${RED}Unsupported install platform: %s${NC}\n" "$platform"; rm -rf "$temp_manifest_dir"; rm -f "$exe_to_run"; return 1 ;;
          esac
          if ! verify_release_bundle "${temp_manifest_dir}/release.manifest.json" "${temp_manifest_dir}/release.manifest.json.sig" "$exe_to_run" "$artifact_key"; then
            printf "${RED}Downloaded BrowserBox failed integrity verification; refusing to install.${NC}\n"
            rm -rf "$temp_manifest_dir"
            rm -f "$exe_to_run"
            return 1
          fi
          if ! install_release_manifest_from_dir "$temp_manifest_dir"; then
            printf "${RED}Failed to install the verified release manifest.${NC}\n"
            rm -rf "$temp_manifest_dir"
            rm -f "$exe_to_run"
            return 1
          fi
          rm -rf "$temp_manifest_dir"
    fi

    # 4. Config inputs
    local install_hostname="${BBX_INSTALL_HOSTNAME:-${BBX_HOSTNAME:-}}"
    local install_email="${BBX_INSTALL_EMAIL:-${BBX_EMAIL:-${EMAIL:-}}}"
    local default_hostname
    default_hostname=$(get_system_hostname)
    if [ -z "$install_hostname" ]; then
      if [[ -n "$BBX_TEST_AGREEMENT" ]]; then
        install_hostname="localhost"
      else
        read -r -p "Enter hostname (default: $default_hostname): " install_hostname
      fi
    fi
    install_hostname="${install_hostname:-$default_hostname}"

    if is_local_hostname "$install_hostname"; then
        ensure_hosts_entry "$install_hostname"
    fi

    if [ -z "$install_email" ]; then
      read -r -p "Enter your email for Let's Encrypt and BrowserBox terms agreement (required): " install_email
    fi
    if [[ -z "$install_email" ]]; then
      echo "An email is required for terms agreement and Let's Encrypt." >&2
      exit 1
    fi
    if [[ ! "$install_email" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
      echo "Error: '$install_email' is not a valid email address." >&2
      exit 1
    fi

    BBX_INSTALL_HOSTNAME="$install_hostname"
    BBX_HOSTNAME="$install_hostname"
    BBX_INSTALL_EMAIL="$install_email"
    BBX_EMAIL="$install_email"
    EMAIL="$install_email"

    # 5. Execute
    if [[ "$is_update" == "true" ]]; then
        printf "${YELLOW}BrowserBox detected in PATH. Running update setup (--install)...${NC}\n"
        "$exe_to_run" --install
    else
        printf "${YELLOW}BrowserBox not found in PATH. Running full setup (--full-install)...${NC}\n"
        yes yes 2>/dev/null | BBX_INSTALL_HOSTNAME="$install_hostname" BBX_HOSTNAME="$install_hostname" BBX_INSTALL_EMAIL="$install_email" BBX_EMAIL="$install_email" EMAIL="$install_email" "$exe_to_run" --full-install "$install_hostname" "$install_email"
    fi
    local install_exit=$?

    # Cleanup temp file
    if [[ "$exe_to_run" != "$BINARY_PATH" && -f "$exe_to_run" ]]; then
        rm -f "$exe_to_run"
    fi

    [ $install_exit -eq 0 ] || { printf "${RED}Installation failed${NC}\n"; exit 1; }

    if [[ -z "$BBX_TEST_AGREEMENT" ]]; then
      printf "${YELLOW}Installing bbx command globally...${NC}\n"
      $SUDO curl --connect-timeout 7 --max-time 15 -sSL "$REPO_URL/raw/${branch}/bbx.sh" -o "$BBX_BIN" || { printf "${RED}Failed to install bbx${NC}\n"; $SUDO rm -f "$BBX_BIN"; exit 1; }
      $SUDO chmod +x "$BBX_BIN"
    fi

    save_config

    # FIX: Re-read the version from the newly installed binary for the success message
    local final_ver
    if command -v bbpro >/dev/null 2>&1; then
       final_ver=$(browserbox --version 2>/dev/null | grep -oE '[0-9]+(\.[0-9]+)+' | head -n1)
    fi
    # Fallback to tag if binary check fails
    final_ver="${final_ver:-$tag}"

    printf "${GREEN}bbx $final_ver installed successfully! Run 'bbx --help' for usage.${NC}\n"
}

setup() {
  if _bbx_for_active; then
    _for_setup "$@"
    return $?
  fi

  load_config
  ensure_deps
  ensure_installation_id

  # Cleanse stale stop sentinel (e.g. from a crash during previous stop)
  rm -f "$STOP_SENTINEL"

  # Initialize local variables from config or defaults
  local port="${PORT:-$(find_free_port_block)}"
  local hostname="${BBX_HOSTNAME:-$(get_system_hostname)}"
  local token=""
  local zeta_mode=""
  local backend_scheme="" # Will be 'http' or 'https'
  local flipbook_record_dir=""
  local flipbook_description=""

  # Capture original arguments to pass to run() later
  local original_args=("$@")

  while [ $# -gt 0 ]; do
    case "$1" in
      --port|-p)
        if [ -z "$2" ]; then
          printf "${RED}Error: Option $1 requires an argument${NC}\n"
          printf "Usage: bbx setup [--port <p>] [--hostname <h>] [--token <t>] [--zeta] [--backend <http|https>]${NC}\n"
          exit 1
        fi
        port="$2"
        shift 2
        ;;
      --hostname|-h)
        if [ -z "$2" ]; then
          printf "${RED}Error: Option $1 requires an argument${NC}\n"
          printf "Usage: bbx setup [--port <p>] [--hostname <h>] [--token <t>] [--zeta] [--backend <http|https>]${NC}\n"
          exit 1
        fi
        hostname="$2"
        shift 2
        ;;
      --token|-t)
        if [ -z "$2" ]; then
          printf "${RED}Error: Option $1 requires an argument${NC}\n"
          printf "Usage: bbx setup [--port <p>] [--hostname <h>] [--token <t>] [--zeta] [--backend <http|https>]${NC}\n"
          exit 1
        fi
        token="$2"
        shift 2
        ;;
      --zeta|-z)
        zeta_mode="true"
        shift
        ;;
      --http-only|-o) # Kept for backward compatibility
        backend_scheme="http"
        shift
        ;;
      --backend)
        if [[ "$2" != "http" && "$2" != "https" ]]; then
            printf "${RED}Error: --backend value must be 'http' or 'https'${NC}\n"
            exit 1
        fi
        backend_scheme="$2"
        shift 2
        ;;
      --flipbook-record)
        if [ -z "$2" ]; then
          printf "${RED}Error: --flipbook-record requires a directory path${NC}\n"
          exit 1
        fi
        flipbook_record_dir="$2"
        shift 2
        ;;
      --flipbook-description)
        if [ -z "$2" ]; then
          printf "${RED}Error: --flipbook-description requires a text argument${NC}\n"
          exit 1
        fi
        flipbook_description="$2"
        shift 2
        ;;
      *)
        printf "${RED}Unknown option: $1${NC}\n"
        printf "Usage: bbx setup [--port <p>] [--hostname <h>] [--token <t>] [--zeta] [--backend <http|https>]${NC}\n"
        exit 1
        ;;
    esac
  done

  if ! [[ "$port" =~ ^[0-9]+$ ]] || [ "$port" -lt 1024 ] || [ "$port" -gt 65535 ]; then
    printf "${RED}Invalid port: $port. Must be between 1024 and 65535.${NC}\n"
    exit 1
  fi

  local normalized_hostname
  normalized_hostname="$(normalize_hostname_for_local_use "$hostname")"
  if [[ "$hostname" != "$normalized_hostname" ]]; then
    printf "${YELLOW}Wildcard hostname '%s' is not valid for setup; using 'localhost' instead.${NC}\n" "$hostname"
  fi
  hostname="$normalized_hostname"

  # These are now local to setup; they will be written to test.env
  local setup_port="$port"
  local setup_hostname="$hostname"
  local setup_token="${token:-$(openssl rand -hex 16)}"

  if [[ -z "$setup_token" ]]; then
    setup_token="$(openssl rand -hex 16)"
  fi

  printf "${YELLOW}Setting up BrowserBox on $setup_hostname:$setup_port...${NC}\n"
  if [[ -n "$zeta_mode" ]] && [[ "$setup_hostname" == "localhost" ]]; then
    printf "${YELLOW}localhost is incompatible with zeta mode due to widespread conventions against *.localhost subdomains. Changing hostname to bbx.test\n"
    setup_hostname="bbx.test"
  fi
  if [[ "$setup_hostname" == *".local" ]] && [[ "$(uname -s)" == "Darwin" ]]; then
    printf "${YELLOW}On macOS .local domains are incompatible as they are reserved for Apple's Bonjour mDNS service.\n"
    read -r -p "Enter a new hostname: " new_hostname
    if [[ "$new_hostname" == *".local" ]]; then 
      new_hostname="${new_hostname}.test"
    fi
    setup_hostname="${new_hostname}"
  fi
  if [[ -n "${BBX_CLOUD_RUN:-}" ]] || [[ "${BBX_FLY:-}" == "true" ]]; then
    printf "${YELLOW}Cloud/Fly detected; skipping /etc/hosts and TLS setup.${NC}\n"
  else
    if ! is_local_hostname "$setup_hostname"; then
      printf "${BLUE}DNS Note:${NC} Ensure an A/AAAA record points from $setup_hostname to this machine's IP.\n"
      wait_for_hostname "$setup_hostname" || { printf "${RED}Hostname $setup_hostname not resolving${NC}\n"; exit 1; }
    else
      ensure_hosts_entry "$setup_hostname"
    fi
    
    if [[ "$backend_scheme" == "http" ]]; then
      printf "${YELLOW}HTTP backend selected; skipping TLS certificate setup for %s.${NC}\n" "$setup_hostname"
    else
      EMAIL="${EMAIL}" BB_USER_EMAIL="${EMAIL}" tls "$setup_hostname" || { printf "${RED}Hostname $setup_hostname certificate not acquired${NC}\n"; exit 1; }
    fi
  fi

  # Ensure we have a valid product key
  if ! validate_license_key; then
    printf "${RED}License key invalid or missing. Run 'bbx activate' or go to dosaygo.com to get a valid key.${NC}\n"
  fi

  pkill ncat &>/dev/null;
  for i in {-2..2}; do
    test_port_access $((setup_port+i)) || { printf "${RED}Quit software using these ports, or adjust firewall to allow ports $((setup_port-2))-$((setup_port+2))/tcp${NC}\n"; exit 1; }
  done
  test_port_access $((setup_port-3000)) || { printf "${RED}CDP port $((setup_port-3000)) blocked${NC}\n"; exit 1; }

  # Persist hostname so save_config (EXIT trap) writes it to disk
  BBX_HOSTNAME="$setup_hostname"

  # Build the command arguments for setup_bbpro
  local setup_args=("--port" "$setup_port" "--token" "$setup_token")
  if [[ -n "$zeta_mode" ]]; then
    setup_args+=("--zeta")
  fi
  if [[ -n "$backend_scheme" ]]; then
    setup_args+=("--backend" "$backend_scheme")
  fi

  # Call setup_bbpro, which writes to test.env
  BBX_HOSTNAME="${BBX_HOSTNAME}" BBX_MINIMAL_MODE="${BBX_MINIMAL_MODE:-}" LICENSE_KEY="${LICENSE_KEY}" setup_bbpro "${setup_args[@]}" || { printf "${RED}Setup failed${NC}\n"; exit 1; }

  # Append flipbook recording env vars to test.env if requested
  if [[ -n "$flipbook_record_dir" ]]; then
    # Resolve to absolute path
    flipbook_record_dir="$(cd "$(dirname "$flipbook_record_dir")" 2>/dev/null && pwd)/$(basename "$flipbook_record_dir")"
    mkdir -p "$flipbook_record_dir" || { printf "${RED}Cannot create flipbook directory: $flipbook_record_dir${NC}\n"; exit 1; }
    printf '\nexport BBX_FLIPBOOK_DIR="%s"\n' "$flipbook_record_dir" >> "${BB_CONFIG_DIR}/test.env"
    if [[ -n "$flipbook_description" ]]; then
      printf 'export BBX_FLIPBOOK_DESCRIPTION="%s"\n' "$flipbook_description" >> "${BB_CONFIG_DIR}/test.env"
    fi
    printf "${GREEN}Flipbook recording enabled → %s${NC}\n" "$flipbook_record_dir"
  fi

  # After setup_bbpro succeeds, reload config to get the new runtime values
  load_config

  printf "${GREEN}Setup complete.${NC}\n"
  draw_box "Login Link: $(cat "$BB_CONFIG_DIR/login.link" 2>/dev/null || echo "https://$setup_hostname:$setup_port/login?token=$setup_token")"
  if [[ -n "$zeta_mode" ]]; then
    printf "${PURPLE}[ZETA MODE]${NC}${BOLD} Your login link above WILL change. Await the run command for your correct login link.\n"
  fi
}

restart() {
  stop;
  run;
}

run() {
  banner

  if _bbx_for_active; then
    _for_run "$@"
    return $?
  fi

  load_config
  ensure_installation_id

  # Cleanse stale stop sentinel (e.g. from a crash during previous stop)
  rm -f "$STOP_SENTINEL"

  # Ensure setup has been run
  if [ -z "$PORT" ] || [ -z "$BBX_HOSTNAME" ] || [[ ! -f "${BB_CONFIG_DIR}/test.env" ]] ; then
    printf "${YELLOW}BrowserBox not fully set up. Running 'bbx setup' first...${NC}\n"
    setup "$@" # Pass arguments to setup
    load_config
    # After setup, the values in test.env are the source of truth, so we don't need to re-parse args
    # But if setup calls run (like in ng_run), we need to avoid an infinite loop.
    # The setup function now handles this flow.
    if [[ "${FUNCNAME[1]}" != "main" && "${FUNCNAME[1]}" != "" ]]; then
      return 0
    fi
  fi

  local zeta_mode="${HOST_PER_SERVICE}"
  local http_only="${BBX_HTTP_ONLY}"

  if [[ -n "$zeta_mode" ]] && [[ ! -f "${BB_CONFIG_DIR}/hosts.env" ]]; then
    printf "${RED}No hosts file: --zeta mode requires a hosts.env file in your config directory (${BB_CONFIG_DIR}).${NC}\n"
    exit 1
  fi

  # Default values from loaded config
  local port="${PORT}"
  local hostname="${BBX_HOSTNAME}"
  local run_args=() # Store args to pass to bbpro

  # Parse arguments to override config for this run only
  local temp_args=("$@")
  local clean_args=()
  for arg in "${temp_args[@]}"; do
      # This is a simple way to filter out --port from being passed to bbpro
      # A more robust solution would handle --port=value too
      if [[ "$arg" != "--port" && "$arg" != "-p" && ! "$arg" =~ ^[0-9]+$ ]]; then
          clean_args+=("$arg")
      fi
  done


  while [ $# -gt 0 ]; do
    case "$1" in
      --port|-p)
        if [ -z "$2" ]; then
          printf "${RED}Error: Option $1 requires an argument${NC}\n"
          printf "Usage: bbx run [--port|-p <port>] [--hostname|-h <hostname>]\n"
          exit 1
        fi
        port="$2"
        shift 2
        ;;
      --hostname|-h)
        if [ -z "$2" ]; then
          printf "${RED}Error: Option $1 requires an argument${NC}\n"
          printf "Usage: bbx run [--port|-p <port>] [--hostname|-h <hostname>]\n"
          exit 1
        fi
        hostname="$2"
        shift 2
        ;;
      *)
        # Pass unknown args to bbpro
        run_args+=("$1")
        shift
        ;;
    esac
  done

  hostname="$(normalize_hostname_for_local_use "$hostname")"

  # Use the determined port and hostname for this run
  PORT="$port"
  BBX_HOSTNAME="$hostname"

  if [[ -z "${LICENSE_KEY:-}" ]]; then
    printf "${RED}No LICENSE_KEY found for this shell/session.${NC}\n"
    printf "${YELLOW}Set LICENSE_KEY in env or run 'bbx certify' once to persist it in ${CONFIG_FILE}.${NC}\n"
    exit 1
  fi

  if [[ -n "$zeta_mode" ]]; then
    printf "${PURPLE}[ZETA MODE] BrowserBox is running with a tunnel or reverse-proxy.${NC}\n"
  fi
  printf "${YELLOW}Starting BrowserBox on $hostname:$port...${NC}\n"

  if ! is_local_hostname "$hostname"; then
    printf "${BLUE}DNS Note:${NC} Ensure an A/AAAA record points from $hostname to this machine's IP.\n"
    wait_for_hostname "$hostname" || { printf "${RED}Hostname $hostname not resolving${NC}\n"; exit 1; }
  else
    ensure_hosts_entry "$hostname"
  fi

  export HOST_PER_SERVICE BBX_HTTP_ONLY;
  # Use python3 for ms precision; fall back to seconds on systems without it
  _ms() { python3 -c 'import time; print(int(time.time()*1000))' 2>/dev/null || echo $(( $(date +%s) * 1000 )); }
  local _run_t0; _run_t0=$(_ms)

  # Run bbcertify in background so reservation.json is written while bbpro launches.
  # The binary's validateLicense polls for reservation.json on retry, so even if bbpro
  # wins the race the binary will pick up the file within a few seconds.
  export LICENSE_KEY;
  local cert_log; cert_log="$(rm -f /tmp/bbx-certify-XXXXXX.log 2>/dev/null; mktemp /tmp/bbx-certify-XXXXXX.log)"
  printf "${YELLOW}[startup] Certifying license...${NC}\n"
  bash -c "export LICENSE_KEY=\"$LICENSE_KEY\"; export BBX_NONINTERACTIVE=true; bbcertify" > "$cert_log" 2>&1 &
  local CERT_PID=$!

  # Start bbpro — keep stderr visible so failures aren't silent
  printf "${YELLOW}[startup] Starting BrowserBox services...${NC}\n"
  local bbpro_log; bbpro_log="$(rm -f /tmp/bbx-bbpro-XXXXXX.log 2>/dev/null; mktemp /tmp/bbx-bbpro-XXXXXX.log)"
  local bbpro_rc
  if [[ -n ${BBX_DEBUG:-} ]]; then
    BBX_DEBUG="$BBX_DEBUG" env BBX_NONINTERACTIVE=true bbpro "${run_args[@]}" 2>&1 | tee "$bbpro_log"
    bbpro_rc=${PIPESTATUS[0]}
  else
    env BBX_NONINTERACTIVE=true bbpro "${run_args[@]}" > "$bbpro_log" 2>&1
    bbpro_rc=$?
  fi
  if [[ "$bbpro_rc" -ne 0 ]]; then
    printf "${RED}Failed to start BrowserBox (exit %d). Last output:${NC}\n" "$bbpro_rc"
    tail -20 "$bbpro_log"
    rm -f "$bbpro_log"
    kill "$CERT_PID" 2>/dev/null; rm -f "$cert_log"
    exit 1
  fi
  rm -f "$bbpro_log"
  [[ -n "${BBX_DEBUG:-}" ]] && printf "${YELLOW}[startup] bbpro returned at $(( $(_ms) - _run_t0 ))ms${NC}\n"

  # Wait for background certification to complete (bounded: 120s)
  printf "${YELLOW}[startup] Waiting for license certification...${NC}\n"
  local _cert_t0; _cert_t0=$SECONDS
  local _cert_timeout=120
  while kill -0 "$CERT_PID" 2>/dev/null; do
    if (( SECONDS - _cert_t0 >= _cert_timeout )); then
      printf "${RED}License certification timed out after %ds.${NC}\n" "$_cert_timeout"
      printf "${YELLOW}Cert log:${NC}\n"
      tail -20 "$cert_log"
      kill "$CERT_PID" 2>/dev/null
      rm -f "$cert_log"
      bbx stop 2>/dev/null || true
      exit 1
    fi
    sleep 1
  done
  # Collect exit status
  if ! wait "$CERT_PID"; then
    printf "${RED}License check failed. Run 'bbx activate' or go to dosaygo.com. Stopping BrowserBox...${NC}\n"
    printf "${YELLOW}Cert log:${NC}\n"
    tail -20 "$cert_log"
    rm -f "$cert_log"
    bbx stop 2>/dev/null || true
    exit 1
  fi
  rm -f "$cert_log"
  printf "${GREEN}[startup] License certified.${NC}\n"
  if [[ -f "$CERT_META_FILE" ]]; then
    # shellcheck disable=SC1090
    source "$CERT_META_FILE"
    export BBX_RESERVATION_CODE BBX_RESERVED_SEAT_ID BBX_TICKET_ID BBX_TICKET_SLOT
  fi

  # Reload config to get the final token from the newly created test.env
  load_config

  local login_link=""
  local login_scheme="https"
  if [[ -n "$http_only" ]]; then
    login_scheme="http"
  fi
  if [[ -n "$zeta_mode" ]]; then
    source "${BB_CONFIG_DIR}/hosts.env"
    local addr_var_name="ADDR_${PORT}"
    local zeta_host="${!addr_var_name}"

    if [[ -z "$zeta_host" ]]; then
      printf "${RED}Error: Could not find host for port ${PORT} in hosts.env file (variable ${addr_var_name}).${NC}\n" >&2
      exit 1
    fi
    login_link="${login_scheme}://${zeta_host}/login?token=${TOKEN}"
    echo "$login_link" > "${BB_CONFIG_DIR}/login.link"
  else
    # Always construct the local link from the current hostname/port.
    # Do NOT read login.link here — it may contain a stale CF/tor URL
    # from a previous cf-run or tor-run which would show a broken link.
    login_link="${login_scheme}://${hostname}:${port}/login?token=${TOKEN}"
    echo "$login_link" > "${BB_CONFIG_DIR}/login.link"
  fi

  draw_box "Login Link: ${login_link}"
  if [[ -n "$zeta_mode" ]]; then
    printf "${PURPLE}[ZETA MODE] Your Zeta Mode Login Link is above.${NC}\n\n"
  fi
  if [[ -n "${BBX_FLIPBOOK_DIR:-}" ]]; then
    printf "${YELLOW}  ■ Flipbook recording to: ${BBX_FLIPBOOK_DIR}${NC}\n"
  fi
}

tor_run() {
  banner
  load_config
  ensure_deps

  local anonymize=true onion=true
  while [ $# -gt 0 ]; do
    case "$1" in
      --anonymize) anonymize=true; shift ;;
      --clearnet-only) anonymize=false; shift ;;
      --no-darkweb) anonymize=false; shift ;;
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
  if [ -z "$PORT" ] || [ -z "$BBX_HOSTNAME" ] || [[ ! -f "${BB_CONFIG_DIR}/test.env" ]] ; then
    printf "${YELLOW}BrowserBox not fully set up. Running 'bbx setup' first...${NC}\n"
    setup
    load_config
  fi

  [ -n "$TOKEN" ] || TOKEN=$(openssl rand -hex 16)
  printf "${YELLOW}Starting BrowserBox with ${NC}${PURPLE}Tor${NC}${YELLOW}...${NC}\n"
  ensure_setup_tor "$(whoami)"

  # Find Tor cookie file dynamically across platforms
  COOKIE_AUTH_FILE=$(find_tor_cookie)
  if [[ -z "$COOKIE_AUTH_FILE" ]]; then
    # Fallback to expected locations if not found
    if [[ "$(uname -s)" == "Darwin" ]]; then
      TORDIR="$(brew --prefix)/var/lib/tor"
    else
      TORDIR="/var/lib/tor"
    fi
    COOKIE_AUTH_FILE="$TORDIR/control_auth_cookie"
    printf "${YELLOW}Warning: Tor cookie file not found in common locations. Expected at: $COOKIE_AUTH_FILE${NC}\n"
  else
    TORDIR="$(dirname "$COOKIE_AUTH_FILE")"
    printf "${GREEN}Found Tor cookie at: $COOKIE_AUTH_FILE${NC}\n"
  fi

  # Determine Tor group dynamically
  if [[ "$(uname -s)" == "Darwin" ]]; then
      TOR_GROUP="admin"  # Homebrew default
  else
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

  # Backup test.env before any tor-related setup so 'bbx stop' can restore it.
  # Use -n (no-clobber) so a second tor-run doesn't overwrite a valid backup.
  local _pretor_backup="${BB_CONFIG_DIR}/test.env.pre-tor"
  if [[ -f "${BB_CONFIG_DIR}/test.env" && ! -f "$_pretor_backup" ]]; then
    cp "${BB_CONFIG_DIR}/test.env" "$_pretor_backup"
    printf "${YELLOW}Backed up test.env → test.env.pre-tor${NC}\n"
  fi

  # For --no-onion mode: use a plain setup so existing TLS certs and DOMAIN are
  # preserved. TOR_PROXY is injected into test.env after setup.
  # For full --onion mode: pass --ontor so setup_bbpro configures tor-sslcerts;
  # torbb will override SSLCERTS_DIR per-onion address via torbb.env.
  local setup_cmd="setup_bbpro --port $PORT --token $TOKEN"
  if $anonymize && $onion; then
      setup_cmd="$setup_cmd --ontor"
  fi
  if ! $onion && ! is_local_hostname "$BBX_HOSTNAME"; then
      wait_for_hostname "$BBX_HOSTNAME" || { printf "${RED}Hostname $BBX_HOSTNAME not resolving${NC}\n"; exit 1; }
  elif ! $onion; then
      ensure_hosts_entry "$BBX_HOSTNAME"
  fi
  BBX_MINIMAL_MODE="${BBX_MINIMAL_MODE:-}" LICENSE_KEY="${LICENSE_KEY}" $setup_cmd || { printf "${RED}Setup failed${NC}\n"; exit 1; }

  # Inject TOR_PROXY for --no-onion+anonymize (regular setup leaves it empty).
  if $anonymize && ! $onion; then
    local _tor_proxy_url
    _tor_proxy_url="$(_bbx_tor_socks_url)"
    if grep -q "^export TOR_PROXY=" "${BB_CONFIG_DIR}/test.env"; then
      _bbx_sed_inplace "s|^export TOR_PROXY=.*|export TOR_PROXY=\"${_tor_proxy_url}\"|" "${BB_CONFIG_DIR}/test.env"
    else
      printf '\nexport TOR_PROXY="%s"\n' "${_tor_proxy_url}" >> "${BB_CONFIG_DIR}/test.env"
    fi
    export TOR_PROXY="$_tor_proxy_url"
    printf "${GREEN}TOR_PROXY → ${_tor_proxy_url}${NC}\n"
  fi

  source "${BB_CONFIG_DIR}/test.env" && PORT="${APP_PORT:-$PORT}" && TOKEN="${LOGIN_TOKEN:-$TOKEN}" || { printf "${YELLOW}Warning: test.env not found${NC}\n"; }
  # Validate existing product key
  export LICENSE_KEY;
  certout="$(bash -c "export LICENSE_KEY=\"$LICENSE_KEY\"; bbcertify 2>&1")"
  if [[ "$?" -ne 0 ]]; then
    printf "${RED}License key invalid or missing. Run 'bbx activate' or go to dosaygo.com to get a valid key.${NC}\n"
    echo "Certification output: $certout"
    exit 1
  else
    printf "${GREEN}Certification complete.${NC}\n"
    if [[ -f "$CERT_META_FILE" ]]; then
      # shellcheck disable=SC1090
      source "$CERT_META_FILE"
      export BBX_RESERVATION_CODE BBX_RESERVED_SEAT_ID BBX_TICKET_ID BBX_TICKET_SLOT
    fi
  fi

  local login_link=""
  local _tor_max_retries=3
  local _tor_attempt=0
  local _tor_success=false

  if $onion; then
    # Step 1: Start torbb (retry loop for setup/startup only)
    while [ $_tor_attempt -lt $_tor_max_retries ]; do
      _tor_attempt=$((_tor_attempt + 1))
      if [ $_tor_attempt -gt 1 ]; then
        printf "${YELLOW}Tor-run attempt ${_tor_attempt}/${_tor_max_retries}...${NC}\n"
        # Clean stop before retry
        run_quietly stop_bbpro || true
        sleep 3
      fi

      printf "${YELLOW}Running as onion site...${NC}\n"
      login_link=""
      if $in_tor_group; then
          login_link="$(torbb)" || true
      elif command -v sg >/dev/null 2>&1; then
          export BB_CONFIG_DIR BBX_DEBUG
          login_link="$($SUDO -u ${SUDO_USER:-$USER} sg "$TOR_GROUP" -c "env PATH=\"$PATH\" BB_CONFIG_DIR=\"$BB_CONFIG_DIR\" BBX_RESERVATION_CODE=\"$BBX_RESERVATION_CODE\" BBX_RESERVED_SEAT_ID=\"$BBX_RESERVED_SEAT_ID\" BBX_TICKET_ID=\"$BBX_TICKET_ID\" BBX_TICKET_SLOT=\"$BBX_TICKET_SLOT\" bash -cl torbb")" || true
      else
          login_link="$(torbb)" || true
      fi

      if [ -z "$login_link" ]; then
        printf "${RED}torbb failed (attempt ${_tor_attempt}/${_tor_max_retries})${NC}\n"
        [ -f "${BB_CONFIG_DIR}/torbb_errors.txt" ] && tail -n 5 "${BB_CONFIG_DIR}/torbb_errors.txt"
        continue
      fi

      TEMP_HOSTNAME=$(echo "$login_link" | sed 's|https://\([^/]*\)/login?token=.*|\1|')
      _tor_success=true
      break
    done

    if ! $_tor_success; then
      printf "${RED}Failed to start Tor onion service after ${_tor_max_retries} attempts${NC}\n"
      exit 1
    fi
  else
      pkill ncat &>/dev/null
      for i in {-2..2}; do
          test_port_access $((PORT+i)) || { printf "${RED}Quit software using these ports, or adjust firewall for ports $((PORT-2))-$((PORT+2))/tcp${NC}\n"; exit 1; }
      done
      test_port_access $((PORT-3000)) || { printf "${RED}CDP port $((PORT-3000)) blocked${NC}\n"; exit 1; }
      bbpro || { printf "${RED}Failed to start${NC}\n"; exit 1; }
      login_link="https://${BBX_HOSTNAME}:${PORT}/login?token=${TOKEN}"
      echo "$login_link" > "${BB_CONFIG_DIR}/login.link"
  fi

  # Gate: ensure BrowserBox is listening before continuing (both onion and clearnet paths)
  wait_for_local_ready "$PORT" https 90 || {
    printf "${RED}BrowserBox never became ready on port ${PORT}${NC}\n"
    run_quietly stop_bbpro || true
    exit 1
  }

  # Step 2: Show the login link immediately
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

  # Step 3: Tor bootstrap connectivity check
  if ! [ -r "$COOKIE_AUTH_FILE" ] && ! $SUDO test -r "$COOKIE_AUTH_FILE"; then
      printf "${YELLOW}Warning: Tor cookie file ($COOKIE_AUTH_FILE) not accessible. Skipping status check.${NC}\n"
  else
      show_tor_status
  fi

  # Step 4: Verify onion service is reachable via Tor SOCKS proxy
  if $onion && [ -n "$login_link" ]; then
    printf "${YELLOW}Verifying onion service reachability...${NC}\n"
    local _tor_verify_ok=false
    local _tor_verify_elapsed=0
    local _tor_verify_max=180
    local _tor_verify_interval=5
    local _tor_probe_count=0
    local _tor_total_probes=$((_tor_verify_max / _tor_verify_interval))
    local _tor_verify_started
    local _tor_verify_now
    _tor_verify_started="$(date +%s)"
    while true; do
      _tor_verify_now="$(date +%s)"
      _tor_verify_elapsed=$((_tor_verify_now - _tor_verify_started))
      if [ $_tor_verify_elapsed -ge $_tor_verify_max ]; then
        break
      fi
      _tor_probe_count=$((_tor_probe_count + 1))
      local _pct=$((_tor_verify_elapsed * 100 / _tor_verify_max))
      local _bar_w=30
      local _filled=$((_pct * _bar_w / 100))
      local _empty=$((_bar_w - _filled))
      printf "\r${YELLOW}Onion reachability: [${GREEN}"
      for ((i = 0; i < _filled; i++)); do printf "█"; done
      printf "${NC}"
      for ((i = 0; i < _empty; i++)); do printf " "; done
      printf "${NC}] %3d%% (probe %d, %ds/${_tor_verify_max}s)" "$_pct" "$_tor_probe_count" "$_tor_verify_elapsed"
      local _tor_http_code
      _tor_http_code="$(curl -s -k -L \
        --connect-timeout 15 --max-time 25 \
        --output /dev/null -w '%{http_code}' \
        --proxy "socks5h://127.0.0.1:9050" "$login_link" 2>/dev/null)" || true
      if [[ "$_tor_http_code" =~ ^(200|302)$ ]]; then
        printf "\r${YELLOW}Onion reachability: [${GREEN}"
        for ((i = 0; i < _bar_w; i++)); do printf "█"; done
        printf "${NC}] 100%%                              \n"
        printf "${GREEN}Onion service reachable (HTTP %s)${NC}\n" "$_tor_http_code"
        _tor_verify_ok=true
        break
      fi
      sleep "$_tor_verify_interval"
    done
    if ! $_tor_verify_ok; then
      printf "\n${YELLOW}Warning: Onion service not reachable after ${_tor_verify_max}s. It may still be propagating.${NC}\n"
    fi
  fi
}

zt_run() {
    banner
    load_config
    ensure_deps
    printf "${BLUE}Starting BrowserBox with ZeroTier SSH tunnel...${NC}\n"

    # 1. Ensure BBX is set up; run `setup` if needed.
    if [[ -z "$PORT" || -z "$BBX_HOSTNAME" || ! -f "${BB_CONFIG_DIR}/test.env" ]]; then
        printf "${YELLOW}BrowserBox not fully set up. Running 'bbx setup' first...${NC}\n"
        # Pass only port and hostname args to setup, filter others
        local setup_args=()
        for i in "$@"; do
            [[ "$i" == -p* || "$i" == --port* ]] && setup_args+=("$i")
        done
        setup "${setup_args[@]}"
        load_config # Reload config after setup
    fi

    # 2. Get ZeroTier Network ID from user
    local zt_network_id
    read -r -p "Enter your ZeroTier Network ID: " zt_network_id
    if [[ ! "$zt_network_id" =~ ^[a-fA-F0-9]{16}$ ]]; then
        printf "${RED}Invalid ZeroTier Network ID format.${NC}\n"
        exit 1
    fi

    # 3. Server-side ZeroTier setup
    printf "${YELLOW}Preparing server with ZeroTier...${NC}\n"
    if ! command -v setup_zerotier &>/dev/null; then
        printf "${RED}Setup script setup_zerotier not found. Your installation may be corrupt.${NC}\n"
        exit 1
    fi
    # The setup_zerotier script now only handles ZT installation and basic SSH server checks.
    $SUDO setup_zerotier "$(whoami)" "none" || {
        printf "${RED}Server-side ZeroTier setup failed.${NC}\n"
        exit 1
    }

    # 4. Join the network and get the IP
    printf "${YELLOW}Joining ZeroTier network: $zt_network_id...${NC}\n"
    $SUDO zerotier-cli join "$zt_network_id" || {
        printf "${RED}Failed to join ZeroTier network.${NC}\n"
        exit 1
    }

    local zt_ip=""
    printf "${YELLOW}Waiting for IP address on ZeroTier network... (You may need to authorize this machine in ZeroTier Central)${NC}\n"
    for i in {1..60}; do
        zt_ip=$($SUDO zerotier-cli -j listnetworks | jq -r --arg netid "$zt_network_id" '.[] | select(.nwid==$netid) | .assignedAddresses[]?' | grep -E '^[0-9.]+' | cut -d'/' -f1 | head -n1)
        if [[ -n "$zt_ip" ]]; then
            printf "${GREEN}Got ZeroTier IP: $zt_ip${NC}\n"
            break
        fi
        sleep 2
    done
    if [[ -z "$zt_ip" ]]; then
        printf "${RED}Failed to get an IP address from ZeroTier network. Please authorize this machine in your ZeroTier Central dashboard.${NC}\n"
        exit 1
    fi

    # 6. Generate SSH key pair for secure connection
    local ssh_key_dir="${HOME}/.bbx_zt_ssh"
    local ssh_key_file="${ssh_key_dir}/bbx_zt_key"
    mkdir -p "$ssh_key_dir"
    chmod 700 "$ssh_key_dir"

    printf "${YELLOW}Generating SSH key pair for secure connection...${NC}\n"
    rm -f "$ssh_key_file" "$ssh_key_file.pub"
    ssh-keygen -t ed25519 -f "$ssh_key_file" -N "" -q -C "browserbox-zerotier-tunnel"

    # Add the public key to authorized_keys
    mkdir -p "${HOME}/.ssh"
    chmod 700 "${HOME}/.ssh"
    cat "${ssh_key_file}.pub" >> "${HOME}/.ssh/authorized_keys"
    chmod 600 "${HOME}/.ssh/authorized_keys"

    # 7. Create SSL cert directory
    mkdir -p "${HOME}/sslcerts"
    chmod 700 "${HOME}/sslcerts"

    # 8. Setup BrowserBox with correct hostname
    local tunnel_hostname="bbx.zerotier.test"
    local p_main="${PORT:-8080}" # Use configured port or default

    bbx setup --port $p_main --hostname "$tunnel_hostname"

    # Validate LICENSE_KEY via bbcertify
    export LICENSE_KEY
    certout="$(bash -c "export LICENSE_KEY=\"$LICENSE_KEY\"; bbcertify 2>&1")"
    if [[ "$?" -ne 0 ]]; then
      printf "${RED}License key invalid or missing. Run 'bbx activate' or go to dosaygo.com to get a valid key.${NC}\n"
      echo "Certification output: $certout"
      exit 1
    else
      printf "${GREEN}Certification complete.${NC}\n"
    fi

    # 9. Construct and save the "single shot" script for the user
    local user_at_host="$(whoami)@$zt_ip"
    local connect_script_path="$HOME/connect_bbx_zt.sh"

    # Using a HEREDOC to create the script content
    read -r -d '' connect_script <<EOF
#!/usr/bin/env bash
# This script connects you to your remote BrowserBox via a ZeroTier SSH tunnel.

set -e
export tunnel_host="$tunnel_hostname"
export remote_user_at_host="$user_at_host"
export remote_port="$p_main"
export remote_zt_network_id="$zt_network_id"
export bbx_license_key="$LICENSE_KEY"

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Function to check if a local port is in use
is_port_in_use() {
    local port=\$1
    if lsof -i :"\$port" >/dev/null 2>&1 || netstat -an | grep -q "[\.:]\$port "; then
        return 0 # In use
    else
        return 1 # Not in use
    fi
}

cleanup() {
    echo -e "\n\${YELLOW}Cleaning up...${NC}"
    # Kill the SSH tunnel process
    if [ -n "\$tunnel_pid" ]; then
        kill \$tunnel_pid 2>/dev/null || true
        echo "SSH tunnel process killed."
    fi
    # Remove the /etc/hosts entry
    if sudo grep -q "127.0.0.1 \$tunnel_host" /etc/hosts; then
        echo -e "\${YELLOW}Removing '\$tunnel_host' from /etc/hosts (requires sudo)...${NC}"
        sudo sed -i.bak "/127.0.0.1 \$tunnel_host/d" /etc/hosts
    fi
    # Remove temp files
    if [ -n "\$cert_dir" ]; then
        rm -rf "\$cert_dir"
    fi
    echo -e "\${GREEN}Cleanup complete.${NC}"
}

# Trap to run cleanup on exit
trap cleanup EXIT INT TERM

# Check for local dependencies (ZT, mkcert)
if ! command -v zerotier-cli >/dev/null; then
    echo -e "\${YELLOW}Installing ZeroTier on your local machine...${NC}"
    if [[ "\$(uname -s)" == "Darwin" ]] && command -v brew >/dev/null; then
        brew install zerotier
    else
        echo -e "\${YELLOW}Installing ZeroTier using curl | sudo bash${NC}"
        curl -s https://install.zerotier.com | sudo bash
    fi
fi
if ! command -v mkcert >/dev/null; then
    echo -e "\${YELLOW}Installing mkcert on your local machine...${NC}"
    if [[ "\$(uname -s)" == "Darwin" ]] && command -v brew >/dev/null; then
        brew install mkcert && brew install nss
    else
        echo -e "\${RED}Please install mkcert from https://mkcert.dev\${NC}"
        exit 1
    fi
fi

# Check for available ports
for p in "\$remote_port" "\$((remote_port - 2))" "\$((remote_port - 1))" "\$((remote_port + 1))"; do
    if is_port_in_use "\$p"; then
        echo -e "\${RED}Error: Local port \$p is already in use. Please free it up and re-run the command.\${NC}"
        exit 1
    fi
done
echo -e "\${GREEN}Required local ports are free.\${NC}"

# Create temporary directory for certificates
cert_dir=\$(mktemp -d)

# Generate certificates
echo -e "\${YELLOW}Generating SSL certificates for \$tunnel_host...${NC}"
cd "\$cert_dir"
mkcert -install
mkcert -cert-file fullchain.pem -key-file privkey.pem "\$tunnel_host" localhost 127.0.0.1
echo -e "\${GREEN}Certificates generated.${NC}"

# Add hostname to /etc/hosts
echo -e "\${YELLOW}Adding '\$tunnel_host' to /etc/hosts (requires sudo)...${NC}"
if ! grep -q "127.0.0.1 \$tunnel_host" /etc/hosts; then
    echo "127.0.0.1 \$tunnel_host" | sudo tee -a /etc/hosts >/dev/null
fi

# Join the ZeroTier network
echo -e "\${YELLOW}Joining ZeroTier network (requires sudo)...${NC}"
if ! sudo zerotier-cli listnetworks | grep -q "\$remote_zt_network_id"; then
    sudo zerotier-cli join "\$remote_zt_network_id"
    echo "Waiting for local machine to join network... (You may need to authorize it in ZeroTier Central)"
    sleep 5
fi

# Copy certificates to server
echo -e "\${YELLOW}Copying SSL certificates to server...${NC}"
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "\$remote_user_at_host" "mkdir -p ~/sslcerts && chmod 700 ~/sslcerts"
scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "\$cert_dir/fullchain.pem" "\$cert_dir/privkey.pem" "\$remote_user_at_host:~/sslcerts/"
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "\$remote_user_at_host" "chmod 600 ~/sslcerts/fullchain.pem ~/sslcerts/privkey.pem"

# Start remote BrowserBox and the SSH tunnel in the background
echo -e "\${YELLOW}Starting remote BrowserBox and SSH tunnel...${NC}"
ssh -T -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \\
    -L "\${remote_port}:127.0.0.1:\${remote_port}" \\
    -L "\$((remote_port - 2)):127.0.0.1:\$((remote_port - 2))" \\
    -L "\$((remote_port - 1)):127.0.0.1:\$((remote_port - 1))" \\
    -L "\$((remote_port + 1)):127.0.0.1:\$((remote_port + 1))" \\
    "\$remote_user_at_host" \\
    "export LICENSE_KEY='\$bbx_license_key' ; bbx run; sleep 30000" &

tunnel_pid=\$!
echo "SSH tunnel process started with PID: \$tunnel_pid"

sleep 8
echo -e "\${GREEN}Tunnel established!${NC}"
loginLink="\$(ssh -T -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "\$remote_user_at_host" "cat ~/.config/dosaygo/bbpro/login.link")"
printf "\nAccess BrowserBox at: \${GREEN}\${loginLink}\${NC}\n\n"
echo -e "This script will keep the tunnel alive. Press \${YELLOW}Ctrl+C\${NC} to stop."

# Wait for the tunnel process to exit
wait "\$tunnel_pid"

EOF

    # Save the script to the file on the remote server
    echo "$connect_script" > "$connect_script_path"
    chmod +x "$connect_script_path"
    printf "${GREEN}Connection script saved to '$connect_script_path' on this server.${NC}\n"

    # 10. Base64 encode the private key for the one-liner
    local encoded_key=$(cat "$ssh_key_file" | base64 -w 0)

    # 11. Display the one-liner for the user
    printf "\n"
    draw_box "Your ZeroTier tunnel is ready! Run this on your LOCAL machine:"

    # The one-liner command that handles the private key
    local one_liner="TEMP_KEY=\$(mktemp) && echo \"$encoded_key\" | base64 -d > \$TEMP_KEY && chmod 600 \$TEMP_KEY && bash <(ssh -i \$TEMP_KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${user_at_host} 'cat ${connect_script_path}') && rm \$TEMP_KEY"

    # Print the command inside a visually distinct block
    printf "${YELLOW}--- Copy and paste the command below into your local terminal ---${NC}\n\n"
    printf "${one_liner}\n\n"

    # Keep the script running so the server stays up
    printf "\n${CYAN}Server is waiting for connection. Press Ctrl+C here to shut down the server process and the tunnel.${NC}\n"
    tail -f /dev/null &
    wait $!
}

cf_run() {
  banner
  load_config
  ensure_deps
  ensure_cloudflared || { printf "${RED}Failed to install cloudflared${NC}\n"; exit 1; }

  printf "${CYAN}Starting BrowserBox with Cloudflare Quick Tunnel...${NC}\n"

  # Parse arguments
  local port=""
  local background_mode=""
  while [ $# -gt 0 ]; do
    case "$1" in
      --port|-p)
        if [ -z "$2" ]; then
          printf "${RED}Error: Option $1 requires an argument${NC}\n"
          printf "Usage: bbx cf-run [--port|-p <port>] [--background|-d]\n"
          exit 1
        fi
        port="$2"
        shift 2
        ;;
      --background|-d)
        background_mode="true"
        shift
        ;;
      *)
        printf "${RED}Unknown option: $1${NC}\n"
        printf "Usage: bbx cf-run [--port|-p <port>] [--background|-d]\n"
        exit 1
        ;;
    esac
  done

  # Kill any existing CF tunnel started by bbx before starting a new one
  kill_cf_tunnel

  # Default to find_free_port_block or loaded PORT if no port specified
  if [ -z "$port" ]; then
    port="${PORT:-$(find_free_port_block)}"
  fi

  # Ensure a fresh token
  [ -n "$TOKEN" ] || TOKEN=$(openssl rand -hex 16)

  # Test the 5-port block and CDP port
  printf "${YELLOW}Testing port block ${port}...${NC}\n"
  for i in {-2..2}; do
    test_port_access $((port+i)) || {
      printf "${RED}Port $((port+i)) is not accessible. Quit software using these ports, or adjust firewall for ports $((port-2))-$((port+2))/tcp${NC}\n"
      exit 1
    }
  done
  test_port_access $((port-3000)) || {
    printf "${RED}CDP port $((port-3000)) blocked${NC}\n"
    exit 1
  }

  # Run minimal setup using setup_bbpro with HTTP backend
  printf "${YELLOW}Setting up BrowserBox on port ${port} with HTTP backend...${NC}\n"
  BBX_MINIMAL_MODE="${BBX_MINIMAL_MODE:-}" LICENSE_KEY="${LICENSE_KEY}" setup_bbpro --port "$port" --token "$TOKEN" --backend http || {
    printf "${RED}Setup failed${NC}\n"
    exit 1
  }

  # Reload config to get PORT and TOKEN from test.env
  source "${BB_CONFIG_DIR}/test.env" && PORT="${APP_PORT:-$port}" && TOKEN="${LOGIN_TOKEN:-$TOKEN}" || {
    printf "${YELLOW}Warning: test.env not found${NC}\n"
  }

  # Validate LICENSE_KEY via bbcertify
  export LICENSE_KEY
  certout="$(bash -c "export LICENSE_KEY=\"$LICENSE_KEY\"; bbcertify 2>&1")"
  if [[ "$?" -ne 0 ]]; then
    printf "${RED}License key invalid or missing. Run 'bbx activate' or go to dosaygo.com to get a valid key.${NC}\n"
    echo "Certification output: $certout"
    exit 1
  else
    printf "${GREEN}Certification complete.${NC}\n"
    if [[ -f "$CERT_META_FILE" ]]; then
      # shellcheck disable=SC1090
      source "$CERT_META_FILE"
      export BBX_RESERVATION_CODE BBX_RESERVED_SEAT_ID BBX_TICKET_ID BBX_TICKET_SLOT
    fi
  fi

  # Start BrowserBox — keep stderr visible so failures aren't silent
  printf "${YELLOW}Starting BrowserBox on 127.0.0.1:${PORT}...${NC}\n"
  local _cf_start_max_attempts=3
  local _cf_start_attempt=1
  local _cf_start_wait=30
  local _cf_retry_sleep=30
  local _cf_ready=false
  local _cf_startup_log="${BB_CONFIG_DIR}/cf-run-startup.log"
  local _cf_service_log_dir="${BB_CONFIG_DIR}/service_logs"

  while [[ "$_cf_start_attempt" -le "$_cf_start_max_attempts" ]]; do
    local _cf_bbpro_log
    _cf_bbpro_log="$(rm -f /tmp/bbx-bbpro-XXXXXX.log 2>/dev/null; mktemp /tmp/bbx-bbpro-XXXXXX.log)"
    local _cf_bbpro_rc
    local _cf_attempt_log="${BB_CONFIG_DIR}/cf-run-startup-attempt-${_cf_start_attempt}.log"

    printf "${YELLOW}Launching BrowserBox startup attempt %d/%d...${NC}\n" "$_cf_start_attempt" "$_cf_start_max_attempts" >&2

    if [[ -n ${BBX_DEBUG:-} ]]; then
      BBX_DEBUG="$BBX_DEBUG" env BBX_NONINTERACTIVE=true bbpro 2>&1 | tee "$_cf_bbpro_log"
      _cf_bbpro_rc=${PIPESTATUS[0]}
    else
      env BBX_NONINTERACTIVE=true bbpro > "$_cf_bbpro_log" 2>&1
      _cf_bbpro_rc=$?
    fi

    cp "$_cf_bbpro_log" "$_cf_startup_log" 2>/dev/null || true
    cp "$_cf_bbpro_log" "$_cf_attempt_log" 2>/dev/null || true

    if [[ "$_cf_bbpro_rc" -eq 0 ]] && wait_for_local_ready "$PORT" http "$_cf_start_wait"; then
      _cf_ready=true
      rm -f "$_cf_bbpro_log"
      break
    fi

    if [[ "$_cf_bbpro_rc" -ne 0 ]]; then
      printf "${RED}BrowserBox startup attempt %d/%d failed immediately (exit %d).${NC}\n" \
        "$_cf_start_attempt" "$_cf_start_max_attempts" "$_cf_bbpro_rc" >&2
      printf "${YELLOW}Saved startup log to %s${NC}\n" "$_cf_attempt_log" >&2
      tail -20 "$_cf_bbpro_log" >&2
    else
      printf "${RED}BrowserBox did not become ready during startup attempt %d/%d.${NC}\n" \
        "$_cf_start_attempt" "$_cf_start_max_attempts" >&2
      printf "${YELLOW}Saved startup log to %s${NC}\n" "$_cf_attempt_log" >&2
      if [[ -f "${_cf_service_log_dir}/bb-main-out.log" ]]; then
        printf "${YELLOW}===== bb-main-out.log (last 40 lines) =====${NC}\n" >&2
        tail -40 "${_cf_service_log_dir}/bb-main-out.log" >&2
      fi
      if [[ -f "${_cf_service_log_dir}/bb-main-err.log" ]]; then
        printf "${YELLOW}===== bb-main-err.log (last 40 lines) =====${NC}\n" >&2
        tail -40 "${_cf_service_log_dir}/bb-main-err.log" >&2
      fi
      browserbox pm2 list >&2 || true
    fi

    rm -f "$_cf_bbpro_log"

    if [[ "$_cf_start_attempt" -ge "$_cf_start_max_attempts" ]]; then
      break
    fi

    printf "${YELLOW}Retrying Cloudflare startup in %ds...${NC}\n" "$_cf_retry_sleep" >&2
    run_quietly stop_bbpro || true
    sleep "$_cf_retry_sleep"
    _cf_start_attempt=$((_cf_start_attempt + 1))
  done

  if [[ "$_cf_ready" != "true" ]]; then
    printf "${RED}BrowserBox never became ready on port ${PORT}. Aborting tunnel.${NC}\n"
    run_quietly stop_bbpro || true
    exit 1
  fi

  # Reload config to capture final token
  load_config

  # Cloudflared log and PID files
  local cf_log_file="${BB_CONFIG_DIR}/cloudflared.log"

  # Build cloudflared args with optional edge IP version.
  # Default behavior:
  # - inside Docker: use IPv4 edges (less flaky than IPv6 in CI)
  # - outside Docker: do not pin edge IP version (cloudflared default)
  # Override: set BBX_CF_EDGE_IP_VERSION=4 or 6.
  local cf_edge_args=()
  local cf_edge_ip_version=""
  if [[ -n "${BBX_CF_EDGE_IP_VERSION:-}" ]]; then
    cf_edge_ip_version="${BBX_CF_EDGE_IP_VERSION}"
  elif [[ -f "/.dockerenv" ]]; then
    cf_edge_ip_version="4"
  fi
  if [[ -n "$cf_edge_ip_version" ]]; then
    if [[ "$cf_edge_ip_version" != "4" && "$cf_edge_ip_version" != "6" ]]; then
      printf "${YELLOW}Warning: BBX_CF_EDGE_IP_VERSION must be 4 or 6 (got: %s); ignoring${NC}\n" "$cf_edge_ip_version"
      cf_edge_ip_version=""
    fi
  fi
  if [[ -n "$cf_edge_ip_version" ]]; then
    cf_edge_args+=(--edge-ip-version "${cf_edge_ip_version}")
    printf "${YELLOW}Using edge IP version: ${cf_edge_ip_version}${NC}\n"
  fi

  # Function to start cloudflared and return its PID
  start_cloudflared() {
    : > "$cf_log_file"  # Clear log file
    cloudflared tunnel --no-autoupdate "${cf_edge_args[@]}" --url "http://127.0.0.1:${PORT}" >> "$cf_log_file" 2>&1 &
    echo $!
  }

  # Function to extract tunnel URL from log with retries
  extract_tunnel_url() {
    local max_wait="${1:-90}"  # Default 90 seconds
    local attempts=0
    local max_attempts=$((max_wait * 2))  # Check every 0.5s
    local tunnel_url=""

    while [ $attempts -lt $max_attempts ]; do
      if [ -f "$cf_log_file" ]; then
        # Look for successful tunnel URL
        tunnel_url=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$cf_log_file" 2>/dev/null | head -1)
        if [ -n "$tunnel_url" ]; then
          echo "$tunnel_url"
          return 0
        fi
        # Check for fatal errors (rate limit, auth failure) — stop waiting early
        if grep -qE '(429 Too Many Requests|failed to unmarshal quick Tunnel)' "$cf_log_file" 2>/dev/null; then
          printf "${RED}Cloudflare API error (likely rate-limited)${NC}\n"
          return 1
        fi
      fi
      # If cloudflared process has exited, stop waiting
      if [ -n "$cf_pid" ] && ! kill -0 "$cf_pid" 2>/dev/null; then
        printf "${RED}cloudflared exited before producing a tunnel URL${NC}\n"
        return 1
      fi
      sleep 0.5
      attempts=$((attempts + 1))
    done
    return 1
  }

  # Resolve a tunnel hostname, falling back to parent domain or Cloudflare DNS
  resolve_tunnel_host() {
    local host="$1"
    local ip=""
    # Try system DNS for exact host
    ip="$(dig +short "$host" A 2>/dev/null | head -1)"
    if [[ -z "$ip" || "$ip" == *";"* ]]; then
      # Try Cloudflare DNS for exact host
      ip="$(dig +short @1.1.1.1 "$host" A 2>/dev/null | head -1)"
    fi
    if [[ -z "$ip" || "$ip" == *";"* ]]; then
      # For trycloudflare.com subdomains, all resolve to the same Anycast IPs.
      # New subdomains may not have propagated yet, so resolve the parent domain.
      local parent="${host#*.}"
      if [[ "$parent" == "trycloudflare.com" ]]; then
        ip="$(dig +short @1.1.1.1 "$parent" A 2>/dev/null | head -1)"
      fi
    fi
    [[ -n "$ip" && "$ip" != *";"* ]] && echo "$ip"
  }

  run_dns_refresh_cmd() {
    if "$@" >/dev/null 2>&1; then
      return 0
    fi
    if [[ -n "${SUDO:-}" ]]; then
      $SUDO "$@" >/dev/null 2>&1 && return 0
    fi
    return 1
  }

  refresh_local_dns_cache() {
    local host="$1"
    local attempted=0
    local succeeded=0

    printf "${YELLOW}System DNS miss for %s; attempting local DNS cache refresh...${NC}\n" "$host"

    if command -v dscacheutil >/dev/null 2>&1; then
      attempted=1
      if run_dns_refresh_cmd dscacheutil -flushcache; then
        succeeded=1
        printf "${CYAN}Flushed local DNS cache via dscacheutil${NC}\n"
      fi
    fi

    if command -v killall >/dev/null 2>&1; then
      attempted=1
      if run_dns_refresh_cmd killall -HUP mDNSResponder; then
        succeeded=1
        printf "${CYAN}Signaled mDNSResponder to reload DNS state${NC}\n"
      fi
    fi

    if command -v resolvectl >/dev/null 2>&1; then
      attempted=1
      if run_dns_refresh_cmd resolvectl flush-caches; then
        succeeded=1
        printf "${CYAN}Flushed local DNS cache via resolvectl${NC}\n"
      fi
    elif command -v systemd-resolve >/dev/null 2>&1; then
      attempted=1
      if run_dns_refresh_cmd systemd-resolve --flush-caches; then
        succeeded=1
        printf "${CYAN}Flushed local DNS cache via systemd-resolve${NC}\n"
      fi
    fi

    if command -v nscd >/dev/null 2>&1; then
      attempted=1
      if run_dns_refresh_cmd nscd -i hosts; then
        succeeded=1
        printf "${CYAN}Invalidated hosts cache via nscd${NC}\n"
      fi
    fi

    if [[ "$attempted" -eq 0 ]]; then
      printf "${YELLOW}No supported local DNS cache refresh capability detected; continuing with direct IP fallback if needed${NC}\n"
      return 1
    fi

    if [[ "$succeeded" -eq 0 ]]; then
      printf "${YELLOW}Local DNS cache refresh commands were available but did not succeed; continuing with direct IP fallback if needed${NC}\n"
      return 1
    fi

    return 0
  }

  # Verify that the tunnel actually serves BrowserBox (readiness gate)
  verify_cf_tunnel() {
    local url="$1"
    local max_wait="${2:-60}"
    local interval=3
    local elapsed=0
    local host resolve_args

    # Extract hostname for DNS fallback (bash builtins — portable across BSD/GNU)
    host="${url#*://}"
    host="${host%%/*}"
    resolve_args=()

    printf "${YELLOW}Verifying tunnel serves BrowserBox at ${url}...${NC}\n"

    # Pre-check: if system DNS can't resolve the host, set up --resolve immediately
    local pre_ip
    pre_ip="$(resolve_tunnel_host "$host")"
    if [[ -n "$pre_ip" ]]; then
      # Verify system DNS works for this host
      local sys_test
      sys_test="$(curl -s -k --max-time 5 -o /dev/null -w '%{http_code}' "https://${host}/" 2>/dev/null)" || true
      if [[ "$sys_test" == "000" ]]; then
        if refresh_local_dns_cache "$host"; then
          printf "${YELLOW}Waiting 3 seconds for local DNS cache refresh to settle...${NC}\n"
          sleep 3
          sys_test="$(curl -s -k --max-time 5 -o /dev/null -w '%{http_code}' "https://${host}/" 2>/dev/null)" || true
        fi
        if [[ "$sys_test" == "000" ]]; then
          resolve_args=(--resolve "${host}:443:${pre_ip}")
          printf "${YELLOW}System DNS still can't resolve ${host}, using direct IP (${pre_ip})${NC}\n"
        else
          printf "${GREEN}System DNS resolved ${host} after local cache refresh${NC}\n"
        fi
      fi
    fi

    while [ $elapsed -lt $max_wait ]; do
      local http_code
      http_code="$(curl -s -k -L --max-time 10 "${resolve_args[@]}" --output /dev/null -w '%{http_code}' "${url}/login?token=${TOKEN}" 2>/dev/null)" || true
      if [[ "$http_code" =~ ^(200|302)$ ]]; then
        local page_body
        page_body="$(curl -s -k -L --max-time 10 "${resolve_args[@]}" "${url}/login?token=${TOKEN}" 2>/dev/null)" || true
        if echo "$page_body" | grep -q "bb-view\|browserbox\|voodoo" 2>/dev/null; then
          printf "${GREEN}Tunnel readiness verified (HTTP %s, app content confirmed)${NC}\n" "$http_code"
          return 0
        fi
        printf "${YELLOW}Tunnel responds (HTTP %s) but app not ready yet...${NC}\n" "$http_code"
      fi
      sleep "$interval"
      elapsed=$((elapsed + interval))
    done
    printf "${RED}Tunnel readiness check failed after ${max_wait}s${NC}\n"
    return 1
  }

  # Start cloudflared with auto-restart on failure
  printf "${YELLOW}Starting Cloudflare tunnel to http://127.0.0.1:${PORT}...${NC}\n"

  local cf_pid=""
  local tunnel_url=""
  local max_restarts=3
  local restart_count=0
  local cf_run_stopping="false"

  while [ $restart_count -lt $max_restarts ]; do
    cf_pid=$(start_cloudflared)
    echo "$cf_pid" > "$CF_PID_FILE"

    # Wait for tunnel URL
    tunnel_url=$(extract_tunnel_url 90)

    if [ -n "$tunnel_url" ]; then
      # Tunnel URL extracted — verify it actually serves the app
      if verify_cf_tunnel "$tunnel_url" 60; then
        break
      fi
      # Readiness gate failed — treat as a retriable failure
      printf "${YELLOW}Tunnel URL obtained but readiness check failed${NC}\n"
    fi

    # Kill the failed/stalled cloudflared before retrying
    kill "$cf_pid" 2>/dev/null || true
    wait "$cf_pid" 2>/dev/null || true
    tunnel_url=""
    restart_count=$((restart_count + 1))

    if [ $restart_count -lt $max_restarts ]; then
      local backoff=$((2 + restart_count * 3))
      printf "${YELLOW}Cloudflare tunnel attempt failed, retrying in ${backoff}s (attempt $((restart_count + 1))/$max_restarts)...${NC}\n"
      sleep "$backoff"
    fi
  done

  if [ -z "$tunnel_url" ]; then
    printf "${RED}Failed to establish Cloudflare tunnel after $max_restarts attempts${NC}\n"
    printf "${YELLOW}Last 30 lines of cloudflared log:${NC}\n"
    tail -n 30 "$cf_log_file"
    kill "$cf_pid" 2>/dev/null || true
    rm -f "$CF_PID_FILE"
    run_quietly stop_bbpro || true
    exit 1
  fi

  printf "${GREEN}Cloudflare tunnel established and verified!${NC}\n"

  # Build login link and save to login.link
  local login_link="${tunnel_url}/login?token=${TOKEN}"
  echo "$login_link" > "${BB_CONFIG_DIR}/login.link"

  draw_box "Login Link: ${login_link}"

  # Background mode: detach and exit
  if [[ "$background_mode" == "true" ]]; then
    printf "\n${GREEN}Running in background mode.${NC}\n"
    printf "${CYAN}Tunnel PID: ${cf_pid} (saved to ${CF_PID_FILE})${NC}\n"
    printf "${CYAN}Stop with: bbx stop${NC}\n\n"

    # Spawn a background monitor that restarts cloudflared if it dies
    (
      while true; do
        sleep 10
        if ! kill -0 "$cf_pid" 2>/dev/null; then
          # cloudflared died, check if we should restart
          if [[ -f "$CF_PID_FILE" ]]; then
            # PID file exists, meaning user hasn't called stop - restart
            cf_pid=$(start_cloudflared)
            echo "$cf_pid" > "$CF_PID_FILE"
          else
            # PID file removed by stop command - exit monitor
            break
          fi
        fi
      done
    ) &
    disown
    exit 0
  fi

  # Foreground mode: set up cleanup trap and wait
  # Cleanup function for cf_run
  cleanup_cf_run() {
    if [[ "$cf_run_stopping" == "true" ]]; then
      return
    fi
    cf_run_stopping="true"
    trap - EXIT INT TERM
    printf "\n${YELLOW}Stopping BrowserBox and Cloudflare tunnel...${NC}\n"
    kill "$cf_pid" 2>/dev/null || true
    rm -f "$CF_PID_FILE"
    run_quietly stop_bbpro || true
    printf "${GREEN}Cleanup complete.${NC}\n"
  }

  handle_cf_run_signal() {
    cleanup_cf_run
    exit 130
  }

  trap cleanup_cf_run EXIT
  trap handle_cf_run_signal INT TERM

  printf "\n${CYAN}Tunnel is active. Press Ctrl+C to stop.${NC}\n\n"

  # Monitor cloudflared and auto-restart if it crashes (foreground mode)
  while [[ "$cf_run_stopping" != "true" ]]; do
    if ! kill -0 "$cf_pid" 2>/dev/null; then
      if [[ "$cf_run_stopping" == "true" ]]; then
        break
      fi
      printf "${YELLOW}Cloudflare tunnel died, restarting...${NC}\n"
      cf_pid=$(start_cloudflared)
      echo "$cf_pid" > "$CF_PID_FILE"

      # Wait for new URL
      local new_url
      new_url=$(extract_tunnel_url 60)
      if [ -n "$new_url" ] && [ "$new_url" != "$tunnel_url" ]; then
        tunnel_url="$new_url"
        login_link="${tunnel_url}/login?token=${TOKEN}"
        echo "$login_link" > "${BB_CONFIG_DIR}/login.link"
        printf "${GREEN}New tunnel URL: ${login_link}${NC}\n"
      fi
    fi
    sleep 5
  done
}

docker_run() {
  # Docker runner retained for possible future re-enable — do not remove.
  # It is intentionally unreachable from the public bbx command dispatch
  # while BrowserBox ships as a binary-first distribution.
  # The entire function body is commented out below.
  printf "${RED}Docker commands are currently disabled.${NC}\n"
  exit 1
: <<'DOCKER_RUN_DISABLED'
  banner
  load_config

  local nickname=""
  local port="${PORT:-$(find_free_port_block)}"
  local hostname="${BBX_HOSTNAME:-$(get_system_hostname)}"
  hostname="$(normalize_hostname_for_local_use "$hostname")"
  local email="${EMAIL:-$USER@$hostname}"

  while [ $# -gt 0 ]; do
    case "$1" in
      --port|-p)
        if [ -z "$2" ]; then
          printf "${RED}Error: Option $1 requires an argument${NC}\n"
          printf "Usage: bbx docker-run [nickname] [--port|-p <port>]${NC}\n"
          exit 1
        fi
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

  # Ensure Docker is available
  if ! command -v docker >/dev/null 2>&1; then
    printf "${YELLOW}Installing Docker...${NC}\n"
    if [ -f /etc/debian_version ]; then
      $SUDO apt-get update && $SUDO apt-get install -y docker.io
      $SUDO systemctl start docker
      $SUDO systemctl enable docker
      $SUDO usermod -aG docker "${USER:-$(id -un)}"
      printf "${BLUE}Docker installed. Please re-run your previous command, or log out and back in for group changes to take effect.${NC}\n"
      newgrp docker <<EOF
echo "${GREEN}Docker group applied to this session. Please re-run: bbx docker-run $nickname${NC}"
EOF
      exit 0
    elif [ -f /etc/redhat-release ]; then
      $SUDO yum install -y docker || $SUDO dnf install -y docker
      $SUDO systemctl start docker
      $SUDO systemctl enable docker
      $SUDO usermod -aG docker "${USER:-$(id -un)}"
      printf "${BLUE}Docker installed. Please re-run your previous command, or log out and back in for group changes to take effect.${NC}\n"
      newgrp docker <<EOF
echo "${GREEN}Docker group applied to this session. Please re-run: bbx docker-run $nickname${NC}"
EOF
      exit 0
    elif [ "$(uname -s)" = "Darwin" ]; then
      printf "${RED}Please install Docker Desktop manually on macOS: https://docs.docker.com/desktop/mac/install/${NC}\n"
      exit 1
    else
      printf "${RED}Unsupported OS. Install Docker manually: https://docs.docker.com/get-docker/${NC}\n"
      exit 1
    fi
    command -v docker >/dev/null 2>&1 || { printf "${RED}Docker installation failed${NC}\n"; exit 1; }
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
  if [[ -n "$BBX_DEBUG" ]]; then
    echo "Docker debug:"
    echo "$docker_output"
  fi
  save_config
DOCKER_RUN_DISABLED
}

docker_stop() {
  # Docker runner retained for possible future re-enable — do not remove.
  # It is intentionally unreachable from the public bbx command dispatch
  # while BrowserBox ships as a binary-first distribution.
  # The entire function body is commented out below.
  printf "${RED}Docker commands are currently disabled.${NC}\n"
  exit 1
: <<'DOCKER_STOP_DISABLED'
  banner
  load_config

  local nickname="$1"
  if [ -z "$nickname" ]; then
    printf "${RED}Usage: bbx docker-stop <nickname>${NC}\n"
    exit 1
  fi

  local container_id=$(jq -r --arg nick "$nickname" '.[$nick].container_id // ""' "$DOCKER_CONTAINERS_FILE")
  local port=$(jq -r --arg nick "$nickname" '.[$nick].port // ""' "$DOCKER_CONTAINERS_FILE")
  if [ -z "$container_id" ]; then
    printf "${RED}No container found with nickname: $nickname${NC}\n"
    printf "${YELLOW}If you used a raw container ID, run: docker stop <container_id>${NC}\n"
    exit 1
  fi

  if ! docker ps -q --filter "id=$container_id" | grep -q . && ! $SUDO docker ps -q --filter "id=$container_id" | grep -q .; then
    printf "${YELLOW}Container $nickname ($container_id) is not running.${NC}\n"
    local tmp_file=$(mktemp)
    jq --arg nick "$nickname" 'del(.[$nick])' "$DOCKER_CONTAINERS_FILE" > "$tmp_file" && \
      mv "$tmp_file" "$DOCKER_CONTAINERS_FILE"
    printf "${GREEN}Removed $nickname from tracking.${NC}\n"
    exit 0
  fi

  printf "${YELLOW}Stopping BrowserBox for $nickname ($container_id)...${NC}\n"
  docker exec "$container_id" bash -c "stop_bbpro" ||
  $SUDO docker exec "$container_id" bash -c "stop_bbpro" || {
    printf "${RED}Warning: Failed to run stop_bbpro in container${NC}\n"
  }
  printf "${YELLOW}Waiting 1 second for license release...${NC}\n"
  sleep 1

  docker stop --timeout 3 "$container_id" &>/dev/null || docker stop --time 3 "$container_id" &>/dev/null ||
  $SUDO docker stop --timeout 3 "$container_id" || $SUDO docker stop --time 3 "$container_id" || {
    printf "${RED}Failed to stop container $container_id${NC}\n"
    exit 1
  }

  local tmp_file=$(mktemp)
  jq --arg nick "$nickname" 'del(.[$nick])' "$DOCKER_CONTAINERS_FILE" > "$tmp_file" && \
    mv "$tmp_file" "$DOCKER_CONTAINERS_FILE"

  printf "${GREEN}Dockerized BrowserBox ($nickname) stopped and removed from tracking.${NC}\n"
  draw_box "Nickname: $nickname"
  draw_box "Container ID: $container_id"
  draw_box "Port: $port"
DOCKER_STOP_DISABLED
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
          # Check if we're in non-interactive mode (CI/CD)
          if [[ -n "$BBX_TEST_AGREEMENT" ]] || [ ! -t 0 ]; then
            printf "${RED}ERROR: Running as root in non-interactive mode requires BBX_INSTALL_USER environment variable${NC}\n"
            printf "${BLUE}Please set BBX_INSTALL_USER to a non-root username (e.g., export BBX_INSTALL_USER=bbxuser)${NC}\n"
            printf "${YELLOW}Example: export BBX_INSTALL_USER=bbxuser && ./bbx.sh install${NC}\n"
            exit 1
          fi
          # Interactive mode - prompt for username
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

        install_group="$(id -gn "$install_user")"
        local user_home
        user_home="$(getent passwd "$install_user" | cut -d: -f6)"

        # Fix ownership of any root-created files BEFORE switching to user
        if [[ -d "$BB_CONFIG_DIR" ]]; then
            chown -R "${install_user}:${install_group}" "$BB_CONFIG_DIR" 2>/dev/null || true
        fi

        cp -f "$0" /tmp/bbx.sh
        chmod +x /tmp/bbx.sh
        chown "${install_user}:${install_group}" /tmp/bbx.sh

        # Build a comprehensive env file to persist vars across the login shell.
        # Include all BBX-related vars plus PATH-related vars for nvm/node.
        local su_env_vars=(
          BBX_INSTALL_HOSTNAME BBX_INSTALL_EMAIL BBX_HOSTNAME BBX_EMAIL EMAIL
          LICENSE_KEY BBX_TEST_AGREEMENT STATUS_MODE
          INSTALL_DOC_VIEWER BBX_NO_UPDATE BBX_RELEASE_REPO BBX_RELEASE_TAG
          TARGET_RELEASE_REPO PRIVATE_TAG GH_TOKEN GITHUB_TOKEN BBX_INSTALL_USER
          BB_QUICK_EXIT NVM_DIR NODE_PATH
        )
        local env_file
        env_file="${user_home}/.bbx_env_restore.sh"
        # Start fresh
        : > "$env_file"
        local var val
        for var in "${su_env_vars[@]}"; do
          val="${!var-}"
          [[ -n "$val" ]] || continue
          printf 'export %s=%q\n' "$var" "$val" >> "$env_file"
        done
        # Preserve PATH separately (critical for finding nvm, node, etc.)
        if [[ -n "${PATH:-}" ]]; then
          printf 'export PATH=%q\n' "$PATH" >> "$env_file"
        fi
        chown "${install_user}:${install_group}" "$env_file" 2>/dev/null || true
        chmod 640 "$env_file" 2>/dev/null || true

        # Switch to the non-root user and run install
        echo "Switching to user $install_user..."
        su - "$install_user" -c "set -a; source $(printf '%q' "$env_file"); /tmp/bbx.sh install"
        local install_rc=$?

        if [[ -z "$BBX_TEST_AGREEMENT" ]] || [ -t 0 ]; then
          # Replace the root shell with the new user's shell
          exec su - "$install_user" -c "set -a; source $(printf '%q' "$env_file"); rm -f $(printf '%q' "$env_file"); bash -l"
        else
          # In CI/CD mode, keep env file for test script handoff and return install exit code
          # The test script will source this file when it hands off to the install user
          if [[ $install_rc -eq 0 ]]; then
            return 1  # Signal to caller that we've handled root->user switch
          else
            rm -f "$env_file"
            exit $install_rc
          fi
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
      certout="$(bash -c "export LICENSE_KEY=\"$LICENSE_KEY\"; bbcertify --force-license --no-reservation 2>&1")"
      if [[ "$?" -eq 0 ]]; then
        printf "${GREEN}License key validated with server.${NC}\n"
        save_config
        printf "${GREEN}Certification complete.${NC}\n"
        return 0
      else
        printf "${RED}ERROR: License key invalid or server unreachable.${NC}\n"
        echo "Certification output: $certout"
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
          certout="$(bash -c "export LICENSE_KEY=\"$LICENSE_KEY\"; bbcertify --force-license --no-reservation 2>&1")"
          if [[ "$?" -eq 0 ]]; then
            printf "${GREEN}License key validated with server.${NC}\n"
            save_config
          else
            printf "${RED}ERROR: License key invalid or server unreachable.${NC}\n"
            echo "Certification output: $certout"
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

ng_run() {
  if _bbx_for_active; then
    _for_ng_run "$@"
    return $?
  fi

  banner
  load_config
  ensure_deps

  # Trigger setup if not fully configured
  if [ -z "$HOST_PER_SERVICE" ] || [ -z "$PORT" ] || [ -z "$BBX_HOSTNAME" ] || [[ ! -f "${BB_CONFIG_DIR}/test.env" ]] ; then
    printf "${YELLOW}BrowserBox not fully set up. Running 'bbx setup' first...${NC}\n"
    setup -z "$@" # Pass any arguments like --port to setup
    load_config
  fi

  # Always run setup_nginx for ng-run (it's a standalone command installed in PATH)
  printf "${YELLOW}Starting Nginx setup...${NC}\n"
  if command -v setup_nginx &>/dev/null; then
    if ! DOMAIN="${BBX_CALLER_DOMAIN:-}" setup_nginx; then
      printf "${RED}Nginx setup failed. Aborting.${NC}\n"
      exit 1
    fi
    printf "${GREEN}Nginx setup complete.${NC}\n"
  else
    printf "${YELLOW}Warning: setup_nginx command not found. Nginx setup skipped.${NC}\n"
    printf "${YELLOW}This command should have been installed during 'bbx install'. Try reinstalling.${NC}\n"
  fi

  # Now, call the main run command, passing all original arguments.
  # The run command will handle calling setup if it's the very first run.
  run "$@"
}

flipbook_finalize() {
    # Thin launcher — all flipbook logic lives in `browserbox flipbook-finalize`.
    # It handles: frame validation, site generation, cleanup.
    # The process sets its own title so stop_bbpro's pkill won't kill it.
    # All output flows directly to the terminal (interactive — wrangler can prompt).
    local claimed_dir="${1:-}"
    printf "${YELLOW}Finalizing flipbook recording...${NC}\n"

    local fb_args=("$BBX_FLIPBOOK_DIR")
    if [[ -n "$claimed_dir" ]]; then
      fb_args+=("--recording-dir" "$claimed_dir")
    fi

    BBX_FLIPBOOK_DESCRIPTION="${BBX_FLIPBOOK_DESCRIPTION:-}" \
      browserbox flipbook-finalize "${fb_args[@]}"
    local rc=$?

    # Exit codes from browserbox flipbook-finalize:
    #   0  = success        10 = no recording
    #   11 = already claimed 12 = no frames
    #   1  = error
    case "$rc" in
      0)
        printf "${GREEN}Flipbook site generated.${NC}\n"
        flipbook_deploy_cf_pages || true
        ;;
      10|11|12)
        # Benign — messages already printed by the Node process
        ;;
      *)
        printf "${RED}Flipbook site generation failed (exit ${rc})${NC}\n"
        ;;
    esac
    # Flipbook issues must never cause bbx stop to exit non-zero
    return 0
}

flipbook_deploy_cf_pages() {
    # Deploy the entire flipbook directory (index.html + all recording subdirs)
    if [[ ! -f "${BBX_FLIPBOOK_DIR}/index.html" ]]; then
      printf "${YELLOW}No flipbook index page found, skipping deploy${NC}\n"
      return 0
    fi

    # Ensure wrangler is available
    if ! command -v wrangler &>/dev/null; then
      printf "${YELLOW}Installing wrangler (Cloudflare Pages CLI)...${NC}\n"
      if command -v npm &>/dev/null; then
        npm install -g wrangler 2>/dev/null || {
          printf "${YELLOW}Could not install wrangler globally. Trying npx...${NC}\n"
        }
      fi
    fi

    local wrangler_cmd=""
    if command -v wrangler &>/dev/null; then
      wrangler_cmd="wrangler"
    elif command -v npx &>/dev/null; then
      wrangler_cmd="npx wrangler"
    else
      printf "${YELLOW}wrangler not available — skipping Cloudflare Pages deploy.${NC}\n"
      printf "${YELLOW}Install with: npm install -g wrangler${NC}\n"
      printf "${GREEN}Your flipbook is at: ${BBX_FLIPBOOK_DIR}/index.html${NC}\n"
      return 0
    fi

    # Project name from directory basename (sanitize for CF Pages)
    local project_name="$(basename "${BBX_FLIPBOOK_DIR}")"
    project_name="$(echo "$project_name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')"
    if [[ -z "$project_name" ]]; then
      project_name="browserbox-flipbook"
    fi

    printf "${YELLOW}Deploying flipbook to Cloudflare Pages (project: ${project_name})...${NC}\n"
    $wrangler_cmd pages deploy "$BBX_FLIPBOOK_DIR" --project-name "$project_name" || {
      printf "${RED}Cloudflare Pages deploy failed.${NC}\n"
      printf "${YELLOW}You may need to run: wrangler login${NC}\n"
      printf "${GREEN}Your flipbook is at: ${BBX_FLIPBOOK_DIR}/index.html${NC}\n"
      return 1
    }

    printf "${GREEN}Flipbook deployed to Cloudflare Pages!${NC}\n"
}

stop() {
    if _bbx_for_active; then
      _for_stop "$@"
      return $?
    fi

    load_config

    printf "${YELLOW}Stopping BrowserBox (current user)...${NC}\n"
    # Also stop any Cloudflare tunnel started by bbx cf-run
    kill_cf_tunnel quiet
    # Clear login link so stale CF links aren't reused by next bbx run
    rm -f "${BB_CONFIG_DIR}/login.link"

    # Write the stop sentinel BEFORE killing services.
    # When dying services run their shutdown hooks (branch-bbx-stop.js),
    # the sentinel tells them "an external stop is already handling cleanup"
    # so they release their license but do NOT spawn a redundant `bbx stop`.
    printf '%s' "$$" > "$STOP_SENTINEL"

    # Reserve the flipbook recording dir BEFORE stop_bbpro kills the services.
    # The atomic mv ensures only one stop instance can claim the recording.
    # The actual flipbook logic (validation, generation, cleanup) is all in Node.
    local _fb_claimed=""
    if [[ -n "${BBX_FLIPBOOK_DIR:-}" ]]; then
      local _fb_rec="${BB_CONFIG_DIR}/flipbook_recording"
      if [[ -d "${_fb_rec}/pages" ]]; then
        _fb_claimed="${_fb_rec}.claim.$$"
        mv "${_fb_rec}" "${_fb_claimed}" 2>/dev/null || _fb_claimed=""
      fi
    fi

    # Ignore SIGTERM for the rest of stop(). stop_bbpro sends process-group
    # signals that can arrive asynchronously.
    trap '' TERM

    run_quietly stop_bbpro || {
      printf "${RED}Failed to stop. Check if BrowserBox is running.${NC}\n"
      rm -f "$STOP_SENTINEL"
      trap - TERM
      exit 1
    }
    printf "${GREEN}BrowserBox stopped.${NC}\n"

    # Reap stragglers (ENHANCEMENTS.md E2): helper workers have been observed
    # surviving stop (browserbox-sound et al leaked across restarts). Sweep the
    # current user's helper processes: TERM, brief grace, then KILL survivors.
    _bbx_reap_stragglers() {
      local pat='browserbox-(sound|devtools|microfilm)|(^|/)parec($| )'
      local pids
      pids=$(pgrep -u "$USER" -f "$pat" 2>/dev/null || true)
      [[ -z "$pids" ]] && return 0
      kill $pids 2>/dev/null || true
      sleep 2
      pids=$(pgrep -u "$USER" -f "$pat" 2>/dev/null || true)
      if [[ -n "$pids" ]]; then
        kill -9 $pids 2>/dev/null || true
        printf "${YELLOW}Reaped lingering helper processes.${NC}\n"
      fi
    }
    _bbx_reap_stragglers

    # Flipbook: finalize recording and deploy if BBX_FLIPBOOK_DIR is set.
    # All flipbook logic (claim, generation, cleanup) lives in the Node process.
    if [[ -n "${BBX_FLIPBOOK_DIR:-}" ]]; then
      flipbook_finalize "$_fb_claimed"
    fi

    # Remove the sentinel — stop is complete.
    rm -f "$STOP_SENTINEL"
    trap - TERM
}

logs() {
    printf "${YELLOW}Displaying BrowserBox logs...${NC}\n"
    browserbox pm2 list || printf "${YELLOW}browserbox pm2 list failed (services may not be running).${NC}\n"
    printf "${YELLOW}Tail a service log with:${NC} browserbox pm2 logs bb-main --lines 50\n"
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

  # If lock_file points to a binary that no longer exists, treat it as stale
  if [ "$lock_file" = "$PREPARING_FILE" ]; then
    local prepared_path
    prepared_path=$(sed -n '2p' "$lock_file" 2>/dev/null)
    if [[ -n "$prepared_path" ]] && [[ ! -f "$prepared_path" ]]; then
      $SUDO rm -f "$lock_file" 2>/dev/null || true
      return 1
    fi
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

# Prefer releases; roll back or forward to whatever /releases/latest says.
check_and_prepare_update() {
  if [[ -n "$BBX_NO_UPDATE" ]]; then
    return 0
  fi
  # Skip update checks for these commands
  # (fleet: acquire/release are machine-to-machine fast paths)
  ([ "$1" = "uninstall" ] || [ "$1" = "update" ] || [ "$1" = "install" ] || [ "$1" = "update-background" ] || [ "$1" = "fleet" ]) && return 0

  load_config
  mkdir -p "$BB_CONFIG_DIR"
  chmod 700 "$BB_CONFIG_DIR"

  # Fast path: if a prepared update exists, install it immediately (do not wait for the next check window)
  if [ -f "$PREPARED_FILE" ]; then
    local prepared_tag
    prepared_tag=$(sed -n '3p' "$PREPARED_FILE" 2>/dev/null)
    if [[ -n "$prepared_tag" ]]; then
      if check_prepare_and_install "$prepared_tag"; then
        return 0
      fi
    fi
  fi

  # Define the last update check file and time constraints
  local last_update_check_file="${BB_CONFIG_DIR}/last_update_check"
  local current_time
  current_time=$(date +%s)
  local one_hour_ago=$((current_time - 3600))

  # Check if we should perform an update check
  if [ -f "$last_update_check_file" ]; then
    local last_check_time
    last_check_time=$(cat "$last_update_check_file")
    if [[ "$last_check_time" -gt "$one_hour_ago" ]]; then
      # It's been less than an hour, so skip the check
      return 0
    fi
  fi

  printf "${YELLOW}Checking for BrowserBox updates...${NC}\n"
  # Proceed with the update check and record the time
  echo "$current_time" > "$last_update_check_file"

  # Determine the live latest release BEFORE touching any prepared bits
  local repo_tag
  repo_tag="$(get_latest_repo_version stable)"
  if [[ "$repo_tag" == unknown* ]]; then
    printf "${YELLOW}Skipping update: could not determine latest release.${NC}\n"
    return 0
  fi

  # If a prepared binary exists, only install it if it matches the live latest
  if [ -f "$PREPARED_FILE" ]; then
    local prepared_binary
    prepared_binary=$(sed -n '2p' "$PREPARED_FILE" 2>/dev/null)
    local prepared_tag
    prepared_tag=$(sed -n '3p' "$PREPARED_FILE" 2>/dev/null)
    
    if [[ -n "$prepared_binary" ]] && [[ -f "$prepared_binary" ]] && [[ "$prepared_tag" == "$repo_tag" ]]; then
      printf "${YELLOW}Prepared update (${prepared_tag}) matches latest. Installing...${NC}\n"
      is_running_in_official && self_elevate_to_temp "${OGARGS[@]}"
      if check_prepare_and_install "$repo_tag"; then
        return 0
      fi
    else
      printf "${YELLOW}Prepared update (${prepared_tag}) is stale vs latest (${repo_tag}); removing it.${NC}\n"
      rm -rf "$BBX_NEW_DIR" 2>/dev/null
      $SUDO rm -f "$PREPARED_FILE" "$PREPARING_FILE" 2>/dev/null
    fi
  fi

  # Compare installed vs latest release (works for roll-forward or roll-back)
  local current_version
  current_version="$(get_canonical_bbx_version)"
  # Normalize for comparison (add 'v' prefix if missing)
  local current_tag="$current_version"
  if [[ "$current_tag" != "unknown" ]] && [[ "$current_tag" != v* ]]; then
    current_tag="v$current_tag"
  fi
  
  printf "${BLUE}Current: $current_tag${NC}\n"
  printf "${BLUE}Latest: $repo_tag${NC}\n"

  if [[ "$current_tag" == "$repo_tag" ]]; then
    printf "${GREEN}Already on the latest version (${repo_tag}).${NC}\n"
    [ -d "$BBX_NEW_DIR" ] && rm -rf "$BBX_NEW_DIR" && printf "${YELLOW}Cleaned up $BBX_NEW_DIR${NC}\n"
    return 0
  fi

  # Prepare target version in background; installation will run after prep
  if [[ -n "$BBX_DEBUG" ]]; then
    printf "${GREEN}Background update starting to ${repo_tag}...${NC}\n"
    update_background "$repo_tag"
  else
    update_background "$repo_tag" &
    printf "${GREEN}Background update started to ${repo_tag}. Check $LOG_FILE for progress.${NC}\n"
  fi
  return 0
}

download_release_manifest() {
  local tag="$1"
  local dest_dir="$2"
  local manifest_url="https://github.com/${PUBLIC_REPO}/releases/download/${tag}/release.manifest.json"
  local sig_url="https://github.com/${PUBLIC_REPO}/releases/download/${tag}/release.manifest.json.sig"
  local curl_auth=()
  if [[ -n "${GH_TOKEN:-}" ]]; then
    curl_auth=(-H "Authorization: token ${GH_TOKEN}")
  fi
  mkdir -p "$dest_dir" || return 1
  curl -L --fail --retry 3 --retry-all-errors --connect-timeout 30 "${curl_auth[@]}" -o "${dest_dir}/release.manifest.json" "$manifest_url" || return 1
  curl -L --fail --retry 3 --retry-all-errors --connect-timeout 30 "${curl_auth[@]}" -o "${dest_dir}/release.manifest.json.sig" "$sig_url" || return 1
  chmod 644 "${dest_dir}/release.manifest.json" "${dest_dir}/release.manifest.json.sig" 2>/dev/null || true
  return 0
}

release_integrity_public_key() {
  cat <<'KEY'
-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAnqKI++Z5x+cHF1je6Ww9
r3hNRuefjZzlJGPD56IQTbVIDXZT45uGNHelg+BjlZezdGH86y29zKgx2g3pt8cC
Yp8KMSgg69uo9EVFlDw8HQ1Sf7rciiU89neb48lkm5GfzXtAyIFWQj83AHDblQUq
UJoXuu7YQLskHiRa0YPOkPf5KUHS8Yv1OJwXldsmd/+NGCrZki1o6xEt55B5qo3J
89jUiVnSafUhZXuQiwYfRT5MVoBBFl6TK/kg3qTF4oVBvz0r4HO/C1uAEytaDEI4
CFy2XO6i64DgSbkjzXCsomlHU0ywPbLxXPUst5AZwX62f/caGKGZs7IrZDBYNI2k
bBZ5fCAFhExwI0HUVIFC31YFpFRZB3UnVQdE0q8UuZyCstubPk7gdkEljnCXDnMB
bvgk5+5y8WgCrbu3mndlbb4K9NqxFq3tJppM8Gq8Rip94DghUBlRMXCBwaZ+EsBZ
ZwkpTdoWvsJcO+NwHscRvHNRcDRUrDwMrTpSs/cfCRMUo0ze0ZxpenCQuQpae7ei
Rs4+aW0rrwZBFo+o5GNWDOADAoD4JEPBNuSJyOw4mjdTgf8O9pIJfDF7HtX7pHr7
e8u3jamSWvZSZA+50fI6iL05JUDA4cQ529voRTxiLALgLkSnlGY2EQrDr9A8lH4/
hYdYq1pXWapoaFZTuPK4ln8CAwEAAQ==
-----END PUBLIC KEY-----
KEY
}

verify_release_bundle() {
  local manifest_path="$1"
  local signature_path="$2"
  local binary_path="$3"
  local artifact_key="$4"
  local work_dir
  work_dir="$(mktemp -d)" || return 1

  if ! command -v openssl >/dev/null 2>&1 || ! command -v jq >/dev/null 2>&1; then
    printf "${RED}openssl and jq are required to verify BrowserBox updates.${NC}\n" >&2
    rm -rf "$work_dir"
    return 1
  fi

  release_integrity_public_key > "$work_dir/key.pem"
  printf 'INTEGRITY/RELEASE_MANIFEST/v1\0' > "$work_dir/payload"
  cat "$manifest_path" >> "$work_dir/payload"

  if command -v xxd >/dev/null 2>&1; then
    xxd -r -p "$signature_path" > "$work_dir/signature.bin"
  elif command -v python3 >/dev/null 2>&1; then
    python3 - "$signature_path" "$work_dir/signature.bin" <<'PY'
import binascii
import pathlib
import sys
pathlib.Path(sys.argv[2]).write_bytes(binascii.unhexlify(pathlib.Path(sys.argv[1]).read_text().strip()))
PY
  else
    printf "${RED}xxd or python3 is required to verify the release signature.${NC}\n" >&2
    rm -rf "$work_dir"
    return 1
  fi

  if ! openssl dgst -sha256 -verify "$work_dir/key.pem" -signature "$work_dir/signature.bin" "$work_dir/payload" >/dev/null 2>&1; then
    printf "${RED}Release manifest signature verification failed.${NC}\n" >&2
    rm -rf "$work_dir"
    return 1
  fi

  local expected_sha actual_sha
  expected_sha="$(jq -er --arg key "$artifact_key" '.artifacts[$key].sha256 | select(test("^[0-9a-fA-F]{64}$"))' "$manifest_path" 2>/dev/null)" || {
    printf "${RED}Release manifest is missing a valid ${artifact_key} checksum.${NC}\n" >&2
    rm -rf "$work_dir"
    return 1
  }
  if command -v sha256sum >/dev/null 2>&1; then
    actual_sha="$(sha256sum "$binary_path" | awk '{print $1}')"
  else
    actual_sha="$(shasum -a 256 "$binary_path" | awk '{print $1}')"
  fi

  rm -rf "$work_dir"
  actual_sha="$(printf '%s' "$actual_sha" | tr '[:upper:]' '[:lower:]')"
  expected_sha="$(printf '%s' "$expected_sha" | tr '[:upper:]' '[:lower:]')"
  if [[ "$actual_sha" != "$expected_sha" ]]; then
    printf "${RED}Downloaded BrowserBox checksum mismatch for ${artifact_key}.${NC}\n" >&2
    printf "Expected: %s\nActual:   %s\n" "$expected_sha" "$actual_sha" >&2
    return 1
  fi
  printf "${GREEN}Verified signed release manifest and BrowserBox checksum.${NC}\n" >&2
}

install_release_manifest_from_dir() {
  local source_dir="$1"
  local source_manifest="${source_dir}/release.manifest.json"
  local source_signature="${source_dir}/release.manifest.json.sig"
  local global_manifest_dir="/usr/local/share/dosaygo/bbpro"
  local user_manifest_dir="${HOME}/.config/dosaygo/bbpro"

  if [[ ! -f "$source_manifest" || ! -f "$source_signature" ]]; then
    printf "${RED}Release manifest files are missing from ${source_dir}${NC}\n" >&2
    return 1
  fi

  $SUDO mkdir -p "$global_manifest_dir" 2>/dev/null
  if $SUDO cp "$source_manifest" "${global_manifest_dir}/release.manifest.json" 2>/dev/null && \
     $SUDO cp "$source_signature" "${global_manifest_dir}/release.manifest.json.sig" 2>/dev/null; then
    $SUDO chmod 644 "${global_manifest_dir}/release.manifest.json" "${global_manifest_dir}/release.manifest.json.sig" 2>/dev/null || true
    printf "${GREEN}Release manifest installed to ${global_manifest_dir}${NC}\n"
    return 0
  fi

  mkdir -p "$user_manifest_dir"
  if cp "$source_manifest" "${user_manifest_dir}/release.manifest.json" && \
     cp "$source_signature" "${user_manifest_dir}/release.manifest.json.sig"; then
    chmod 644 "${user_manifest_dir}/release.manifest.json" "${user_manifest_dir}/release.manifest.json.sig" 2>/dev/null || true
    printf "${YELLOW}Release manifest installed to user config (no global write access)${NC}\n"
    return 0
  fi

  return 1
}

check_prepare_and_install() {
  if [[ -n "$BBX_NO_UPDATE" ]]; then
    return 0
  fi
  local repo_tag="$1"

  # Check if a prepared binary exists
  if [ -f "$PREPARED_FILE" ]; then
    local prepared_binary
    prepared_binary=$(sed -n '2p' "$PREPARED_FILE")
    
    # Verify the prepared binary exists and is executable
    if [ -f "$prepared_binary" ] && [ -x "$prepared_binary" ]; then
      local new_tag=""
      # Get tag from line 3 of PREPARED_FILE
      new_tag=$(sed -n '3p' "$PREPARED_FILE" 2>/dev/null)

      if [ "$new_tag" = "$repo_tag" ]; then
        printf "${YELLOW}Latest version prepared at $prepared_binary. Installing...${NC}\n"
        printf "${YELLOW}Latest version prepared at $prepared_binary. Installing...${NC}\n" >> "$LOG_FILE"

        # Avoid self-overwrite while swapping binary
        is_running_in_official && self_elevate_to_temp "${OGARGS[@]}"

        # Install release manifest before binary (required for integrity verification)
        # Manifests go to data dirs only — never the binary location
        local prepared_dir
        prepared_dir="$(dirname "$prepared_binary")"
        local prepared_manifest="${prepared_dir}/release.manifest.json"
        local prepared_manifest_sig="${prepared_dir}/release.manifest.json.sig"
        if [[ ! -f "$prepared_manifest" || ! -f "$prepared_manifest_sig" ]]; then
          printf "${YELLOW}Prepared manifest files missing. Downloading fresh copy...${NC}\n" >> "$LOG_FILE"
          if ! download_release_manifest "$repo_tag" "$prepared_dir" >> "$LOG_FILE" 2>&1; then
            printf "${RED}Error: Prepared manifest files not found${NC}\n" >> "$LOG_FILE"
            printf "${RED}Error: Prepared manifest files not found${NC}\n"
            return 1
          fi
        fi

        local prepared_platform prepared_artifact_key
        prepared_platform="$(detect_platform)"
        case "$prepared_platform" in
          macos) prepared_artifact_key="darwin-arm64" ;;
          linux) prepared_artifact_key="linux-x64" ;;
          *) printf "${RED}Unsupported update platform: %s${NC}\n" "$prepared_platform"; return 1 ;;
        esac
        if ! verify_release_bundle "$prepared_manifest" "$prepared_manifest_sig" "$prepared_binary" "$prepared_artifact_key" >> "$LOG_FILE" 2>&1; then
          printf "${RED}Prepared update failed integrity verification; refusing to install.${NC}\n"
          return 1
        fi

        printf "${YELLOW}Installing release manifest...${NC}\n" >> "$LOG_FILE"
        if ! install_release_manifest_from_dir "$prepared_dir" >> "$LOG_FILE" 2>&1; then
          printf "${RED}Error: Failed to install release manifest${NC}\n" >> "$LOG_FILE"
          printf "${RED}Error: Failed to install release manifest${NC}\n"
          return 1
        fi

        # Replace global binary with prepared binary (using INSTALL_CMD for sudo)
        $INSTALL_CMD "$prepared_binary" "$BINARY_PATH" >> "$LOG_FILE" 2>&1 || { 
          printf "${RED}Failed to install prepared binary to $BINARY_PATH (install)${NC}\n" >> "$LOG_FILE"
        }
        # Verify and repair if needed
        if [[ ! -x "$BINARY_PATH" ]] || [[ ! -s "$BINARY_PATH" ]]; then
          printf "${YELLOW}Binary missing or not executable after install; copying directly...${NC}\n" >> "$LOG_FILE"
          $SUDO cp "$prepared_binary" "$BINARY_PATH" >> "$LOG_FILE" 2>&1 && $SUDO chmod 755 "$BINARY_PATH" >> "$LOG_FILE" 2>&1
        fi
        if [[ ! -x "$BINARY_PATH" ]] || [[ ! -s "$BINARY_PATH" ]]; then
          printf "${RED}Failed to place binary at $BINARY_PATH (post-copy)${NC}\n" >> "$LOG_FILE"
          return 1
        fi
        ls -l "$BINARY_PATH" >> "$LOG_FILE" 2>&1
        "$BINARY_PATH" --version >> "$LOG_FILE" 2>&1 || true

        # Run internal updates/migrations after swapping binary
        printf "${YELLOW}Running post-update installation tasks...${NC}\n" >> "$LOG_FILE"
        BBX_BINARY_SOURCE_PATH="$prepared_binary" "$BINARY_PATH" --install >> "$LOG_FILE" 2>&1 || { 
          printf "${RED}Failed to run post-update installation${NC}\n" >> "$LOG_FILE"
          return 1
        }

        # Post-install sanity: ensure the installed binary matches the prepared build.
        # The install phase may briefly replace the binary in-place; tolerate short gaps.
        local expected_version
        expected_version="${repo_tag#v}"
        local installed_version
        installed_version=""
        local tries=0
        while (( tries < 150 )); do
          tries=$((tries + 1))

          # The install step may briefly remove/replace the binary; if missing, restore from prepared.
          if [[ ! -s "$BINARY_PATH" ]] || [[ ! -x "$BINARY_PATH" ]]; then
            $SUDO cp "$prepared_binary" "$BINARY_PATH" >> "$LOG_FILE" 2>&1 && $SUDO chmod 755 "$BINARY_PATH" >> "$LOG_FILE" 2>&1 || true
          fi

          installed_version="$("$BINARY_PATH" --version 2>/dev/null | grep -oE '[0-9]+(\.[0-9]+)+')"
          if [[ "$installed_version" == "$expected_version" ]]; then
            break
          fi
          sleep 0.2
        done
        if [[ "$installed_version" != "$expected_version" ]]; then
          printf "${YELLOW}Installed binary version (%s) does not match prepared (%s); recopying prepared binary...${NC}\n" "$installed_version" "$expected_version" >> "$LOG_FILE"
          $SUDO cp "$prepared_binary" "$BINARY_PATH" >> "$LOG_FILE" 2>&1 && $SUDO chmod 755 "$BINARY_PATH" >> "$LOG_FILE" 2>&1 || true
          installed_version=""
          tries=0
          while (( tries < 150 )); do
            tries=$((tries + 1))
            installed_version="$("$BINARY_PATH" --version 2>/dev/null | grep -oE '[0-9]+(\.[0-9]+)+')"
            if [[ "$installed_version" == "$expected_version" ]]; then
              break
            fi
            sleep 0.2
          done
        fi
        if [[ "$installed_version" != "$expected_version" ]]; then
          printf "${RED}Post-install version mismatch: got '%s', expected '%s'${NC}\n" "$installed_version" "$expected_version" >> "$LOG_FILE"
          return 1
        fi
        ls -l "$BINARY_PATH" >> "$LOG_FILE" 2>&1

        # Clean up prepared files
        rm -rf "$BBX_NEW_DIR" || printf "${YELLOW}Warning: Failed to remove $BBX_NEW_DIR${NC}\n" >> "$LOG_FILE"
        $SUDO rm -f "$PREPARED_FILE" || printf "${YELLOW}Warning: Failed to remove $PREPARED_FILE${NC}\n" >> "$LOG_FILE"

        printf "${GREEN}Update to $repo_tag complete.${NC}\n" >> "$LOG_FILE"
        printf "${GREEN}Update to $repo_tag complete.${NC}\n"
        return 0
      else
        printf "${YELLOW}Prepared version ($new_tag) does not match latest ($repo_tag). Cleaning up and retrying...${NC}\n" >> "$LOG_FILE"
        rm -rf "$BBX_NEW_DIR" || printf "${YELLOW}Warning: Failed to clean up $BBX_NEW_DIR${NC}\n" >> "$LOG_FILE"
        $SUDO rm -f "$PREPARED_FILE" "$PREPARING_FILE" || printf "${YELLOW}Warning: Failed to clean up lock files${NC}\n" >> "$LOG_FILE"
      fi
    else
      # Prepared binary missing or not executable, clean up
      printf "${YELLOW}Prepared binary missing or not executable. Cleaning up...${NC}\n" >> "$LOG_FILE"
      rm -rf "$BBX_NEW_DIR" || printf "${YELLOW}Warning: Failed to clean up $BBX_NEW_DIR${NC}\n" >> "$LOG_FILE"
      $SUDO rm -f "$PREPARED_FILE" "$PREPARING_FILE" || printf "${YELLOW}Warning: Failed to clean up lock files${NC}\n" >> "$LOG_FILE"
    fi
  fi
  return 1
}

update() {
  if [[ -n "$BBX_NO_UPDATE" ]]; then
    return 0
  fi

  load_config
  local arg="${1:-}"
  local repo_tag=""

  if [[ -z "$arg" ]]; then
    printf "${YELLOW}Updating BrowserBox to latest stable...${NC}\n"
    repo_tag="$(get_latest_release "$PUBLIC_REPO")"
  elif [[ "$arg" == "--latest-rc" ]]; then
    printf "${YELLOW}Updating BrowserBox to latest release candidate...${NC}\n"
    repo_tag="$(get_latest_release "$PUBLIC_REPO")"
  else
    local tag="$(normalize_tag "$arg")"
    if [[ -z "$tag" ]]; then
      printf "${RED}Invalid version: '%s'${NC}\n" "$arg"
      return 1
    fi
    repo_tag="$tag"
    printf "${YELLOW}Updating BrowserBox to %s...${NC}\n" "$repo_tag"
  fi

  if [[ "$repo_tag" == unknown* ]] || [[ -z "$repo_tag" ]]; then
    printf "${RED}Could not determine version to update to.${NC}\n"
    return 1
  fi

  local platform
  platform=$(detect_platform)

  # Download
  local download_output
  download_output=$(download_binary "$platform" "$repo_tag")
  local exit_status=$?

  local temp_exe
  temp_exe=$(echo "$download_output" | tail -n1 | tr -d '[:space:]')

  if [[ $exit_status -ne 0 ]] || [[ -z "$temp_exe" ]] || [[ ! -f "$temp_exe" ]]; then
      printf "${RED}Download failed.${NC}\n"
      if [[ -n "$BBX_DEBUG" ]]; then echo "Debug: $download_output" >&2; fi
      return 1
  fi

  # Download manifest and signature
  # Manifests go to data dirs only — never the binary location
  local temp_manifest_dir
  temp_manifest_dir="$(mktemp -d)"
  
  # Download to temp first
  printf "${YELLOW}Downloading release manifest...${NC}\n"
  if ! download_release_manifest "$repo_tag" "$temp_manifest_dir"; then
    printf "${RED}Failed to download release manifest.${NC}\n"
    rm -rf "$temp_manifest_dir"
    return 1
  fi

  local artifact_key
  case "$platform" in
    macos) artifact_key="darwin-arm64" ;;
    linux) artifact_key="linux-x64" ;;
    *) printf "${RED}Unsupported update platform: %s${NC}\n" "$platform"; rm -rf "$temp_manifest_dir"; rm -f "$temp_exe"; return 1 ;;
  esac
  if ! verify_release_bundle "${temp_manifest_dir}/release.manifest.json" "${temp_manifest_dir}/release.manifest.json.sig" "$temp_exe" "$artifact_key"; then
    printf "${RED}Downloaded update failed integrity verification; refusing to install.${NC}\n"
    rm -rf "$temp_manifest_dir"
    rm -f "$temp_exe"
    return 1
  fi

  if ! install_release_manifest_from_dir "$temp_manifest_dir"; then
    printf "${RED}Failed to install release manifest anywhere. Integrity checks will fail.${NC}\n"
    rm -rf "$temp_manifest_dir"
    return 1
  fi
  rm -rf "$temp_manifest_dir"

  # Execute
  printf "${YELLOW}Running post-update installation tasks...${NC}\n"
  "$temp_exe" --install
  local install_exit=$?

  rm -f "$temp_exe"

  if [ $install_exit -eq 0 ]; then
    printf "${GREEN}BrowserBox updated to ${repo_tag}${NC}\n"
    return 0
  else
    printf "${RED}Post-update installation failed${NC}\n"
    return 1
  fi
}

update_background() {
  if [[ -n "$BBX_NO_UPDATE" ]]; then
    return 0
  fi

  load_config
  local requested_tag="${1:-}"
  local repo_tag
  if [[ -n "$requested_tag" ]]; then
    repo_tag="$requested_tag"
  else
    # default channel = stable
    repo_tag="$(get_latest_repo_version stable)"
  fi
  printf "${YELLOW}Checking update lock...${NC}\n" >> "$LOG_FILE"
  # Check lock files
  if is_lock_file_recent "$PREPARING_FILE"; then
    printf "${YELLOW}Another update is being prepared. Skipping...${NC}\n"
    return 0
  fi

  if check_prepare_and_install "$repo_tag"; then
    return 0
  fi

  # Start a fresh log for a new download/prepare cycle (keep update.log as "last update process").
  mkdir -p "$BB_CONFIG_DIR" 2>/dev/null || true
  : > "$LOG_FILE"

  printf "${YELLOW}Requesting update lock...${NC}\n" >> "$LOG_FILE"
  # Create preparing lock file
  $SUDO mkdir -p "$BBX_SHARE" || { printf "${RED}Failed to create install directory $BBX_SHARE ... ${NC}\n" >> "$LOG_FILE";  $SUDO rm -f "$PREPARING_FILE" ; exit 1; }
  # Lines: 1=timestamp, 2=prepared_binary_path, 3=git_tag (exact, incl. -rc if present)
  printf "%s\n%s\n%s\n" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$BBX_NEW_DIR/browserbox" "$repo_tag" | $SUDO tee "$PREPARING_FILE" >/dev/null || { printf "${RED}Failed to create $PREPARING_FILE${NC}\n" >> "$LOG_FILE";  $SUDO rm -f "$PREPARING_FILE" ; exit 1; }

  printf "${YELLOW}Starting background update to $repo_tag...${NC}\n" >> "$LOG_FILE"
  # Clean up any existing BBX_NEW_DIR
  rm -rf "$BBX_NEW_DIR" || { printf "${RED}Failed to clean $BBX_NEW_DIR${NC}\n" >> "$LOG_FILE";  $SUDO rm -f "$PREPARING_FILE" ; exit 1; }
  mkdir -p "$BBX_NEW_DIR" || { printf "${RED}Failed to create $BBX_NEW_DIR${NC}\n" >> "$LOG_FILE";  $SUDO rm -f "$PREPARING_FILE" ; exit 1; }
  
  # Determine platform and download URL for binary
  local platform
  platform=$(detect_platform)
  local asset_name
  case "$platform" in
    macos) asset_name="browserbox-macos-arm64" ;;
    linux) asset_name="browserbox-linux-x64" ;;
    *) 
      printf "${RED}Unsupported platform: $platform${NC}\n" >> "$LOG_FILE"
      $SUDO rm -f "$PREPARING_FILE"
      return 1
      ;;
  esac
  
  local download_url="https://github.com/${PUBLIC_REPO}/releases/download/${repo_tag}/${asset_name}"
  local temp_binary="$BBX_NEW_DIR/browserbox"
  
  printf "${YELLOW}Downloading binary from $download_url...${NC}\n" >> "$LOG_FILE"

  local curl_auth=()
  if [[ -n "${GH_TOKEN:-}" ]]; then
    curl_auth=(-H "Authorization: token ${GH_TOKEN}")
  fi
  
  # Use curl directly (no INSTALL_CMD/sudo) to avoid background sudo prompts
  curl -L --fail --progress-bar --connect-timeout 30 "${curl_auth[@]}" -o "$temp_binary" "$download_url" >> "$LOG_FILE" 2>&1 || {
    printf "${YELLOW}Skipping update due to timeout or failure in connecting to BrowserBox repo${NC}\n" >> "$LOG_FILE"
    $SUDO rm -f "$PREPARING_FILE"
    rm -f "$temp_binary" 2>/dev/null
    rm -rf "$BBX_NEW_DIR" 2>/dev/null
    return 1
  }
  
  # Verify binary was downloaded and is not empty
  if [[ ! -s "$temp_binary" ]]; then
    printf "${RED}Downloaded binary is empty${NC}\n" >> "$LOG_FILE"
    $SUDO rm -f "$PREPARING_FILE"
    rm -f "$temp_binary"
    rm -rf "$BBX_NEW_DIR"
    return 1
  fi

  # Make binary executable
  chmod +x "$temp_binary" || { 
    printf "${RED}Failed to make binary executable${NC}\n" >> "$LOG_FILE"
    $SUDO rm -f "$PREPARING_FILE"
    rm -f "$temp_binary"
    rm -rf "$BBX_NEW_DIR"
    return 1
  }

  # Download manifest and signature for integrity verification
  local manifest_url="https://github.com/${PUBLIC_REPO}/releases/download/${repo_tag}/release.manifest.json"
  local sig_url="https://github.com/${PUBLIC_REPO}/releases/download/${repo_tag}/release.manifest.json.sig"
  local temp_manifest="$BBX_NEW_DIR/release.manifest.json"
  local temp_manifest_sig="$BBX_NEW_DIR/release.manifest.json.sig"

  printf "${YELLOW}Downloading release manifest...${NC}\n" >> "$LOG_FILE"
  if ! download_release_manifest "$repo_tag" "$BBX_NEW_DIR" >> "$LOG_FILE" 2>&1; then
    printf "${YELLOW}Warning: Failed to download release manifest${NC}\n" >> "$LOG_FILE"
    $SUDO rm -f "$PREPARING_FILE"
    rm -f "$temp_binary" 2>/dev/null
    rm -rf "$BBX_NEW_DIR" 2>/dev/null
    return 1
  fi

  local artifact_key
  case "$platform" in
    macos) artifact_key="darwin-arm64" ;;
    linux) artifact_key="linux-x64" ;;
  esac
  if ! verify_release_bundle "$temp_manifest" "$temp_manifest_sig" "$temp_binary" "$artifact_key" >> "$LOG_FILE" 2>&1; then
    printf "${RED}Downloaded update failed integrity verification; refusing to prepare it.${NC}\n" >> "$LOG_FILE"
    $SUDO rm -f "$PREPARING_FILE"
    rm -rf "$BBX_NEW_DIR"
    return 1
  fi

  # Mark as prepared (record the exact git tag)
  printf "${YELLOW}Marking update as prepared...${NC}\n" >> "$LOG_FILE"
  printf "%s\n%s\n%s\n" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$temp_binary" "$repo_tag" | $SUDO tee "$PREPARED_FILE" >/dev/null || { printf "${RED}Failed to create $PREPARED_FILE${NC}\n" >> "$LOG_FILE";  $SUDO rm -f "$PREPARING_FILE" ; exit 1; }

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
    if _bbx_for_active; then
      _for_status "$@"
      return $?
    fi

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

vacancy() {
    load_config

    if [[ -z "${LICENSE_KEY:-}" ]]; then
        printf '%b\n' "${RED}No LICENSE_KEY found for this shell/session.${NC}"
        printf '%b\n' "${YELLOW}Set LICENSE_KEY in env or run 'bbx certify' once to persist it in ${CONFIG_FILE}.${NC}"
        exit 1
    fi

    if ! command -v jq >/dev/null 2>&1; then
        printf '%b\n' "${RED}jq is required for bbx vacancy.${NC}"
        exit 1
    fi

    local api_server="${BBX_LICENSE_SERVER_URL:-https://master.dosaygo.com}"
    local occupancy_url="${api_server}/v1/occupancy"
    local snapshot_url="${api_server}/v1/vacant-seat?reserve=0"
    local response=""
    local status=""
    local curl_rc=0
    local reservation_code=""
    local reserved_seat_id=""
    local ticket_id=""
    local ticket_slot=""
    local detail_level=""
    local seats_total=""
    local reserved_active=""
    local leased_active=""
    local free_now=""
    local vacant_seat=""
    local occupied_now=""
    local source_mode=""

    if [[ -f "$CERT_META_FILE" ]]; then
        # shellcheck disable=SC1090
        source "$CERT_META_FILE"
        reservation_code="${BBX_RESERVATION_CODE:-}"
        reserved_seat_id="${BBX_RESERVED_SEAT_ID:-}"
        ticket_id="${BBX_TICKET_ID:-}"
        ticket_slot="${BBX_TICKET_SLOT:-}"
    fi

    response=$(curl -sS --connect-timeout 7 --max-time 15 \
        -H "Authorization: Bearer ${LICENSE_KEY}" \
        -w $'\n%{http_code}' \
        "$occupancy_url") || curl_rc=$?

    if [[ "$curl_rc" -eq 0 ]]; then
        status="${response##*$'\n'}"
        response="${response%$'\n'*}"

        if [[ "$status" == "200" ]] && printf '%s' "$response" | jq empty >/dev/null 2>&1; then
            source_mode="occupancy-summary"
            detail_level=$(printf '%s' "$response" | jq -r '.detailLevel // "summary"')
            seats_total=$(printf '%s' "$response" | jq -r '.occupancy.totals.seatsTotal // 0')
            reserved_active=$(printf '%s' "$response" | jq -r '.occupancy.totals.reservedActive // 0')
            leased_active=$(printf '%s' "$response" | jq -r '.occupancy.totals.leasedActive // 0')
            free_now=$(printf '%s' "$response" | jq -r '.occupancy.totals.freeNow // 0')
            occupied_now=$((reserved_active + leased_active))

            jq -n \
                --arg apiServer "$api_server" \
                --arg sourceMode "$source_mode" \
                --arg detailLevel "$detail_level" \
                --argjson seatsTotal "$seats_total" \
                --argjson reservedActive "$reserved_active" \
                --argjson leasedActive "$leased_active" \
                --argjson occupiedNow "$occupied_now" \
                --argjson freeNow "$free_now" \
                --arg reservationCode "$reservation_code" \
                --arg reservedSeatId "$reserved_seat_id" \
                --arg ticketId "$ticket_id" \
                --arg ticketSlot "$ticket_slot" \
                --argjson raw "$response" \
                '{
                    api_server: $apiServer,
                    source: $sourceMode,
                    detail_level: $detailLevel,
                    totals: {
                        seats_total: $seatsTotal,
                        occupied_now: $occupiedNow,
                        vacant_now: $freeNow,
                        leased_active: $leasedActive,
                        reserved_active: $reservedActive
                    },
                    local_reservation: {
                        reservation_code: (if ($reservationCode | length) > 0 then $reservationCode else null end),
                        reserved_seat_id: (if ($reservedSeatId | length) > 0 then $reservedSeatId else null end),
                        ticket_id: (if ($ticketId | length) > 0 then $ticketId else null end),
                        ticket_slot: (if ($ticketSlot | length) > 0 then $ticketSlot else null end)
                    },
                    raw_snapshot: $raw
                }'
            return 0
        fi
    fi

    response=$(curl -sS --connect-timeout 7 --max-time 15 \
        -H "Authorization: Bearer ${LICENSE_KEY}" \
        "$snapshot_url") || curl_rc=$?

    if [[ "$curl_rc" -ne 0 ]]; then
        printf '%b\n' "${RED}Failed to query license server occupancy or vacancy snapshot.${NC}"
        exit "$curl_rc"
    fi

    if ! printf '%s' "$response" | jq empty >/dev/null 2>&1; then
        printf '%b\n' "${RED}License server returned non-JSON vacancy data.${NC}"
        printf "%s\n" "$response"
        exit 1
    fi

    source_mode="vacancy-snapshot-fallback"
    vacant_seat=$(printf '%s' "$response" | jq -r '.vacantSeat // empty')

    jq -n \
        --arg apiServer "$api_server" \
        --arg sourceMode "$source_mode" \
        --arg vacantSeat "$vacant_seat" \
        --arg reservationCode "$reservation_code" \
        --arg reservedSeatId "$reserved_seat_id" \
        --arg ticketId "$ticket_id" \
        --arg ticketSlot "$ticket_slot" \
        --argjson raw "$response" \
        '{
            api_server: $apiServer,
            source: $sourceMode,
            vacant_seat: (if ($vacantSeat | length) > 0 then $vacantSeat else null end),
            has_vacancy: ($vacantSeat | length > 0),
            local_reservation: {
                reservation_code: (if ($reservationCode | length) > 0 then $reservationCode else null end),
                reserved_seat_id: (if ($reservedSeatId | length) > 0 then $reservedSeatId else null end),
                ticket_id: (if ($ticketId | length) > 0 then $ticketId else null end),
                ticket_slot: (if ($ticketSlot | length) > 0 then $ticketSlot else null end)
            },
            raw_snapshot: $raw
        }'
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
    local expiry_file="$home_dir/.config/dosaygo/bbpro/expiry_time"

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
        $SUDO -u "$user" bash -c "mkdir -p \"${home_dir}/.config/dosaygo/bbpro\"; echo \"$new_expiry_timestamp\" > \"$expiry_file\""
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
    getent passwd "$1" | cut -d: -f6 2>/dev/null || echo "/home/$1";
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

# ─── --for <user> principal-aware execution helpers ─────────────────
# These are used when BBX_FOR_USER is set to route steps through
# the correct principal: operator (system-level) or target user (runtime).

# Target user's home directory
_tu_home() {
  if [[ "$(uname -s)" == "Darwin" ]]; then
    printf '%s' "/Users/$BBX_FOR_USER"
  else
    getent passwd "$BBX_FOR_USER" 2>/dev/null | cut -d: -f6 || printf '%s' "/home/$BBX_FOR_USER"
  fi
}

# Target user's BrowserBox config directory
_tu_config_dir() {
  printf '%s' "$(_tu_home)/.config/dosaygo/bbpro"
}

# Ensure target user's config directory exists with correct ownership
_tu_ensure_config_dir() {
  local tu_dir="$(_tu_config_dir)"
  if [[ ! -d "$tu_dir" ]]; then
    sudo -n mkdir -p "$tu_dir"
    sudo -n chown -R "$BBX_FOR_USER":"$(id -gn "$BBX_FOR_USER")" "$(_tu_home)/.config"
  fi
}

# Run a command as the target user with environment propagation.
# Usage: _tu_run <command> [args...]
_tu_run() {
  local _env_prefix=""
  # BBX_DELEGATE_PATH_PREFIX allows non-standard install locations to
  # take precedence in the delegated environment (default unchanged).
  printf -v _env_prefix 'export PATH=%s:"$PATH"' "${BBX_DELEGATE_PATH_PREFIX:-/usr/local/bin:/usr/bin:/bin}"
  printf -v _env_prefix '%s; export BBX_NO_UPDATE=true' "$_env_prefix"
  [[ -n "${LICENSE_KEY:-}" ]] && printf -v _env_prefix '%s; export LICENSE_KEY=%q' "$_env_prefix" "$LICENSE_KEY"
  [[ -n "${BBX_MINIMAL_MODE:-}" ]] && printf -v _env_prefix '%s; export BBX_MINIMAL_MODE=%q' "$_env_prefix" "$BBX_MINIMAL_MODE"
  [[ -n "${BBX_NONINTERACTIVE:-}" ]] && printf -v _env_prefix '%s; export BBX_NONINTERACTIVE=%q' "$_env_prefix" "$BBX_NONINTERACTIVE"
  [[ -n "${BBX_DEBUG:-}" ]] && printf -v _env_prefix '%s; export BBX_DEBUG=%q' "$_env_prefix" "$BBX_DEBUG"
  [[ -n "${EMAIL:-}" ]] && printf -v _env_prefix '%s; export EMAIL=%q' "$_env_prefix" "$EMAIL"
  [[ -n "${BBX_CALLER_DOMAIN:-}" ]] && printf -v _env_prefix '%s; export DOMAIN=%q; export BBX_CALLER_DOMAIN=%q' "$_env_prefix" "$BBX_CALLER_DOMAIN" "$BBX_CALLER_DOMAIN"
  [[ -n "${BBX_HOSTNAME:-}" ]] && printf -v _env_prefix '%s; export BBX_HOSTNAME=%q' "$_env_prefix" "$BBX_HOSTNAME"
  [[ -n "${HOST_PER_SERVICE:-}" ]] && printf -v _env_prefix '%s; export HOST_PER_SERVICE=%q' "$_env_prefix" "$HOST_PER_SERVICE"
  [[ -n "${BBX_HTTP_ONLY:-}" ]] && printf -v _env_prefix '%s; export BBX_HTTP_ONLY=%q' "$_env_prefix" "$BBX_HTTP_ONLY"
  [[ -n "${BBX_DONT_KILL_CHROME_ON_STOP:-}" ]] && printf -v _env_prefix '%s; export BBX_DONT_KILL_CHROME_ON_STOP=%q' "$_env_prefix" "$BBX_DONT_KILL_CHROME_ON_STOP"
  [[ -n "${BBX_CLEAN_SLATE:-}" ]] && printf -v _env_prefix '%s; export BBX_CLEAN_SLATE=%q' "$_env_prefix" "$BBX_CLEAN_SLATE"
  # Fleet-wide BrowserBox defaults (populated only by bbx fleet from
  # its validated defaults.env; empty for ordinary --for usage).
  if [[ -n "${BBX_FLEET_EXTRA_ENV+x}" ]]; then
    local _fleet_kv
    for _fleet_kv in "${BBX_FLEET_EXTRA_ENV[@]}"; do
      [[ "${_fleet_kv%%=*}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
      printf -v _env_prefix '%s; export %s=%q' "$_env_prefix" "${_fleet_kv%%=*}" "${_fleet_kv#*=}"
    done
  fi
  # Only propagate SSLCERTS_DIR if explicitly set via BBX_SSLCERTS_DIR.
  # The operator's test.env sets SSLCERTS_DIR to *their* cert path — passing
  # that to the target user would corrupt the operator's cert dir on chown.
  [[ -n "${BBX_SSLCERTS_DIR:-}" ]] && printf -v _env_prefix '%s; export SSLCERTS_DIR=%q' "$_env_prefix" "$BBX_SSLCERTS_DIR"

  local _cmd_str=""
  local _arg
  for _arg in "$@"; do
    printf -v _arg '%q' "$_arg"
    _cmd_str="${_cmd_str} ${_arg}"
  done

  sudo -n -u "$BBX_FOR_USER" bash -c "${_env_prefix};${_cmd_str}"
}

# Load config from target user's config directory into the current shell.
_tu_load_config() {
  local _tcd="$(_tu_config_dir)"
  local _tcf="${_tcd}/config"
  local _tte="${_tcd}/test.env"

  # Preserve caller-provided identity and explicit DOMAIN override.
  local _env_lk="${LICENSE_KEY:-}"
  local _env_em="${EMAIL:-}"
  local _env_hn="${BBX_HOSTNAME:-}"
  local _env_domain="${BBX_CALLER_DOMAIN:-}"

  if sudo -n test -f "$_tcf" 2>/dev/null; then
    eval "$(sudo -n cat "$_tcf" 2>/dev/null)"
  fi
  if sudo -n test -f "$_tte" 2>/dev/null; then
    eval "$(sudo -n cat "$_tte" 2>/dev/null)"
    PORT="${APP_PORT:-$PORT}"
    TOKEN="${LOGIN_TOKEN:-$TOKEN}"

    # PRECEDENCE RULES:
    # 1. Explicit DOMAIN/BBX_CALLER_DOMAIN wins (handled after eval)
    # 2. Saved DOMAIN wins over ambient localhost
    if [[ -n "${DOMAIN:-}" ]] && [[ "$_env_hn" == "localhost" ]]; then
        BBX_HOSTNAME="$DOMAIN"
    elif [[ -z "${BBX_HOSTNAME:-}" && -n "${DOMAIN:-}" ]]; then
        BBX_HOSTNAME="$DOMAIN"
    fi
  fi

  # Restore caller-provided identity. Target runtime config owns host/domain;
  # DOMAIN is the explicit operator override path for cross-user runs.
  [[ -n "$_env_lk" ]] && LICENSE_KEY="$_env_lk"
  [[ -n "$_env_em" ]] && EMAIL="$_env_em"

  if [[ -n "$_env_domain" ]]; then
    DOMAIN="$_env_domain"
    BBX_HOSTNAME="$_env_domain"
  elif [[ -n "$_env_hn" ]]; then
    if [[ "$_env_hn" != "localhost" ]] || [[ -z "${BBX_HOSTNAME:-}" ]] || [[ "${BBX_HOSTNAME:-}" == "localhost" ]]; then
        BBX_HOSTNAME="$_env_hn"
    fi
  fi

  # Never trust persisted SSLCERTS_DIR from target user's test.env in --for path.
  # Use BBX_SSLCERTS_DIR if explicit, otherwise target user's ~/sslcerts.
  if [[ -n "${BBX_SSLCERTS_DIR:-}" ]]; then
    SSLCERTS_DIR="$BBX_SSLCERTS_DIR"
  else
    SSLCERTS_DIR="$(_tu_home)/sslcerts"
  fi
}

# ─── --for <user> delegated command implementations ─────────────────

# Delegated setup: system-level work as operator, user-level as target.
_for_setup() {
  load_config
  ensure_deps

  _tu_ensure_config_dir
  # Ensure installation_id for target user
  _tu_run bash -c 'dir="${HOME}/.config/dosaygo/bbpro"; mkdir -p "$dir"; if [ ! -f "$dir/installation_id" ]; then uuidgen > "$dir/installation_id" 2>/dev/null || openssl rand -hex 16 > "$dir/installation_id"; fi'

  local port="${PORT:-$(find_free_port_block)}"
  local hostname="${BBX_HOSTNAME:-$(get_system_hostname)}"
  local token=""
  local zeta_mode=""
  local backend_scheme=""

  while [ $# -gt 0 ]; do
    case "$1" in
      --port|-p)
        [[ -z "$2" ]] && { printf "${RED}Error: $1 requires an argument${NC}\n"; exit 1; }
        port="$2"; shift 2 ;;
      --hostname|-h)
        [[ -z "$2" ]] && { printf "${RED}Error: $1 requires an argument${NC}\n"; exit 1; }
        hostname="$2"; shift 2 ;;
      --token|-t)
        [[ -z "$2" ]] && { printf "${RED}Error: $1 requires an argument${NC}\n"; exit 1; }
        token="$2"; shift 2 ;;
      --zeta|-z) zeta_mode="true"; shift ;;
      --http-only|-o) backend_scheme="http"; shift ;;
      --backend)
        [[ "$2" != "http" && "$2" != "https" ]] && { printf "${RED}Error: --backend must be http or https${NC}\n"; exit 1; }
        backend_scheme="$2"; shift 2 ;;
      --flipbook-record|--flipbook-description) shift 2 ;; # skip flipbook for --for
      *) printf "${RED}Unknown option: $1${NC}\n"; exit 1 ;;
    esac
  done

  if ! [[ "$port" =~ ^[0-9]+$ ]] || [ "$port" -lt 1024 ] || [ "$port" -gt 65535 ]; then
    printf "${RED}Invalid port: $port. Must be between 1024 and 65535.${NC}\n"
    exit 1
  fi

  local normalized_hostname
  normalized_hostname="$(normalize_hostname_for_local_use "$hostname")"
  hostname="$normalized_hostname"

  local setup_port="$port"
  local setup_hostname="$hostname"
  local setup_token="${token:-$(openssl rand -hex 16)}"

  if [[ -n "$zeta_mode" ]] && [[ "$setup_hostname" == "localhost" ]]; then
    printf "${YELLOW}localhost is incompatible with zeta mode due to widespread conventions against *.localhost subdomains. Changing hostname to bbx.test${NC}\n"
    setup_hostname="bbx.test"
  fi

  printf "${YELLOW}[--for %s] Setting up BrowserBox on %s:%s...${NC}\n" "$BBX_FOR_USER" "$setup_hostname" "$setup_port"

  # System-level: hosts entry (operator context)
  if [[ -z "${BBX_CLOUD_RUN:-}" ]] && [[ "${BBX_FLY:-}" != "true" ]]; then
    if ! is_local_hostname "$setup_hostname"; then
      wait_for_hostname "$setup_hostname" || { printf "${RED}Hostname %s not resolving${NC}\n" "$setup_hostname"; exit 1; }
    else
      ensure_hosts_entry "$setup_hostname"
    fi
    # TLS certificate — generate into the *target user's* home so Node.js can
    # read them when running as the target user.  tls writes to $HOME/sslcerts
    # and mkcert may need sudo, so we pass HOME and run via sudo.
    if [[ "$backend_scheme" != "http" ]]; then
      local _tls_path
      _tls_path="$(command -v tls 2>/dev/null || true)"
      if [[ -n "$_tls_path" ]]; then
        local _tls_env_extra=""
        [[ -n "${BBX_SSLCERTS_DIR:-}" ]] && _tls_env_extra="SSLCERTS_DIR=${BBX_SSLCERTS_DIR}"
        sudo -n HOME="$(_tu_home)" EMAIL="${EMAIL:-s@dosaygo.com}" BB_USER_EMAIL="${EMAIL:-s@dosaygo.com}" PATH="/usr/local/bin:${PATH}" ${_tls_env_extra} "$_tls_path" "$setup_hostname" \
          || { printf "${RED}Hostname %s certificate not acquired${NC}\n" "$setup_hostname"; exit 1; }
        # Fix ownership so the target user's Node.js can read the certs
        local _tu_ssl="${BBX_SSLCERTS_DIR:-$(_tu_home)/sslcerts}"
        if sudo -n test -d "$_tu_ssl" 2>/dev/null; then
          sudo -n chown -R "${BBX_FOR_USER}:" "$_tu_ssl"
        fi
      fi
    fi
  fi

  # License validation (operator context)
  if ! validate_license_key; then
    printf "${RED}License key invalid or missing. Run 'bbx activate' or visit dosaygo.com.${NC}\n"
  fi

  # Port testing (operator context)
  pkill ncat &>/dev/null
  for i in {-2..2}; do
    test_port_access $((setup_port+i)) || { printf "${RED}Port $((setup_port+i)) blocked.${NC}\n"; exit 1; }
  done
  test_port_access $((setup_port-3000)) || { printf "${RED}CDP port $((setup_port-3000)) blocked.${NC}\n"; exit 1; }

  BBX_HOSTNAME="$setup_hostname"

  # Target-user: run setup_bbpro
  local setup_args=("--port" "$setup_port" "--token" "$setup_token")
  [[ -n "$zeta_mode" ]] && setup_args+=("--zeta")
  [[ -n "$backend_scheme" ]] && setup_args+=("--backend" "$backend_scheme")

  printf "${CYAN}[--for %s] Running setup_bbpro as target user...${NC}\n" "$BBX_FOR_USER"
  _tu_run setup_bbpro "${setup_args[@]}" || { printf "${RED}[--for %s] setup_bbpro failed.${NC}\n" "$BBX_FOR_USER"; exit 1; }

  _tu_load_config

  printf "${GREEN}[--for %s] Setup complete.${NC}\n" "$BBX_FOR_USER"
  local tu_config_dir="$(_tu_config_dir)"
  draw_box "Login Link: $(sudo -n cat "${tu_config_dir}/login.link" 2>/dev/null || echo "https://${setup_hostname}:${setup_port}/login?token=${setup_token}")"
  if [[ -n "$zeta_mode" ]]; then
    printf "${PURPLE}[ZETA MODE]${NC}${BOLD} Your login link above WILL change. Await the run command for your correct login link.\n"
  fi
}

# Delegated run: certify + launch services as target user.
_for_run() {
  local tu_config_dir="$(_tu_config_dir)"

  # Load target user's config
  _tu_load_config

  # Verify setup has been run for target user
  if [[ -z "${PORT:-}" ]] || ! sudo -n test -f "${tu_config_dir}/test.env" 2>/dev/null; then
    printf "${YELLOW}[--for %s] BrowserBox not configured. Running setup first...${NC}\n" "$BBX_FOR_USER"
    _for_setup "$@"
    _tu_load_config
  fi

  local port="${PORT}"
  local hostname="${BBX_HOSTNAME:-localhost}"
  hostname="$(normalize_hostname_for_local_use "$hostname")"
  local zeta_mode="${HOST_PER_SERVICE:-}"
  local http_only="${BBX_HTTP_ONLY:-}"

  if [[ -z "${LICENSE_KEY:-}" ]]; then
    printf "${RED}No LICENSE_KEY found. Set it in env or run 'bbx certify'.${NC}\n"
    exit 1
  fi

  if ! is_local_hostname "$hostname"; then
    wait_for_hostname "$hostname" || { printf "${RED}Hostname %s not resolving${NC}\n" "$hostname"; exit 1; }
  else
    ensure_hosts_entry "$hostname"
  fi

  printf "${YELLOW}[--for %s] Starting BrowserBox on %s:%s...${NC}\n" "$BBX_FOR_USER" "$hostname" "$port"

  # Certify license as target user (background)
  printf "${YELLOW}[--for %s] Certifying license...${NC}\n" "$BBX_FOR_USER"
  local cert_log; cert_log="$(mktemp /tmp/bbx-for-cert-XXXXXX.log)"
  _tu_run bbcertify > "$cert_log" 2>&1 &
  local CERT_PID=$!

  # Start bbpro as target user
  printf "${YELLOW}[--for %s] Starting services...${NC}\n" "$BBX_FOR_USER"
  local bbpro_log; bbpro_log="$(mktemp /tmp/bbx-for-bbpro-XXXXXX.log)"
  if [[ -n "${BBX_DEBUG:-}" ]]; then
    _tu_run bbpro 2>&1 | tee "$bbpro_log"
    local bbpro_rc=${PIPESTATUS[0]}
  else
    _tu_run bbpro > "$bbpro_log" 2>&1
    local bbpro_rc=$?
  fi
  if [[ "$bbpro_rc" -ne 0 ]]; then
    printf "${RED}[--for %s] Failed to start (exit %d). Output:${NC}\n" "$BBX_FOR_USER" "$bbpro_rc"
    tail -20 "$bbpro_log"
    rm -f "$bbpro_log" "$cert_log"
    kill "$CERT_PID" 2>/dev/null
    exit 1
  fi
  rm -f "$bbpro_log"

  # Wait for certification (bounded: 120s)
  local _cert_t0=$SECONDS
  while kill -0 "$CERT_PID" 2>/dev/null; do
    if (( SECONDS - _cert_t0 >= 120 )); then
      printf "${RED}[--for %s] License certification timed out.${NC}\n" "$BBX_FOR_USER"
      tail -20 "$cert_log"
      kill "$CERT_PID" 2>/dev/null; rm -f "$cert_log"
      exit 1
    fi
    sleep 1
  done
  if ! wait "$CERT_PID"; then
    printf "${RED}[--for %s] License check failed.${NC}\n" "$BBX_FOR_USER"
    tail -20 "$cert_log"
    rm -f "$cert_log"
    exit 1
  fi
  rm -f "$cert_log"
  printf "${GREEN}[--for %s] License certified.${NC}\n" "$BBX_FOR_USER"

  # Reload config and display login link
  _tu_load_config
  local login_link=""
  local login_scheme="https"
  [[ -n "$http_only" ]] && login_scheme="http"

  if [[ -n "$zeta_mode" ]] && sudo -n test -f "${tu_config_dir}/hosts.env" 2>/dev/null; then
    eval "$(sudo -n cat "${tu_config_dir}/hosts.env" 2>/dev/null)"
    local addr_var_name="ADDR_${PORT}"
    local zeta_host="${!addr_var_name}"
    login_link="${login_scheme}://${zeta_host}/login?token=${TOKEN}"
  else
    login_link="${login_scheme}://${hostname}:${port}/login?token=${TOKEN}"
  fi

  # Save login link to target user's config
  printf '%s' "$login_link" | sudo -n -u "$BBX_FOR_USER" tee "${tu_config_dir}/login.link" >/dev/null

  draw_box "Login Link: ${login_link}"
}

# Delegated ng-run: system nginx as operator, then delegated setup + run.
_for_ng_run() {
  banner
  load_config
  ensure_deps

  # Trigger setup if not fully configured for target user
  _tu_load_config
  if [[ -z "${HOST_PER_SERVICE:-}" ]] || [[ -z "${PORT:-}" ]] || [[ -z "${BBX_HOSTNAME:-}" ]] || ! sudo -n test -f "$(_tu_config_dir)/test.env" 2>/dev/null; then
    printf "${YELLOW}[--for %s] BrowserBox not fully set up. Running setup first...${NC}\n" "$BBX_FOR_USER"
    _for_setup -z "$@"
    _tu_load_config
  fi
  local _target_domain="${DOMAIN:-${BBX_HOSTNAME:-}}"

  # System-level: nginx setup (operator context — nginx is global)
  # setup_nginx reads target config via BBX_CONFIG_DIR and writes certs under
  # HOME. Keep HOME pointed at the target user for default cert locations, but
  # do not rely on sudo preserving HOME for config discovery.
  printf "${YELLOW}[--for %s] Starting Nginx setup (operator)...${NC}\n" "$BBX_FOR_USER"
  if command -v setup_nginx &>/dev/null; then
    local _sn_path
    _sn_path="$(command -v setup_nginx)"
    local _sn_operator_user="${BBX_OPERATOR_USER:-$(id -un)}"
    local _tu_config_dir="$(_tu_config_dir)"
    local _sn_env=(
      "HOME=$(_tu_home)"
      "BBX_CONFIG_DIR=${_tu_config_dir}"
      "USER=$_sn_operator_user"
      "LOGNAME=$_sn_operator_user"
      "EMAIL=${EMAIL:-s@dosaygo.com}"
      "BBX_FOR_TARGET_DOMAIN=${_target_domain}"
      "BBX_HOSTNAME=${_target_domain}"
      "PATH=/usr/local/bin:${PATH}"
    )
    if [[ -n "${BBX_CALLER_DOMAIN:-}" ]]; then
      _sn_env+=("DOMAIN=${BBX_CALLER_DOMAIN}" "BBX_CALLER_DOMAIN=${BBX_CALLER_DOMAIN}")
    fi
    [[ -n "${BBX_SSLCERTS_DIR:-}" ]] && _sn_env+=("SSLCERTS_DIR=${BBX_SSLCERTS_DIR}")
    # Preserve operator identity for user-prefixed nginx config filenames and cleanup.
    if ! sudo -n "${_sn_env[@]}" "$_sn_path"; then
      printf "${RED}[--for %s] Nginx setup failed.${NC}\n" "$BBX_FOR_USER"
      exit 1
    fi
    # mkcert runs as root so certs are root-owned. The target user's Node.js
    # process needs to read them for TLS (e.g. bbx run --for). Fix ownership.
    local _tu_ssl="${BBX_SSLCERTS_DIR:-$(_tu_home)/sslcerts}"
    if sudo -n test -d "$_tu_ssl" 2>/dev/null; then
      sudo -n chown -R "${BBX_FOR_USER}:" "$_tu_ssl"
    fi
    printf "${GREEN}[--for %s] Nginx setup complete.${NC}\n" "$BBX_FOR_USER"
  else
    printf "${YELLOW}[--for %s] Warning: setup_nginx not found. Skipped.${NC}\n" "$BBX_FOR_USER"
  fi

  # Target-user: run
  _for_run "$@"
}

# Delegated stop: stop services as target user.
_for_stop() {
  printf "${YELLOW}[--for %s] Stopping BrowserBox...${NC}\n" "$BBX_FOR_USER"
  # Clear login link
  local tu_config_dir="$(_tu_config_dir)"
  sudo -n rm -f "${tu_config_dir}/login.link" 2>/dev/null

  _tu_run stop_bbpro 2>/dev/null || {
    printf "${RED}[--for %s] Failed to stop. Check if BrowserBox is running for this user.${NC}\n" "$BBX_FOR_USER"
    exit 1
  }
  printf "${GREEN}[--for %s] BrowserBox stopped.${NC}\n" "$BBX_FOR_USER"
}

# Delegated status: check target user's services.
_for_status() {
  local tu_config_dir="$(_tu_config_dir)"
  _tu_load_config
  printf "${CYAN}[--for %s] BrowserBox status:${NC}\n" "$BBX_FOR_USER"

  if _tu_run browserbox pm2 list 2>/dev/null; then
    printf "${GREEN}[--for %s] Services running.${NC}\n" "$BBX_FOR_USER"
  else
    printf "${YELLOW}[--for %s] No services detected.${NC}\n" "$BBX_FOR_USER"
  fi

  if sudo -n test -f "${tu_config_dir}/login.link" 2>/dev/null; then
    printf "Login: %s\n" "$(sudo -n cat "${tu_config_dir}/login.link" 2>/dev/null)"
  fi
}
# ─── end --for <user> helpers ───────────────────────────────────────

# ═══════════════════════════════════════════════════════════════════
# FLEET — machine-level pool of ephemeral clean-slate BrowserBox
# sessions (Linux only). A privileged operator initializes a fixed
# pool of reusable OS-user "seats"; an external application acquires
# and releases allocations. Reuses the --for delegated-user machinery
# (_tu_*/_for_*) for all per-seat BrowserBox lifecycle work.
#
# Override: AR-R4 — The 4000-Line File
# Reason: Fleet is logically distributed with standalone bbx.sh today and will
#         later migrate to a compiled Rust/Freelang binary.
# Risk: Further increases the oversized file's maintenance burden.
# Mitigation: Keep Fleet changes bounded, retain one release primitive, cover
#             lifecycle behavior with focused tests, and extract it during the
#             future compiled implementation.
# ═══════════════════════════════════════════════════════════════════

# Fleet state layout (operator-owned, mode 0700/0600):
#   ${BB_CONFIG_DIR}/fleet/
#     fleet.env        deployment configuration
#     defaults.env     fleet-wide BrowserBox env defaults
#     routing.env      routing/DNS/cert status metadata
#     lock             flock serialization point
#     seats/           one record per seat
#     allocations/     one record per active allocation
#     nginx/           generated nginx config + previous good copy
#     diagnostics/     doctor/reconcile reports

FLEET_JSON=0
_FLEET_STDOUT_FD=1
_FLEET_LOCK_FD=""
FLEET_DIR=""
FLEET_NGINX_SITE_NAME="bbx-fleet.conf"

# Fleet configuration (loaded from fleet.env; defaults per spec)
FLEET_SIZE=10
FLEET_USER_PREFIX="bbx-seat-"
FLEET_USER_WIDTH=4
FLEET_PORT_START=7000
FLEET_PORT_END=20000
FLEET_DOMAIN=""
FLEET_ROUTING_MODE="subdomain"
FLEET_SUBDOMAIN_MODE="port"
FLEET_BACKEND="https"
FLEET_SESSION_TIMEOUT=0
FLEET_CLEAN_SLATE=true

# Stale transitional allocations older than this (seconds) with no
# runtime are recovered by the monitor/reaper.
FLEET_STALE_RESERVE_SECS="${FLEET_STALE_RESERVE_SECS:-900}"

# Dead running allocations are confirmed across a bounded grace window
# before automatic release. Acquire invokes the shorter fallback only
# after its lightweight reservation path finds no capacity.
FLEET_REAP_GRACE_SECS="${FLEET_REAP_GRACE_SECS:-15}"
FLEET_REAP_INTERVAL_SECS="${FLEET_REAP_INTERVAL_SECS:-5}"
FLEET_ACQUIRE_REAP_GRACE_SECS="${FLEET_ACQUIRE_REAP_GRACE_SECS:-2}"
FLEET_MONITOR_MAX_BACKOFF_SECS="${FLEET_MONITOR_MAX_BACKOFF_SECS:-300}"
FLEET_MONITOR_FAILURE_DETAIL_LIMIT="${FLEET_MONITOR_FAILURE_DETAIL_LIMIT:-10}"

# ── Output helpers ──────────────────────────────────────────────────

_fleet_json_escape() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\r'/\\r}"
  s="${s//$'\t'/\\t}"
  printf '%s' "$s"
}

# Emit final JSON (or text) to the real stdout even when stdout has
# been redirected to stderr for JSON purity.
_fleet_emit() {
  printf '%s\n' "$1" >&"$_FLEET_STDOUT_FD"
}

_fleet_info() { printf '%b\n' "${CYAN}[fleet]${NC} $1" >&2; }
_fleet_warn() { printf '%b\n' "${YELLOW}[fleet] $1${NC}" >&2; }

# _fleet_fail <code> <message> — emit stable error and exit nonzero.
_fleet_fail() {
  local code="$1" msg="$2"
  if (( FLEET_JSON )); then
    _fleet_emit "{\"ok\":false,\"error\":{\"code\":\"$(_fleet_json_escape "$code")\",\"message\":\"$(_fleet_json_escape "$msg")\"}}"
  else
    printf '%b\n' "${RED}Error: ${msg}${NC}" >&2
    printf '  (error code: %s)\n' "$code" >&2
  fi
  _fleet_unlock
  exit 1
}

# ── Platform / privilege gates ──────────────────────────────────────

_fleet_require_linux() {
  if [[ "$(uname -s)" != "Linux" ]]; then
    if (( FLEET_JSON )); then
      _fleet_emit '{"ok":false,"error":{"code":"fleet_unsupported_platform","message":"bbx fleet is supported only on Linux."}}'
    else
      printf 'Error: bbx fleet is supported only on Linux.\n' >&2
    fi
    exit 1
  fi
}

_fleet_require_priv() {
  if ! command -v sudo >/dev/null 2>&1; then
    _fleet_fail fleet_privilege_required "bbx fleet requires sudo to be installed (used for per-seat delegation)."
  fi
  if [[ "$EUID" -ne 0 ]] && ! sudo -n true 2>/dev/null; then
    _fleet_fail fleet_privilege_required "bbx fleet requires root or an operator with passwordless sudo."
  fi
}

_fleet_now() { date -u +'%Y-%m-%dT%H:%M:%SZ'; }
_fleet_epoch() { date +%s; }

# Convert a stored ISO-8601 UTC timestamp to epoch (0 on parse failure).
_fleet_ts_to_epoch() {
  local ts="$1"
  [[ "$ts" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]] || { echo 0; return; }
  date -u -d "${ts%Z}" +%s 2>/dev/null || echo 0
}

# ── Validation primitives ───────────────────────────────────────────
# Every value read from Fleet state or CLI input is validated before
# use. State records are never sourced or eval'd.

_fleet_valid_int() { [[ "$1" =~ ^[0-9]{1,10}$ ]]; }
_fleet_valid_port() { [[ "$1" =~ ^[0-9]{2,5}$ ]] && (( $1 >= 1024 && $1 <= 65535 )); }
_fleet_valid_username() { [[ "$1" =~ ^[a-z_][a-z0-9_-]{0,31}$ ]]; }
_fleet_valid_user_prefix() { [[ "$1" =~ ^[a-z_][a-z0-9_-]{0,24}$ ]]; }
_fleet_valid_label() { [[ "$1" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$ ]]; }
_fleet_valid_state() { case "$1" in reserved|starting|running|releasing|failed) return 0;; *) return 1;; esac; }
_fleet_valid_alloc_id() { [[ "$1" =~ ^bbxf-[a-f0-9]{32}$ ]]; }
_fleet_valid_bool() { [[ "$1" == "true" || "$1" == "false" ]]; }
_fleet_valid_envkey() { [[ "$1" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; }
_fleet_valid_ts() { [[ "$1" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]]; }
_fleet_valid_reap_seconds() { [[ "$1" =~ ^(0|[1-9][0-9]{0,4})$ ]] && (( $1 <= 86400 )); }
_fleet_valid_log_detail_limit() { [[ "$1" =~ ^(0|[1-9][0-9]{0,2})$ ]] && (( $1 <= 100 )); }

_fleet_valid_domain() {
  local d="$1"
  [[ -n "$d" ]] || return 1
  (( ${#d} <= 253 )) || return 1
  [[ "$d" != *"://"* && "$d" != */* && "$d" != *" "* ]] || return 1
  [[ "$d" =~ ^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)*$ ]]
}

_fleet_valid_hostname() { _fleet_valid_domain "$1"; }

_fleet_valid_url() {
  [[ "$1" =~ ^https?://[A-Za-z0-9._~:/?#=\&%-]+$ ]]
}

# Local-only domains route via /etc/hosts + local certs (no public DNS).
_fleet_is_local_domain() {
  case "$1" in
    localhost|*.localhost|*.local|*.lan|*.home|*.internal|*.test) return 0;;
    *) return 1;;
  esac
}

# ── State directory management ──────────────────────────────────────

_fleet_set_dir() {
  FLEET_DIR="${BB_CONFIG_DIR}/fleet"
}

# Reject symlinked state directories/records (symlink attack guard).
_fleet_assert_not_symlink() {
  local p="$1"
  if [[ -L "$p" ]]; then
    _fleet_fail fleet_state_inconsistent "Fleet state path is a symlink (refusing): $p"
  fi
}

_fleet_dirs_ready() {
  [[ -d "$FLEET_DIR" && -f "${FLEET_DIR}/fleet.env" ]]
}

_fleet_dirs_init() {
  local d
  for d in "$FLEET_DIR" "${FLEET_DIR}/seats" "${FLEET_DIR}/allocations" "${FLEET_DIR}/nginx" "${FLEET_DIR}/diagnostics"; do
    _fleet_assert_not_symlink "$d"
    mkdir -p "$d"
    chmod 700 "$d"
  done
  if [[ ! -f "${FLEET_DIR}/lock" ]]; then
    : > "${FLEET_DIR}/lock"
  fi
  chmod 600 "${FLEET_DIR}/lock"
}

_fleet_require_init() {
  _fleet_set_dir
  if ! _fleet_dirs_ready; then
    _fleet_fail fleet_not_initialized "Fleet is not initialized. Run: sudo bbx fleet init --size <n> [--domain <host>]"
  fi
  _fleet_assert_not_symlink "$FLEET_DIR"
  _fleet_assert_not_symlink "${FLEET_DIR}/seats"
  _fleet_assert_not_symlink "${FLEET_DIR}/allocations"
  _fleet_config_load
}

# ── Locking ─────────────────────────────────────────────────────────
# All seat/allocation ownership decisions happen under this exclusive
# lock. The lock is NEVER held across long-running lifecycle work
# (setup, certification, startup, shutdown, cert issuance).

_fleet_lock() {
  local timeout="${1:-30}"
  [[ -n "$_FLEET_LOCK_FD" ]] && return 0
  if ! command -v flock >/dev/null 2>&1; then
    _fleet_fail fleet_state_inconsistent "flock is required for bbx fleet but was not found."
  fi
  exec {_FLEET_LOCK_FD}>>"${FLEET_DIR}/lock" || _fleet_fail fleet_state_inconsistent "Cannot open Fleet lock file."
  if ! flock -w "$timeout" "$_FLEET_LOCK_FD"; then
    exec {_FLEET_LOCK_FD}>&-
    _FLEET_LOCK_FD=""
    _fleet_fail fleet_state_inconsistent "Timed out waiting for the Fleet lock (${timeout}s)."
  fi
}

_fleet_unlock() {
  [[ -n "$_FLEET_LOCK_FD" ]] || return 0
  flock -u "$_FLEET_LOCK_FD" 2>/dev/null || true
  exec {_FLEET_LOCK_FD}>&- 2>/dev/null || true
  _FLEET_LOCK_FD=""
}

# ── Record I/O ──────────────────────────────────────────────────────
# Records are plain KEY=VALUE lines. They are parsed with a constrained
# reader — never sourced, never eval'd — and every value is validated
# against a per-key pattern before use.

# _fleet_record_kv_valid <key> <value>
_fleet_record_kv_valid() {
  local key="$1" val="$2"
  case "$key" in
    SEAT_INDEX|MAIN_PORT|TIMEOUT_SECONDS|FLEET_SIZE|FLEET_USER_WIDTH|FLEET_PORT_START|FLEET_PORT_END|FLEET_SESSION_TIMEOUT)
      _fleet_valid_int "$val" ;;
    SEAT_NAME|LINUX_USER)
      _fleet_valid_username "$val" ;;
    FLEET_USER_PREFIX)
      _fleet_valid_user_prefix "$val" ;;
    PUBLIC_HOSTNAME|HOST_M2|HOST_M1|HOST_MAIN|HOST_P1|HOST_P2)
      _fleet_valid_hostname "$val" ;;
    FLEET_DOMAIN|DNS_CHECK_HOST)
      [[ -z "$val" ]] || _fleet_valid_domain "$val" ;;
    ROUTING_LABEL|LABEL_M2|LABEL_M1|LABEL_P1|LABEL_P2)
      _fleet_valid_label "$val" ;;
    STATE)
      _fleet_valid_state "$val" ;;
    ALLOCATION_ID)
      _fleet_valid_alloc_id "$val" ;;
    ELIGIBLE|FLEET_CLEAN_SLATE|DNS_VALID|DNS_PROXIED|CERT_VALID|NGINX_APPLIED)
      _fleet_valid_bool "$val" ;;
    CREATED_AT|UPDATED_AT|CHECKED_AT)
      _fleet_valid_ts "$val" ;;
    LOGIN_URL)
      [[ -z "$val" ]] || _fleet_valid_url "$val" ;;
    ROUTING_MODE|FLEET_ROUTING_MODE)
      [[ "$val" == "subdomain" || "$val" == "direct-port" ]] ;;
    FLEET_SUBDOMAIN_MODE)
      [[ "$val" == "port" || "$val" == "seat" || "$val" == "random" ]] ;;
    FLEET_BACKEND)
      [[ "$val" == "http" || "$val" == "https" ]] ;;
    RUNTIME_MARKER)
      [[ "$val" =~ ^[0-9]{1,12}$ ]] ;;
    CERT_FILE|KEY_FILE)
      [[ -z "$val" ]] || [[ "$val" =~ ^/[A-Za-z0-9._/-]+$ && "$val" != *".."* ]] ;;
    *)
      return 1 ;;
  esac
}

# _fleet_record_get <file> <key> — print validated value or fail.
_fleet_record_get() {
  local file="$1" key="$2" line val
  [[ -f "$file" && ! -L "$file" ]] || return 1
  line="$(grep -m1 -E "^${key}=" "$file" 2>/dev/null)" || return 1
  val="${line#*=}"
  _fleet_record_kv_valid "$key" "$val" || return 1
  printf '%s' "$val"
}

# _fleet_record_write <file> KEY=VALUE... — atomic replace, mode 0600.
# Every pair is validated before writing.
_fleet_record_write() {
  local file="$1"; shift
  local dir tmp kv key val
  _fleet_assert_not_symlink "$file"
  dir="$(dirname "$file")"
  tmp="$(mktemp "${dir}/.rec.XXXXXX")" || _fleet_fail fleet_state_inconsistent "Cannot create temp record in ${dir}."
  chmod 600 "$tmp"
  for kv in "$@"; do
    key="${kv%%=*}"
    val="${kv#*=}"
    if ! _fleet_record_kv_valid "$key" "$val"; then
      rm -f "$tmp"
      _fleet_fail fleet_state_inconsistent "Refusing to write invalid record field ${key}."
    fi
    printf '%s=%s\n' "$key" "$val" >> "$tmp"
  done
  mv -f "$tmp" "$file"
}

# _fleet_record_update <file> KEY=VALUE... — rewrite with given keys
# replaced, all other existing valid keys preserved.
_fleet_record_update() {
  local file="$1"; shift
  local -a out=()
  local -A newkeys=()
  local kv key line val
  for kv in "$@"; do
    newkeys["${kv%%=*}"]=1
    out+=("$kv")
  done
  if [[ -f "$file" && ! -L "$file" ]]; then
    while IFS= read -r line; do
      key="${line%%=*}"
      val="${line#*=}"
      [[ -n "$key" && "$line" == *"="* ]] || continue
      [[ -n "${newkeys[$key]:-}" ]] && continue
      _fleet_record_kv_valid "$key" "$val" || continue
      out+=("${key}=${val}")
    done < "$file"
  fi
  _fleet_record_write "$file" "${out[@]}"
}

# ── Fleet configuration ─────────────────────────────────────────────

_fleet_config_path() { printf '%s' "${FLEET_DIR}/fleet.env"; }

_fleet_config_load() {
  local f; f="$(_fleet_config_path)"
  [[ -f "$f" ]] || return 0
  local v
  v="$(_fleet_record_get "$f" FLEET_SIZE)" && FLEET_SIZE="$v"
  v="$(_fleet_record_get "$f" FLEET_USER_PREFIX)" && FLEET_USER_PREFIX="$v"
  v="$(_fleet_record_get "$f" FLEET_USER_WIDTH)" && FLEET_USER_WIDTH="$v"
  v="$(_fleet_record_get "$f" FLEET_PORT_START)" && FLEET_PORT_START="$v"
  v="$(_fleet_record_get "$f" FLEET_PORT_END)" && FLEET_PORT_END="$v"
  v="$(_fleet_record_get "$f" FLEET_DOMAIN)" && FLEET_DOMAIN="$v"
  v="$(_fleet_record_get "$f" FLEET_ROUTING_MODE)" && FLEET_ROUTING_MODE="$v"
  v="$(_fleet_record_get "$f" FLEET_SUBDOMAIN_MODE)" && FLEET_SUBDOMAIN_MODE="$v"
  v="$(_fleet_record_get "$f" FLEET_BACKEND)" && FLEET_BACKEND="$v"
  v="$(_fleet_record_get "$f" FLEET_SESSION_TIMEOUT)" && FLEET_SESSION_TIMEOUT="$v"
  v="$(_fleet_record_get "$f" FLEET_CLEAN_SLATE)" && FLEET_CLEAN_SLATE="$v"
  return 0
}

_fleet_config_validate() {
  _fleet_valid_int "$FLEET_SIZE" && (( FLEET_SIZE >= 1 )) \
    || _fleet_fail fleet_invalid_config "Fleet size must be a positive integer."
  _fleet_valid_user_prefix "$FLEET_USER_PREFIX" \
    || _fleet_fail fleet_invalid_config "Invalid Fleet user prefix '${FLEET_USER_PREFIX}'."
  _fleet_valid_int "$FLEET_USER_WIDTH" && (( FLEET_USER_WIDTH >= 1 && FLEET_USER_WIDTH <= 6 )) \
    || _fleet_fail fleet_invalid_config "Fleet user width must be 1-6."
  (( FLEET_SIZE <= 10 ** FLEET_USER_WIDTH )) \
    || _fleet_fail fleet_invalid_config "User width ${FLEET_USER_WIDTH} is insufficient for size ${FLEET_SIZE}."
  (( ${#FLEET_USER_PREFIX} + FLEET_USER_WIDTH <= 32 )) \
    || _fleet_fail fleet_invalid_config "Prefix plus width exceeds the 32-character Linux username limit."
  _fleet_valid_int "$FLEET_PORT_START" && _fleet_valid_int "$FLEET_PORT_END" \
    || _fleet_fail fleet_invalid_config "Fleet port bounds must be integers."
  (( FLEET_PORT_START >= 4024 )) \
    || _fleet_fail fleet_invalid_config "Fleet main ports must be at least 4024 (CDP port = main - 3000 must be >= 1024)."
  (( FLEET_PORT_END <= 65533 )) \
    || _fleet_fail fleet_invalid_config "Fleet port end must be at most 65533 (port set spans main+2)."
  (( FLEET_PORT_START <= FLEET_PORT_END )) \
    || _fleet_fail fleet_invalid_config "Fleet port start must not exceed port end."
  if [[ -n "$FLEET_DOMAIN" ]] && ! _fleet_valid_domain "$FLEET_DOMAIN"; then
    _fleet_fail fleet_invalid_config "Invalid Fleet domain '${FLEET_DOMAIN}' (hostname only; no scheme or path)."
  fi
  case "$FLEET_ROUTING_MODE" in subdomain|direct-port) ;; *)
    _fleet_fail fleet_invalid_config "Routing mode must be 'subdomain' or 'direct-port'." ;; esac
  case "$FLEET_SUBDOMAIN_MODE" in port|seat|random) ;; *)
    _fleet_fail fleet_invalid_config "Subdomain mode must be 'port', 'seat', or 'random'." ;; esac
  case "$FLEET_BACKEND" in http|https) ;; *)
    _fleet_fail fleet_invalid_config "Backend must be 'http' or 'https'." ;; esac
  _fleet_valid_int "$FLEET_SESSION_TIMEOUT" \
    || _fleet_fail fleet_invalid_config "Session timeout must be a nonnegative integer."
  _fleet_valid_bool "$FLEET_CLEAN_SLATE" \
    || _fleet_fail fleet_invalid_config "Clean slate must be 'true' or 'false'."
  if [[ "$FLEET_ROUTING_MODE" == "subdomain" && -z "$FLEET_DOMAIN" ]]; then
    _fleet_fail fleet_invalid_config "Subdomain routing requires --domain <hostname>."
  fi
}

_fleet_config_write() {
  _fleet_record_write "$(_fleet_config_path)" \
    "FLEET_SIZE=${FLEET_SIZE}" \
    "FLEET_USER_PREFIX=${FLEET_USER_PREFIX}" \
    "FLEET_USER_WIDTH=${FLEET_USER_WIDTH}" \
    "FLEET_PORT_START=${FLEET_PORT_START}" \
    "FLEET_PORT_END=${FLEET_PORT_END}" \
    "FLEET_DOMAIN=${FLEET_DOMAIN}" \
    "FLEET_ROUTING_MODE=${FLEET_ROUTING_MODE}" \
    "FLEET_SUBDOMAIN_MODE=${FLEET_SUBDOMAIN_MODE}" \
    "FLEET_BACKEND=${FLEET_BACKEND}" \
    "FLEET_SESSION_TIMEOUT=${FLEET_SESSION_TIMEOUT}" \
    "FLEET_CLEAN_SLATE=${FLEET_CLEAN_SLATE}"
}
# ── Port helpers ────────────────────────────────────────────────────
# One BrowserBox allocation consumes the full set:
#   main-2 (audio), main-1 (docs), main, main+1 (devtools),
#   main+2 (reserved), main-3000 (CDP).

_fleet_port_set() {
  local p="$1"
  printf '%s %s %s %s %s %s' "$((p-2))" "$((p-1))" "$p" "$((p+1))" "$((p+2))" "$((p-3000))"
}

# Two main ports conflict if any member of their port sets overlaps.
_fleet_port_sets_conflict() {
  local a="$1" b="$2" x y
  for x in $(_fleet_port_set "$a"); do
    for y in $(_fleet_port_set "$b"); do
      [[ "$x" == "$y" ]] && return 0
    done
  done
  return 1
}

# True if something is listening on the port (loopback or any-addr).
_fleet_port_listening() {
  local p="$1"
  if (exec 3<>"/dev/tcp/127.0.0.1/$p") 2>/dev/null; then
    return 0
  fi
  if command -v ss >/dev/null 2>&1; then
    ss -H -ltn 2>/dev/null | awk '{print $4}' | grep -Eq "[:.]${p}\$" && return 0
  fi
  return 1
}

# True if every port in the set of <main> is free of listeners.
_fleet_port_set_free() {
  local main="$1" p
  for p in $(_fleet_port_set "$main"); do
    _fleet_port_listening "$p" && return 1
  done
  return 0
}

# ── Seat records ────────────────────────────────────────────────────

_fleet_seat_name() {
  local idx="$1"
  printf '%s%0*d' "$FLEET_USER_PREFIX" "$FLEET_USER_WIDTH" "$idx"
}

_fleet_seat_record_path() {
  local seat="$1"
  _fleet_valid_username "$seat" || _fleet_fail fleet_state_inconsistent "Invalid seat name."
  printf '%s' "${FLEET_DIR}/seats/${seat}.record"
}

# Print all seat names that have records, sorted.
_fleet_seat_list() {
  local f base
  for f in "${FLEET_DIR}/seats/"*.record; do
    [[ -e "$f" ]] || continue
    base="$(basename "$f" .record)"
    _fleet_valid_username "$base" || continue
    printf '%s\n' "$base"
  done | sort
}

# _fleet_assert_managed_user <user> — destructive/delegated operations
# may target only a user that exactly matches a configured seat record.
_fleet_assert_managed_user() {
  local user="$1" rec seat_user
  _fleet_valid_username "$user" || _fleet_fail fleet_state_inconsistent "Invalid target username."
  case "$user" in
    "${FLEET_USER_PREFIX}"*) ;;
    *) _fleet_fail fleet_state_inconsistent "User '${user}' is outside the configured Fleet seat prefix." ;;
  esac
  local suffix="${user#"$FLEET_USER_PREFIX"}"
  [[ "$suffix" =~ ^[0-9]+$ ]] && (( ${#suffix} == FLEET_USER_WIDTH )) \
    || _fleet_fail fleet_state_inconsistent "User '${user}' does not match the Fleet seat naming scheme."
  rec="$(_fleet_seat_record_path "$user")"
  [[ -f "$rec" ]] || _fleet_fail fleet_state_inconsistent "No seat record for user '${user}'."
  seat_user="$(_fleet_record_get "$rec" LINUX_USER)" \
    || _fleet_fail fleet_state_inconsistent "Seat record for '${user}' is corrupt."
  [[ "$seat_user" == "$user" ]] \
    || _fleet_fail fleet_state_inconsistent "Seat record user mismatch for '${user}'."
  id "$user" >/dev/null 2>&1 \
    || _fleet_fail fleet_state_inconsistent "Seat user '${user}' does not exist on this system."
  # The system-reported home (getent, not the record) must be an
  # absolute per-seat directory named after the seat user — cleanup can
  # never be redirected at another account's data or a system path.
  local home
  home="$(getent passwd "$user" | cut -d: -f6)"
  if [[ "$home" != /* || "$home" == "/" || "$home" == "/root" || "$(basename "$home")" != "$user" ]]; then
    _fleet_fail fleet_state_inconsistent "Seat user '${user}' has unexpected home '${home}'."
  fi
}

# ── Routing labels / hostnames ──────────────────────────────────────

_fleet_random_label() {
  local l=""
  while [[ ! "$l" =~ ^[a-z][a-z0-9]{9}$ ]]; do
    l="$(openssl rand -base64 48 | tr -dc 'a-z0-9' | cut -c1-10)"
  done
  printf '%s' "$l"
}

# Compute the five routing labels for a seat (order: m2 m1 main p1 p2).
# random mode generates fresh labels — only called at seat creation;
# labels are then stable in the seat record across allocations.
_fleet_seat_labels() {
  local seat="$1" main_port="$2"
  case "$FLEET_SUBDOMAIN_MODE" in
    port)
      printf '%s %s %s %s %s' "p$((main_port-2))" "p$((main_port-1))" "p${main_port}" "p$((main_port+1))" "p$((main_port+2))"
      ;;
    seat)
      printf '%s %s %s %s %s' "${seat}-a" "${seat}-b" "${seat}" "${seat}-c" "${seat}-d"
      ;;
    random)
      printf '%s %s %s %s %s' "$(_fleet_random_label)" "$(_fleet_random_label)" "$(_fleet_random_label)" "$(_fleet_random_label)" "$(_fleet_random_label)"
      ;;
  esac
}

# ── Certificate helpers ─────────────────────────────────────────────

_fleet_cert_dns_names() {
  local cert="$1" san
  san="$(sudo -n openssl x509 -in "$cert" -noout -ext subjectAltName 2>/dev/null)" || san=""
  if ! printf '%s' "$san" | grep -q 'DNS:'; then
    san="$(sudo -n openssl x509 -in "$cert" -noout -text 2>/dev/null | awk '/Subject Alternative Name/ { getline; print; exit }')"
  fi
  printf '%s\n' "$san" | tr ',' '\n' | sed -n 's/^[[:space:]]*DNS:[[:space:]]*//p' | tr '[:upper:]' '[:lower:]'
}

_fleet_dns_name_covers() {
  local dns_name="$1" host="$2" suffix left
  dns_name="$(printf '%s' "$dns_name" | tr '[:upper:]' '[:lower:]')"
  host="$(printf '%s' "$host" | tr '[:upper:]' '[:lower:]')"
  [[ -n "$dns_name" && -n "$host" ]] || return 1
  if [[ "$dns_name" != *'*'* ]]; then
    [[ "$host" == "$dns_name" ]]; return $?
  fi
  [[ "$dns_name" == "*."* ]] || return 1
  suffix="${dns_name#*.}"
  [[ -n "$suffix" && "$suffix" != *'*'* ]] || return 1
  [[ "$host" == *".${suffix}" ]] || return 1
  left="${host%."$suffix"}"
  [[ -n "$left" && "$left" != *.* ]]
}

_fleet_cert_covers() {
  local cert="$1" host="$2" name
  while IFS= read -r name; do
    [[ -n "$name" ]] || continue
    _fleet_dns_name_covers "$name" "$host" && return 0
  done < <(_fleet_cert_dns_names "$cert")
  return 1
}

# Validate an operator-supplied cert/key pair for the Fleet domain.
# Emits failure via _fleet_fail on hard errors.
_fleet_cert_validate() {
  local cert="$1" key="$2" domain="$3"
  sudo -n test -r "$cert" || _fleet_fail fleet_certificate_invalid "Certificate file not readable: ${cert}"
  sudo -n test -r "$key" || _fleet_fail fleet_certificate_invalid "Key file not readable: ${key}"
  local mode
  mode="$(sudo -n stat -c '%a' "$key" 2>/dev/null || echo 999)"
  if [[ "$mode" =~ [2-7]$ ]] || [[ "${mode: -2:1}" =~ [2-7] ]]; then
    _fleet_fail fleet_certificate_invalid "Key file ${key} is group/world accessible (mode ${mode}); tighten to 600/640."
  fi
  local cpub kpub
  cpub="$(sudo -n openssl x509 -in "$cert" -noout -pubkey 2>/dev/null | sudo -n openssl sha256 2>/dev/null)"
  kpub="$(sudo -n openssl pkey -in "$key" -pubout 2>/dev/null | sudo -n openssl sha256 2>/dev/null)"
  [[ -n "$cpub" && "$cpub" == "$kpub" ]] \
    || _fleet_fail fleet_certificate_invalid "Certificate and key do not match."
  sudo -n openssl x509 -in "$cert" -noout -checkend 0 >/dev/null 2>&1 \
    || _fleet_fail fleet_certificate_invalid "Certificate is expired."
  if ! sudo -n openssl x509 -in "$cert" -noout -checkend 2592000 >/dev/null 2>&1; then
    _fleet_warn "Certificate expires within 30 days."
  fi
  if [[ "$FLEET_ROUTING_MODE" == "subdomain" ]]; then
    _fleet_cert_covers "$cert" "bbxfleetcheck.${domain}" \
      || _fleet_fail fleet_certificate_invalid "Certificate SAN does not cover *.${domain}."
  else
    _fleet_cert_covers "$cert" "$domain" \
      || _fleet_fail fleet_certificate_invalid "Certificate SAN does not cover ${domain}."
  fi
}

# Generate a local (mkcert if available, else self-signed) wildcard
# cert into ${FLEET_DIR}/nginx/local-certs for local/test domains.
_fleet_local_cert_generate() {
  local domain="$1"
  local dir="${FLEET_DIR}/nginx/local-certs"
  mkdir -p "$dir"; chmod 700 "$dir"
  if [[ -s "${dir}/fullchain.pem" && -s "${dir}/privkey.pem" ]] \
     && _fleet_cert_covers "${dir}/fullchain.pem" "bbxfleetcheck.${domain}" \
     && sudo -n openssl x509 -in "${dir}/fullchain.pem" -noout -checkend 86400 >/dev/null 2>&1; then
    FLEET_CERT_FILE="${dir}/fullchain.pem"
    FLEET_KEY_FILE="${dir}/privkey.pem"
    return 0
  fi
  if command -v mkcert >/dev/null 2>&1; then
    _fleet_info "Generating locally trusted wildcard certificate via mkcert."
    mkcert -install >/dev/null 2>&1 || true
    mkcert -cert-file "${dir}/fullchain.pem" -key-file "${dir}/privkey.pem" \
      "$domain" "*.${domain}" "localhost" "127.0.0.1" >/dev/null 2>&1 \
      || _fleet_fail fleet_certificate_invalid "mkcert failed to generate a local certificate."
  else
    _fleet_info "mkcert not found; generating a self-signed wildcard certificate (curl -k / test use)."
    local cnf="${dir}/openssl.cnf"
    cat > "$cnf" <<EOF
[req]
distinguished_name = dn
x509_extensions = v3_req
prompt = no
[dn]
CN = ${domain}
[v3_req]
subjectAltName = DNS:${domain}, DNS:*.${domain}, DNS:localhost, IP:127.0.0.1
EOF
    openssl req -x509 -newkey rsa:2048 -nodes -days 30 -sha256 \
      -keyout "${dir}/privkey.pem" -out "${dir}/fullchain.pem" \
      -config "$cnf" >/dev/null 2>&1 \
      || _fleet_fail fleet_certificate_invalid "openssl failed to generate a local certificate."
  fi
  chmod 600 "${dir}/fullchain.pem" "${dir}/privkey.pem"
  FLEET_CERT_FILE="${dir}/fullchain.pem"
  FLEET_KEY_FILE="${dir}/privkey.pem"
}

# ── DNS helpers ─────────────────────────────────────────────────────

_fleet_machine_ip() {
  local ip url
  for url in "https://api.ipify.org" "https://ipv4.icanhazip.com" "https://checkip.amazonaws.com"; do
    ip="$(curl -fsS --max-time 3 "$url" 2>/dev/null || true)"
    ip="${ip//$'\r'/}"; ip="${ip//$'\n'/}"
    if [[ "$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then printf '%s' "$ip"; return 0; fi
  done
  if command -v ip >/dev/null 2>&1; then
    ip="$(ip -4 addr show scope global 2>/dev/null | awk '/inet /{print $2}' | cut -d/ -f1 | head -n1)"
    [[ -n "$ip" ]] && { printf '%s' "$ip"; return 0; }
  fi
  return 1
}

# Resolve A records for a host (dig preferred, host fallback, then getent).
_fleet_dns_a() {
  local h="$1"
  if command -v dig >/dev/null 2>&1; then
    dig +time=2 +tries=1 +short A "$h" @1.1.1.1 2>/dev/null | grep -E '^[0-9]+\.' || \
    dig +time=2 +tries=1 +short A "$h" 2>/dev/null | grep -E '^[0-9]+\.' || true
  elif command -v host >/dev/null 2>&1; then
    host "$h" 2>/dev/null | awk '/has address/{print $NF}' || true
  else
    getent hosts "$h" 2>/dev/null | awk '{print $1}' | grep -E '^[0-9]+\.' || true
  fi
}

# Validate wildcard DNS for the Fleet domain using two distinct
# candidate subdomains. Sets FLEET_DNS_VALID / FLEET_DNS_PROXIED.
# allow_proxied: "true" accepts resolution that does not match this
# machine's address (load balancer / proxy deployments).
_fleet_dns_validate() {
  local domain="$1" allow_proxied="$2"
  local machine_ip="" ok_resolve=0 ok_match=0
  local c1 c2 host addrs
  c1="bbxchk$(_fleet_random_label | cut -c1-6)"
  c2="bbxchk$(_fleet_random_label | cut -c1-6)"
  machine_ip="$(_fleet_machine_ip || true)"
  for host in "${c1}.${domain}" "${c2}.${domain}"; do
    addrs="$(_fleet_dns_a "$host")"
    if [[ -z "$addrs" ]]; then
      FLEET_DNS_VALID=false
      FLEET_DNS_PROXIED=false
      return 1
    fi
    ok_resolve=1
    if [[ -n "$machine_ip" ]] && printf '%s\n' "$addrs" | grep -Fxq "$machine_ip"; then
      ok_match=$((ok_match+1))
    fi
  done
  if (( ok_resolve )) && (( ok_match == 2 )); then
    FLEET_DNS_VALID=true
    FLEET_DNS_PROXIED=false
    return 0
  fi
  if (( ok_resolve )) && [[ "$allow_proxied" == "true" ]]; then
    FLEET_DNS_VALID=true
    FLEET_DNS_PROXIED=true
    _fleet_warn "DNS resolves but not (verifiably) to this machine — accepted via --allow-proxied-domain."
    return 0
  fi
  FLEET_DNS_VALID=false
  FLEET_DNS_PROXIED=false
  return 1
}

_fleet_print_dns_instructions() {
  local domain="$1" ip="$2"
  {
    printf '\n'
    printf '%b\n' "${BOLD}Create this DNS record before continuing:${NC}"
    printf '\n'
    printf '  Type: A\n'
    printf '  Name: *.%s\n' "$domain"
    printf '  Value: %s\n' "${ip:-<this machine public IPv4>}"
    printf '\n'
    printf '  Optionally also point the base hostname at this machine:\n'
    printf '  Type: A\n'
    printf '  Name: %s\n' "$domain"
    printf '  Value: %s\n' "${ip:-<this machine public IPv4>}"
    printf '\n'
    printf '  If this machine uses IPv6, add matching AAAA records.\n'
    printf '\n'
  } >&2
}

# ── Nginx generation and application ────────────────────────────────

# Detect nginx include layout, mirroring _setup_nginx.sh conventions.
# Sets FLEET_NGINX_TARGET (installed conf path) and, for
# sites-available layouts, FLEET_NGINX_LINK.
_fleet_nginx_paths() {
  FLEET_NGINX_TARGET=""
  FLEET_NGINX_LINK=""
  # Operator override for non-standard nginx include layouts.
  if [[ -n "${BBX_FLEET_NGINX_DIR:-}" ]]; then
    [[ -d "$BBX_FLEET_NGINX_DIR" ]] || return 1
    FLEET_NGINX_TARGET="${BBX_FLEET_NGINX_DIR}/${FLEET_NGINX_SITE_NAME}"
    return 0
  fi
  if [[ -d /etc/nginx/sites-available && -d /etc/nginx/sites-enabled ]]; then
    FLEET_NGINX_TARGET="/etc/nginx/sites-available/${FLEET_NGINX_SITE_NAME}"
    FLEET_NGINX_LINK="/etc/nginx/sites-enabled/${FLEET_NGINX_SITE_NAME}"
  elif [[ -d /etc/nginx/conf.d ]]; then
    FLEET_NGINX_TARGET="/etc/nginx/conf.d/${FLEET_NGINX_SITE_NAME}"
  else
    return 1
  fi
  return 0
}

# Generate the complete Fleet nginx config (all eligible seats) to
# stdout. Requires FLEET_CERT_FILE/FLEET_KEY_FILE to be set.
# Server blocks preserve the known-good ng-run proxy behavior
# (WebSocket upgrade, forwarding headers, backend TLS).
_fleet_nginx_generate() {
  local cert="$1" key="$2"
  local seat rec eligible main_port hosts ports i
  local proxy_ssl=""
  if [[ "$FLEET_BACKEND" == "https" ]]; then
    proxy_ssl=$'        proxy_ssl_server_name on;\n        proxy_ssl_verify off;'
  fi
  printf '# Auto-generated by bbx fleet — do not edit by hand.\n'
  printf '# Fleet domain: %s\n' "$FLEET_DOMAIN"
  printf '# Backend scheme: %s\n' "$FLEET_BACKEND"
  printf '# Generated: %s\n' "$(_fleet_now)"
  while IFS= read -r seat; do
    rec="$(_fleet_seat_record_path "$seat")"
    eligible="$(_fleet_record_get "$rec" ELIGIBLE || echo false)"
    [[ "$eligible" == "true" ]] || continue
    main_port="$(_fleet_record_get "$rec" MAIN_PORT)" || continue
    hosts=(
      "$(_fleet_record_get "$rec" HOST_M2 || true)"
      "$(_fleet_record_get "$rec" HOST_M1 || true)"
      "$(_fleet_record_get "$rec" HOST_MAIN || true)"
      "$(_fleet_record_get "$rec" HOST_P1 || true)"
      "$(_fleet_record_get "$rec" HOST_P2 || true)"
    )
    ports=( "$((main_port-2))" "$((main_port-1))" "$main_port" "$((main_port+1))" "$((main_port+2))" )
    printf '\n# Seat: %s (main port %s)\n' "$seat" "$main_port"
    for i in 0 1 2 3 4; do
      [[ -n "${hosts[$i]}" ]] || continue
      cat <<NGX

server {
    listen 443 ssl;
    server_name ${hosts[$i]};
    ssl_certificate ${cert};
    ssl_certificate_key ${key};
    location / {
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
${proxy_ssl}
        proxy_pass ${FLEET_BACKEND}://127.0.0.1:${ports[$i]};
    }
}
NGX
    done
  done < <(_fleet_seat_list)
}

_fleet_nginx_reload() {
  if command -v systemctl >/dev/null 2>&1 && sudo -n systemctl is-active nginx >/dev/null 2>&1; then
    sudo -n systemctl reload nginx >/dev/null 2>&1 && return 0
  fi
  if command -v systemctl >/dev/null 2>&1; then
    sudo -n systemctl start nginx >/dev/null 2>&1 && return 0
  fi
  if sudo -n pgrep -x nginx >/dev/null 2>&1; then
    sudo -n nginx -s reload >/dev/null 2>&1 && return 0
  fi
  sudo -n nginx >/dev/null 2>&1 && return 0
  return 1
}

# Atomically install the generated Fleet routing config: validate,
# install, reload; roll back to the previous valid config on failure.
_fleet_nginx_apply() {
  local cert="$1" key="$2"
  local gen="${FLEET_DIR}/nginx/fleet.conf.candidate"
  local active_copy="${FLEET_DIR}/nginx/fleet.conf"
  command -v nginx >/dev/null 2>&1 \
    || _fleet_fail fleet_routing_failed "nginx is not installed. Install nginx and re-run 'bbx fleet routing apply'."
  _fleet_nginx_paths \
    || _fleet_fail fleet_routing_failed "Could not locate an nginx include directory (sites-available or conf.d)."
  _fleet_nginx_generate "$cert" "$key" > "$gen"
  chmod 600 "$gen"

  local had_prev=0
  if sudo -n test -f "$FLEET_NGINX_TARGET" 2>/dev/null; then
    had_prev=1
    sudo -n cp -f "$FLEET_NGINX_TARGET" "${FLEET_DIR}/nginx/fleet.conf.prev"
  fi

  sudo -n cp -f "$gen" "$FLEET_NGINX_TARGET"
  sudo -n chmod 644 "$FLEET_NGINX_TARGET"
  if [[ -n "$FLEET_NGINX_LINK" ]] && ! sudo -n test -e "$FLEET_NGINX_LINK" 2>/dev/null; then
    sudo -n ln -s "$FLEET_NGINX_TARGET" "$FLEET_NGINX_LINK"
  fi

  if ! sudo -n nginx -t >/dev/null 2>&1; then
    _fleet_warn "nginx config validation failed; rolling back."
    if (( had_prev )); then
      sudo -n cp -f "${FLEET_DIR}/nginx/fleet.conf.prev" "$FLEET_NGINX_TARGET"
    else
      sudo -n rm -f "$FLEET_NGINX_TARGET"
      [[ -n "$FLEET_NGINX_LINK" ]] && sudo -n rm -f "$FLEET_NGINX_LINK"
    fi
    sudo -n nginx -t >/dev/null 2>&1 || true
    _fleet_nginx_reload || true
    _fleet_fail fleet_routing_failed "Generated nginx config failed validation; previous config restored."
  fi

  if ! _fleet_nginx_reload; then
    _fleet_warn "nginx reload failed; rolling back."
    if (( had_prev )); then
      sudo -n cp -f "${FLEET_DIR}/nginx/fleet.conf.prev" "$FLEET_NGINX_TARGET"
    else
      sudo -n rm -f "$FLEET_NGINX_TARGET"
      [[ -n "$FLEET_NGINX_LINK" ]] && sudo -n rm -f "$FLEET_NGINX_LINK"
    fi
    _fleet_nginx_reload || true
    _fleet_fail fleet_routing_failed "nginx reload failed; previous config restored."
  fi

  cp -f "$gen" "$active_copy"
  chmod 600 "$active_copy"
  rm -f "$gen"
  return 0
}
# ── Seat provisioning ───────────────────────────────────────────────

# Create one Fleet seat user (idempotent). Mirrors the create_user()
# Linux conventions: bash shell (delegated execution requires bash),
# locked password, BrowserBox groups, lingering — and never sudo.
_fleet_create_seat_user() {
  local user="$1"
  if id "$user" >/dev/null 2>&1; then
    return 1  # already existed
  fi
  if [ -f /etc/redhat-release ]; then
    sudo -n useradd -m -s /bin/bash -c "BrowserBox fleet seat" "$user" \
      || _fleet_fail fleet_setup_failed "Failed to create seat user ${user}."
  else
    sudo -n adduser --disabled-password --gecos "BrowserBox fleet seat" "$user" >/dev/null 2>&1 \
      || sudo -n useradd -m -s /bin/bash -c "BrowserBox fleet seat" "$user" \
      || _fleet_fail fleet_setup_failed "Failed to create seat user ${user}."
  fi
  sudo -n usermod -L "$user" 2>/dev/null || true
  # Seat homes hold login capabilities (login.link, test.env) — they
  # must not be readable by other local users or sibling seats.
  local _seat_home
  _seat_home="$(getent passwd "$user" 2>/dev/null | cut -d: -f6)"
  if [[ "$_seat_home" == /*/"$user" ]]; then
    sudo -n chmod 700 "$_seat_home" 2>/dev/null || true
  fi
  local group
  for group in browsers renice; do
    if ! getent group "$group" >/dev/null 2>&1; then
      sudo -n groupadd "$group" 2>/dev/null || true
    fi
    sudo -n usermod -aG "$group" "$user" 2>/dev/null || true
  done
  if command -v loginctl >/dev/null 2>&1; then
    sudo -n loginctl enable-linger "$user" 2>/dev/null || true
  fi
  return 0
}

# Assign a stable main port for a new seat: deterministic upward scan
# from FLEET_PORT_START, skipping any candidate whose complete port
# set overlaps a set already assigned to another seat.
_fleet_assign_seat_port() {
  local -a taken=()
  local seat rec p candidate ok other
  while IFS= read -r seat; do
    rec="$(_fleet_seat_record_path "$seat")"
    p="$(_fleet_record_get "$rec" MAIN_PORT 2>/dev/null || true)"
    [[ -n "$p" ]] && taken+=("$p")
  done < <(_fleet_seat_list)
  candidate="$FLEET_PORT_START"
  while (( candidate <= FLEET_PORT_END )); do
    ok=1
    (( candidate - 3000 >= 1024 && candidate + 2 <= 65535 )) || ok=0
    if (( ok )); then
      for other in "${taken[@]:-}"; do
        [[ -n "$other" ]] || continue
        if _fleet_port_sets_conflict "$candidate" "$other"; then ok=0; break; fi
      done
    fi
    if (( ok )); then
      printf '%s' "$candidate"
      return 0
    fi
    candidate=$((candidate + 1))
  done
  return 1
}

# Create/refresh the record for a seat, assigning stable port and
# routing hostnames on first creation only.
_fleet_ensure_seat_record() {
  local seat="$1" idx="$2" eligible="$3"
  local rec main_port host_m2 host_m1 host_main host_p1 host_p2 now
  local l0 l1 l2 l3 l4
  rec="$(_fleet_seat_record_path "$seat")"
  now="$(_fleet_now)"
  if [[ -f "$rec" ]]; then
    _fleet_record_update "$rec" "ELIGIBLE=${eligible}" "UPDATED_AT=${now}" "SEAT_INDEX=${idx}"
    return 0
  fi
  main_port="$(_fleet_assign_seat_port)" \
    || _fleet_fail fleet_port_exhausted "No non-overlapping port set available in ${FLEET_PORT_START}-${FLEET_PORT_END} for seat ${seat}."
  host_m2=""; host_m1=""; host_main=""; host_p1=""; host_p2=""
  if [[ "$FLEET_ROUTING_MODE" == "subdomain" ]]; then
    read -r l0 l1 l2 l3 l4 <<< "$(_fleet_seat_labels "$seat" "$main_port")"
    host_m2="${l0}.${FLEET_DOMAIN}"
    host_m1="${l1}.${FLEET_DOMAIN}"
    host_main="${l2}.${FLEET_DOMAIN}"
    host_p1="${l3}.${FLEET_DOMAIN}"
    host_p2="${l4}.${FLEET_DOMAIN}"
  else
    host_main="${FLEET_DOMAIN:-$(get_system_hostname)}"
  fi
  local -a fields=(
    "SEAT_INDEX=${idx}"
    "SEAT_NAME=${seat}"
    "LINUX_USER=${seat}"
    "MAIN_PORT=${main_port}"
    "PUBLIC_HOSTNAME=${host_main}"
    "ELIGIBLE=${eligible}"
    "CREATED_AT=${now}"
    "UPDATED_AT=${now}"
  )
  if [[ "$FLEET_ROUTING_MODE" == "subdomain" ]]; then
    fields+=(
      "HOST_M2=${host_m2}" "HOST_M1=${host_m1}" "HOST_MAIN=${host_main}"
      "HOST_P1=${host_p1}" "HOST_P2=${host_p2}"
      "ROUTING_LABEL=${host_main%%.*}"
    )
  fi
  _fleet_record_write "$rec" "${fields[@]}"
}

# ── Allocation records ──────────────────────────────────────────────

_fleet_alloc_path() {
  local id="$1"
  _fleet_valid_alloc_id "$id" || _fleet_fail fleet_allocation_not_found "Malformed allocation ID."
  printf '%s' "${FLEET_DIR}/allocations/${id}.record"
}

_fleet_alloc_list() {
  local f base
  for f in "${FLEET_DIR}/allocations/"bbxf-*.record; do
    [[ -e "$f" ]] || continue
    base="$(basename "$f" .record)"
    _fleet_valid_alloc_id "$base" || continue
    printf '%s\n' "$base"
  done | sort
}

# Print the allocation ID currently holding <seat>, if any.
_fleet_alloc_for_seat() {
  local seat="$1" id rec s
  while IFS= read -r id; do
    rec="$(_fleet_alloc_path "$id")"
    s="$(_fleet_record_get "$rec" SEAT_NAME 2>/dev/null || true)"
    if [[ "$s" == "$seat" ]]; then
      printf '%s' "$id"
      return 0
    fi
  done < <(_fleet_alloc_list)
  return 1
}

_fleet_alloc_id_gen() {
  printf 'bbxf-%s' "$(openssl rand -hex 16)"
}

# ── Delegated-user glue ─────────────────────────────────────────────
# Fleet reuses the --for machinery (_tu_run etc.) by setting
# BBX_FOR_USER after its own validation. Unlike the interactive --for
# CLI path, Fleet permits a root operator (spec §4).

_fleet_enter_target() {
  local user="$1"
  _fleet_assert_managed_user "$user"
  BBX_FOR_USER="$user"
  BBX_OPERATOR_USER="$(id -un)"
}

_fleet_exit_target() {
  BBX_FOR_USER=""
  BBX_OPERATOR_USER=""
}

# Apply fleet defaults.env (operator-authored) to the delegated
# environment via the BBX_FLEET_EXTRA_ENV hook in _tu_run.
_fleet_apply_defaults_env() {
  BBX_FLEET_EXTRA_ENV=()
  local f="${FLEET_DIR}/defaults.env" line key val
  [[ -f "$f" && ! -L "$f" ]] || return 0
  while IFS= read -r line; do
    [[ "$line" == *"="* ]] || continue
    key="${line%%=*}"
    val="${line#*=}"
    _fleet_valid_envkey "$key" || continue
    case "$key" in
      LICENSE_KEY|GH_TOKEN|GITHUB_TOKEN|PATH|HOME|SUDO|BBX_FOR_USER) continue ;;
    esac
    BBX_FLEET_EXTRA_ENV+=("${key}=${val}")
  done < "$f"
}

# Write the seat's hosts.env (zeta-mode service-host map) as the seat
# user. Content is fully operator-generated and validated.
_fleet_write_seat_hostsenv() {
  local rec="$1" main_port="$2"
  local h0 h1 h2 h3 h4
  h0="$(_fleet_record_get "$rec" HOST_M2)" || return 1
  h1="$(_fleet_record_get "$rec" HOST_M1)" || return 1
  h2="$(_fleet_record_get "$rec" HOST_MAIN)" || return 1
  h3="$(_fleet_record_get "$rec" HOST_P1)" || return 1
  h4="$(_fleet_record_get "$rec" HOST_P2)" || return 1
  local content
  printf -v content 'export DOMAIN=%q\nexport ADDR_%d=%q\nexport ADDR_%d=%q\nexport ADDR_%d=%q\nexport ADDR_%d=%q\nexport ADDR_%d=%q\n' \
    "$FLEET_DOMAIN" \
    "$((main_port-2))" "$h0" \
    "$((main_port-1))" "$h1" \
    "$main_port" "$h2" \
    "$((main_port+1))" "$h3" \
    "$((main_port+2))" "$h4"
  printf '%s' "$content" | sudo -n -u "$BBX_FOR_USER" tee "$(_tu_config_dir)/hosts.env" >/dev/null
}

# Install the Fleet TLS material into the seat's ~/sslcerts so the
# per-seat BrowserBox backend can terminate its local TLS.
_fleet_install_seat_certs() {
  local cert="$1" key="$2"
  local tu_home ssl_dir
  tu_home="$(_tu_home)"
  ssl_dir="${tu_home}/sslcerts"
  sudo -n mkdir -p "$ssl_dir"
  sudo -n cp -f "$cert" "${ssl_dir}/fullchain.pem"
  sudo -n cp -f "$key" "${ssl_dir}/privkey.pem"
  sudo -n chown -R "${BBX_FOR_USER}:" "$ssl_dir"
  sudo -n chmod 700 "$ssl_dir"
  sudo -n chmod 600 "${ssl_dir}/fullchain.pem" "${ssl_dir}/privkey.pem"
}

# Ensure the canonical clean-slate mechanism (BBX_CLEAN_SLATE) is
# active for the seat: persist into the seat's test.env so every
# service start wipes the browser profile on initial launch.
_fleet_ensure_clean_slate() {
  [[ "$FLEET_CLEAN_SLATE" == "true" ]] || return 0
  local te="$(_tu_config_dir)/test.env"
  if ! sudo -n grep -q '^export BBX_CLEAN_SLATE="true"$' "$te" 2>/dev/null; then
    printf '\nexport BBX_CLEAN_SLATE="true"\n' | sudo -n -u "$BBX_FOR_USER" tee -a "$te" >/dev/null
  fi
}

# Fleet seats are managed runtimes, not interactive operators.  The operator
# accepts BrowserBox's terms at `fleet init`; carry that validated agreement
# identity into each seat so an idle self-shutdown can invoke the canonical
# same-user `bbx stop` path without an impossible interactive prompt.
_fleet_ensure_managed_agreement() {
  local operator_agreed="${BB_CONFIG_DIR}/.agreed"
  local seat_agreed="$(_tu_config_dir)/.agreed"
  local agreed_email=""
  [[ -f "$operator_agreed" && ! -L "$operator_agreed" ]] || return 1
  agreed_email="$(tail -n1 "$operator_agreed" 2>/dev/null | tr -d '\r\n')"
  [[ "$agreed_email" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]] || return 1
  printf '%s\n' "$agreed_email" \
    | sudo -n -u "$BBX_FOR_USER" tee "$seat_agreed" >/dev/null \
    || return 1
  sudo -n chmod 600 "$seat_agreed" || return 1
}

# Stop the seat runtime and wait for BrowserBox/Chrome processes to
# exit; bounded. Only ever called after _fleet_assert_managed_user.
# True if the user has LIVE (non-zombie) BrowserBox-pattern processes.
# Unreaped zombies linger indefinitely in init-less containers (no PID 1
# reaper) and pgrep -f falls back to comm matching on their empty
# cmdlines — but a zombie holds no runtime, no ports, no browser state.
_fleet_user_runtime_alive() {
  local user="$1" process_rows ps_rc=0
  process_rows="$(sudo -n ps -u "$user" -o stat=,args= 2>/dev/null)" || ps_rc=$?
  # procps may return 1 when the selector matches nothing. Higher statuses
  # indicate that runtime health could not be observed safely.
  (( ps_rc <= 1 )) || return 2
  printf '%s\n' "$process_rows" | awk '
    $1 !~ /^Z/ && /browserbox|bbpro|chrome/ { found=1 }
    END { exit found ? 0 : 1 }'
}

_fleet_stop_seat_runtime() {
  local user="$BBX_FOR_USER" waited=0
  sudo -n rm -f "$(_tu_config_dir)/login.link" 2>/dev/null || true
  if sudo -n pgrep -u "$user" >/dev/null 2>&1; then
    ( _tu_run stop_bbpro ) >/dev/null 2>&1 || true
  fi
  while (( waited < 30 )); do
    if ! _fleet_user_runtime_alive "$user"; then
      break
    fi
    sleep 1
    waited=$((waited + 1))
  done
  if _fleet_user_runtime_alive "$user"; then
    sudo -n pkill -u "$user" -f 'browserbox|bbpro|chrome' 2>/dev/null || true
    sleep 2
    sudo -n pkill -9 -u "$user" -f 'browserbox|bbpro|chrome' 2>/dev/null || true
  fi
}

# Verify/apply clean-slate cleanup at release: remove the browser
# profile (the same user-data dir BBX_CLEAN_SLATE clears at startup)
# and caches, executing strictly as the seat user with fixed
# home-relative paths.
_fleet_wipe_seat_profile() {
  _tu_run bash -c 'rm -rf "${HOME}/.config/dosaygo/bbpro/browser-cache" "${HOME}/.cache/dosaygo/bbpro" "${HOME}/.config/dosaygo/bbpro/targetCount" 2>/dev/null; true' \
    >/dev/null 2>&1 || true
  if sudo -n test -d "$(_tu_config_dir)/browser-cache" 2>/dev/null; then
    return 1
  fi
  return 0
}

# Delegated run for Fleet: certify + launch as the seat user via the
# existing _tu_run/bbcertify/bbpro path, WITHOUT eval-ing seat-owned
# config in the operator context and without exiting the caller.
# Returns nonzero on failure.
_fleet_delegated_run() {
  local detail_var="${1:-}"
  local cert_log cert_status bbpro_log rc=0
  cert_log="$(mktemp "${TMPDIR:-/tmp}/bbx-fleet-cert-log-XXXXXX")"
  cert_status="$(mktemp "${TMPDIR:-/tmp}/bbx-fleet-cert-status-XXXXXX")"
  bbpro_log="$(mktemp "${TMPDIR:-/tmp}/bbx-fleet-bbpro-log-XXXXXX")"
  : > "$cert_status"

  _fleet_info "[${BBX_FOR_USER}] Certifying license..."
  # The top-level shell owns save_config. Do not let this short-lived
  # certification worker inherit and run that EXIT trap concurrently.
  (
    trap - EXIT
    _tu_run bbcertify
    rc=$?
    printf '%s\n' "$rc" > "$cert_status"
    exit 0
  ) > "$cert_log" 2>&1 &
  local cert_pid=$!

  _fleet_info "[${BBX_FOR_USER}] Starting BrowserBox services..."
  if ! ( _tu_run bbpro ) > "$bbpro_log" 2>&1; then
    [[ -n "$detail_var" ]] && printf -v "$detail_var" '%s' "BrowserBox service launch exited nonzero."
    _fleet_warn "bbpro failed for ${BBX_FOR_USER}. Last output:"
    tail -20 "$bbpro_log" >&2
    kill "$cert_pid" 2>/dev/null || true
    rm -f "$cert_log" "$cert_status" "$bbpro_log"
    return 1
  fi
  rm -f "$bbpro_log"

  local waited=0
  while kill -0 "$cert_pid" 2>/dev/null; do
    if (( waited >= 120 )); then
      [[ -n "$detail_var" ]] && printf -v "$detail_var" '%s' "License certification timed out after 120 seconds."
      _fleet_warn "License certification timed out for ${BBX_FOR_USER}."
      kill "$cert_pid" 2>/dev/null || true
      rm -f "$cert_log" "$cert_status"
      return 2
    fi
    sleep 1
    waited=$((waited + 1))
  done
  wait "$cert_pid" 2>/dev/null || true
  local cert_rc
  cert_rc="$(head -1 "$cert_status" 2>/dev/null || true)"
  rm -f "$cert_status"
  [[ "$cert_rc" =~ ^[0-9]{1,3}$ ]] || cert_rc=1
  if (( cert_rc != 0 )); then
    [[ -n "$detail_var" ]] && printf -v "$detail_var" '%s' "License certification exited ${cert_rc}."
    _fleet_warn "License certification failed for ${BBX_FOR_USER} (exit ${cert_rc}):"
    tail -20 "$cert_log" >&2
    rm -f "$cert_log"
    return 2
  fi
  rm -f "$cert_log"
  _fleet_info "[${BBX_FOR_USER}] License certified."
  return 0
}

# Probe the externally valid login URL. The hostname is pinned to
# loopback so the check exercises the local nginx fan-out (subdomain)
# or the backend itself (direct-port) even before global DNS
# converges and regardless of hairpin-NAT behavior.
_fleet_probe_public_url() {
  local url="$1" host="$2" mode="$3" port="${4:-443}"
  local -a curl_args=(-k -s -o /dev/null -w '%{http_code}' --connect-timeout 3 --max-time 6)
  if [[ "$mode" == "subdomain" ]]; then
    curl_args+=(--resolve "${host}:443:127.0.0.1")
  else
    curl_args+=(--resolve "${host}:${port}:127.0.0.1")
  fi
  local attempt code
  for attempt in 1 2 3 4 5 6 7 8 9 10; do
    code="$(curl "${curl_args[@]}" "$url" 2>/dev/null || true)"
    if [[ "$code" =~ ^[23][0-9][0-9]$ ]]; then
      return 0
    fi
    sleep 2
  done
  return 1
}
# ── fleet init ──────────────────────────────────────────────────────

fleet_init() {
  local opt_size="" opt_prefix="" opt_width="" opt_port_start="" opt_port_end=""
  local opt_domain="" opt_routing="" opt_submode="" opt_backend=""
  local opt_cert="" opt_key="" allow_proxied="false"

  while (( $# )); do
    case "$1" in
      --size) opt_size="${2:-}"; shift 2 ;;
      --user-prefix) opt_prefix="${2:-}"; shift 2 ;;
      --user-width) opt_width="${2:-}"; shift 2 ;;
      --port-start) opt_port_start="${2:-}"; shift 2 ;;
      --port-end) opt_port_end="${2:-}"; shift 2 ;;
      --domain) opt_domain="${2:-}"; shift 2 ;;
      --routing) opt_routing="${2:-}"; shift 2 ;;
      --subdomain-mode) opt_submode="${2:-}"; shift 2 ;;
      --backend) opt_backend="${2:-}"; shift 2 ;;
      --cert-file) opt_cert="${2:-}"; shift 2 ;;
      --key-file) opt_key="${2:-}"; shift 2 ;;
      --allow-proxied-domain) allow_proxied="true"; shift ;;
      --json) shift ;;
      *) _fleet_fail fleet_invalid_config "Unknown fleet init option: $1" ;;
    esac
  done

  check_agreement

  _fleet_set_dir
  _fleet_dirs_init
  _fleet_config_load

  local prev_domain="$FLEET_DOMAIN" prev_routing="$FLEET_ROUTING_MODE"
  local prev_submode="$FLEET_SUBDOMAIN_MODE" prev_backend="$FLEET_BACKEND"
  local prev_prefix="$FLEET_USER_PREFIX" prev_width="$FLEET_USER_WIDTH"
  local prev_pstart="$FLEET_PORT_START" prev_pend="$FLEET_PORT_END"

  [[ -n "$opt_size" ]] && FLEET_SIZE="$opt_size"
  [[ -n "$opt_prefix" ]] && FLEET_USER_PREFIX="$opt_prefix"
  [[ -n "$opt_width" ]] && FLEET_USER_WIDTH="$opt_width"
  [[ -n "$opt_port_start" ]] && FLEET_PORT_START="$opt_port_start"
  [[ -n "$opt_port_end" ]] && FLEET_PORT_END="$opt_port_end"
  [[ -n "$opt_domain" ]] && FLEET_DOMAIN="$opt_domain"
  [[ -n "$opt_routing" ]] && FLEET_ROUTING_MODE="$opt_routing"
  [[ -n "$opt_submode" ]] && FLEET_SUBDOMAIN_MODE="$opt_submode"
  [[ -n "$opt_backend" ]] && FLEET_BACKEND="$opt_backend"
  _fleet_config_validate

  # ── Locked: topology guard, config write, seat records ──
  # (User creation itself is idempotent syscall work; the lock protects
  # record and configuration state.)
  _fleet_lock 60

  # Routing topology changes are deployment-wide; refuse them while
  # allocations are active (they would invalidate issued login URLs).
  local active_count
  active_count="$(_fleet_alloc_list | wc -l | tr -d ' ')"
  if (( active_count > 0 )); then
    if [[ "$FLEET_DOMAIN" != "$prev_domain" || "$FLEET_ROUTING_MODE" != "$prev_routing" \
       || "$FLEET_SUBDOMAIN_MODE" != "$prev_submode" || "$FLEET_BACKEND" != "$prev_backend" \
       || "$FLEET_USER_PREFIX" != "$prev_prefix" || "$FLEET_USER_WIDTH" != "$prev_width" \
       || "$FLEET_PORT_START" != "$prev_pstart" || "$FLEET_PORT_END" != "$prev_pend" ]]; then
      _fleet_fail fleet_active_allocations "Cannot change Fleet topology while ${active_count} allocation(s) are active. Release them first."
    fi
  fi

  _fleet_config_write

  # ── Seat users and records ──
  local created=0 existing=0 idx seat
  for (( idx=0; idx < FLEET_SIZE; idx++ )); do
    seat="$(_fleet_seat_name "$idx")"
    if _fleet_create_seat_user "$seat"; then
      created=$((created + 1))
      _fleet_info "Created seat user ${seat}."
    else
      existing=$((existing + 1))
    fi
    _fleet_ensure_seat_record "$seat" "$idx" "true"
  done
  # Seats beyond the configured size stay (never deleted) but become
  # ineligible for new allocations.
  local rec sidx
  while IFS= read -r seat; do
    rec="$(_fleet_seat_record_path "$seat")"
    sidx="$(_fleet_record_get "$rec" SEAT_INDEX 2>/dev/null || echo 999999)"
    if (( sidx >= FLEET_SIZE )); then
      _fleet_record_update "$rec" "ELIGIBLE=false" "UPDATED_AT=$(_fleet_now)"
    fi
  done < <(_fleet_seat_list)

  _fleet_unlock

  # ── Certificates ──
  FLEET_CERT_FILE=""
  FLEET_KEY_FILE=""
  local is_local=0
  local eff_domain="${FLEET_DOMAIN:-$(get_system_hostname)}"
  _fleet_is_local_domain "$eff_domain" && is_local=1
  local need_tls=0
  if [[ "$FLEET_ROUTING_MODE" == "subdomain" || "$FLEET_BACKEND" == "https" ]]; then
    need_tls=1
  fi
  if (( need_tls )); then
    if [[ -n "$opt_cert" || -n "$opt_key" ]]; then
      [[ -n "$opt_cert" && -n "$opt_key" ]] \
        || _fleet_fail fleet_certificate_invalid "--cert-file and --key-file must be provided together."
      _fleet_cert_validate "$opt_cert" "$opt_key" "$eff_domain"
      FLEET_CERT_FILE="$opt_cert"
      FLEET_KEY_FILE="$opt_key"
    elif (( is_local )); then
      _fleet_local_cert_generate "$eff_domain"
    else
      # No safe automated wildcard issuance path exists in this repo
      # (certbot DNS-01 here is manual/interactive). Ask the operator
      # to supply a wildcard certificate rather than pretending.
      _fleet_fail fleet_certificate_invalid "A wildcard TLS certificate for *.${eff_domain} is required. Re-run with --cert-file <fullchain.pem> --key-file <privkey.pem> (issue one via your DNS provider / certbot DNS-01), or use a local test domain (e.g. bbx-fleet.test)."
    fi
  fi

  # ── DNS ──
  FLEET_DNS_VALID=false
  FLEET_DNS_PROXIED=false
  local machine_ip=""
  if [[ "$FLEET_ROUTING_MODE" == "subdomain" ]]; then
    if (( is_local )); then
      _fleet_info "Local domain '${eff_domain}': writing /etc/hosts entries for all seat hostnames."
      local h k
      while IFS= read -r seat; do
        rec="$(_fleet_seat_record_path "$seat")"
        [[ "$(_fleet_record_get "$rec" ELIGIBLE 2>/dev/null)" == "true" ]] || continue
        for k in HOST_M2 HOST_M1 HOST_MAIN HOST_P1 HOST_P2; do
          h="$(_fleet_record_get "$rec" "$k" 2>/dev/null || true)"
          [[ -n "$h" ]] && ensure_hosts_entry "$h"
        done
      done < <(_fleet_seat_list)
      FLEET_DNS_VALID=true
    else
      machine_ip="$(_fleet_machine_ip || true)"
      _fleet_print_dns_instructions "$eff_domain" "$machine_ip"
      _fleet_info "Validating wildcard DNS for *.${eff_domain} (two probe subdomains)..."
      if ! _fleet_dns_validate "$eff_domain" "$allow_proxied"; then
        _fleet_fail fleet_dns_invalid "Wildcard DNS for *.${eff_domain} does not resolve to this machine (${machine_ip:-unknown IP}). Create the records above, or use --allow-proxied-domain if traffic is deliberately routed through a proxy/load balancer."
      fi
      if [[ "$FLEET_DNS_PROXIED" == "true" ]]; then
        _fleet_info "DNS resolves successfully (proxied deployment accepted)."
      else
        _fleet_info "DNS is confirmed to resolve directly to this machine."
      fi
    fi
  fi

  # ── Per-seat runtime prerequisites (config dir + backend TLS) ──
  while IFS= read -r seat; do
    rec="$(_fleet_seat_record_path "$seat")"
    [[ "$(_fleet_record_get "$rec" ELIGIBLE 2>/dev/null)" == "true" ]] || continue
    _fleet_enter_target "$seat"
    _tu_ensure_config_dir
    if [[ -n "$FLEET_CERT_FILE" ]]; then
      _fleet_install_seat_certs "$FLEET_CERT_FILE" "$FLEET_KEY_FILE"
    fi
    _fleet_exit_target
  done < <(_fleet_seat_list)

  # ── Nginx (subdomain mode) ──
  local nginx_applied=false
  if [[ "$FLEET_ROUTING_MODE" == "subdomain" ]]; then
    if ! command -v nginx >/dev/null 2>&1; then
      _fleet_info "Installing nginx..."
      if [ -f /etc/debian_version ]; then
        sudo -n apt-get update -y >/dev/null 2>&1; sudo -n apt-get install -y nginx >/dev/null 2>&1 || true
      elif [ -f /etc/redhat-release ]; then
        sudo -n dnf install -y nginx >/dev/null 2>&1 || sudo -n yum install -y nginx >/dev/null 2>&1 || true
      fi
    fi
    _fleet_nginx_apply "$FLEET_CERT_FILE" "$FLEET_KEY_FILE"
    nginx_applied=true
    _fleet_info "Fleet nginx routing applied for all eligible seats."
  fi

  _fleet_record_write "${FLEET_DIR}/routing.env" \
    "CERT_FILE=${FLEET_CERT_FILE}" \
    "KEY_FILE=${FLEET_KEY_FILE}" \
    "DNS_VALID=${FLEET_DNS_VALID}" \
    "DNS_PROXIED=${FLEET_DNS_PROXIED}" \
    "NGINX_APPLIED=${nginx_applied}" \
    "CHECKED_AT=$(_fleet_now)"

  local cert_valid=false
  [[ -n "$FLEET_CERT_FILE" ]] && cert_valid=true

  if (( FLEET_JSON )); then
    _fleet_emit "{\"ok\":true,\"fleet_size\":${FLEET_SIZE},\"created_users\":${created},\"existing_users\":${existing},\"routing\":{\"mode\":\"${FLEET_ROUTING_MODE}\",\"domain\":\"$(_fleet_json_escape "$FLEET_DOMAIN")\",\"subdomain_mode\":\"${FLEET_SUBDOMAIN_MODE}\",\"nginx_applied\":${nginx_applied},\"dns_valid\":${FLEET_DNS_VALID},\"dns_proxied\":${FLEET_DNS_PROXIED},\"certificate_valid\":${cert_valid}},\"clean_slate\":${FLEET_CLEAN_SLATE},\"fleet_dir\":\"$(_fleet_json_escape "$FLEET_DIR")\"}"
  else
    printf '%b\n' "${GREEN}Fleet initialized.${NC}" >&2
    {
      printf '  Seats:          %s (%s created, %s existing)\n' "$FLEET_SIZE" "$created" "$existing"
      printf '  User prefix:    %s (width %s)\n' "$FLEET_USER_PREFIX" "$FLEET_USER_WIDTH"
      printf '  Ports:          %s-%s (5-port set + CDP per seat)\n' "$FLEET_PORT_START" "$FLEET_PORT_END"
      printf '  Routing:        %s' "$FLEET_ROUTING_MODE"
      [[ "$FLEET_ROUTING_MODE" == "subdomain" ]] && printf ' (%s labels, domain %s)' "$FLEET_SUBDOMAIN_MODE" "$FLEET_DOMAIN"
      printf '\n'
      printf '  Backend:        %s\n' "$FLEET_BACKEND"
      printf '  Clean slate:    %s\n' "$FLEET_CLEAN_SLATE"
      printf '  State:          %s\n' "$FLEET_DIR"
      printf '\nNext: acquire a session with: sudo -n bbx fleet acquire --json\n'
    } >&2
  fi
}

# ── fleet acquire ───────────────────────────────────────────────────

# Reserve one seat using only Fleet's authoritative records.
# Runtime/port observation deliberately happens after this short ownership
# transaction so concurrent acquires serialize for milliseconds, not for
# process and socket probes.
#
# On success, _FLEET_RESERVATION contains:
#   0 allocation id, 1 seat, 2 seat record, 3 main port,
#   4 public hostname, 5 created timestamp, 6 runtime marker.
# Return 10 when no record-level capacity remains.
_fleet_try_reserve() {
  local opt_seat="$1"
  local opt_port="$2"
  local timeout_secs="$3"
  local excluded_seats="$4"
  local -A occupied_seats=() occupied_ports=()
  local id rec record_id seat record_port state p
  local inconsistent_record=""
  _FLEET_RESERVATION=()

  _fleet_lock

  # One allocation pass builds the complete in-memory occupancy view.
  while IFS= read -r id; do
    rec="$(_fleet_alloc_path "$id")"
    record_id="$(_fleet_record_get "$rec" ALLOCATION_ID 2>/dev/null || true)"
    seat="$(_fleet_record_get "$rec" SEAT_NAME 2>/dev/null || true)"
    record_port="$(_fleet_record_get "$rec" MAIN_PORT 2>/dev/null || true)"
    state="$(_fleet_record_get "$rec" STATE 2>/dev/null || true)"
    if [[ "$record_id" != "$id" ]] \
      || ! _fleet_valid_username "$seat" \
      || [[ ! -f "$(_fleet_seat_record_path "$seat")" ]] \
      || ! _fleet_valid_port "$record_port" \
      || [[ -z "$state" ]]; then
      inconsistent_record="$id"
      break
    fi
    if [[ -n "${occupied_seats[$seat]+set}" ]]; then
      inconsistent_record="$id"
      break
    fi
    occupied_seats["$seat"]="$id"
    for p in $(_fleet_port_set "$record_port"); do
      if [[ -n "${occupied_ports[$p]+set}" ]]; then
        inconsistent_record="$id"
        break 2
      fi
      occupied_ports["$p"]="$id"
    done
  done < <(_fleet_alloc_list)

  if [[ -n "$inconsistent_record" ]]; then
    _fleet_unlock
    _fleet_fail fleet_state_inconsistent \
      "Allocation ${inconsistent_record} is invalid or conflicts with another record; run 'bbx fleet reconcile --fix'."
  fi

  local chosen="" chosen_rec="" main_port="" conflict_id=""
  while IFS= read -r seat; do
    [[ -n "$opt_seat" && "$seat" != "$opt_seat" ]] && continue
    case " ${excluded_seats} " in
      *" ${seat} "*) continue ;;
    esac
    [[ -n "${occupied_seats[$seat]+set}" ]] && continue

    rec="$(_fleet_seat_record_path "$seat")"
    [[ "$(_fleet_record_get "$rec" ELIGIBLE 2>/dev/null)" == "true" ]] || continue
    main_port="$(_fleet_record_get "$rec" MAIN_PORT 2>/dev/null || true)"
    [[ -n "$opt_port" ]] && main_port="$opt_port"
    _fleet_valid_port "$main_port" || continue

    conflict_id=""
    for p in $(_fleet_port_set "$main_port"); do
      if [[ -n "${occupied_ports[$p]+set}" ]]; then
        conflict_id="${occupied_ports[$p]}"
        break
      fi
    done
    if [[ -n "$conflict_id" ]]; then
      _fleet_warn "Seat ${seat}: port set conflicts with allocation ${conflict_id}; skipping."
      continue
    fi
    chosen="$seat"
    chosen_rec="$rec"
    break
  done < <(_fleet_seat_list)

  if [[ -z "$chosen" ]]; then
    _fleet_unlock
    return 10
  fi

  local alloc_id public_host now runtime_marker
  alloc_id="$(_fleet_alloc_id_gen)"
  public_host="$(_fleet_record_get "$chosen_rec" PUBLIC_HOSTNAME 2>/dev/null || echo "")"
  [[ -z "$public_host" ]] && public_host="${FLEET_DOMAIN:-$(get_system_hostname)}"
  now="$(_fleet_now)"
  runtime_marker="$(_fleet_epoch)"
  _fleet_record_write "$(_fleet_alloc_path "$alloc_id")" \
    "ALLOCATION_ID=${alloc_id}" \
    "SEAT_NAME=${chosen}" \
    "LINUX_USER=${chosen}" \
    "MAIN_PORT=${main_port}" \
    "PUBLIC_HOSTNAME=${public_host}" \
    "ROUTING_MODE=${FLEET_ROUTING_MODE}" \
    "STATE=reserved" \
    "CREATED_AT=${now}" \
    "UPDATED_AT=${now}" \
    "TIMEOUT_SECONDS=${timeout_secs}" \
    "RUNTIME_MARKER=${runtime_marker}"
  _fleet_unlock

  _FLEET_RESERVATION=(
    "$alloc_id"
    "$chosen"
    "$chosen_rec"
    "$main_port"
    "$public_host"
    "$now"
    "$runtime_marker"
  )
  return 0
}

# Remove only the exact private reservation created by this acquire.
_fleet_rollback_reservation() {
  local alloc_id="$1" runtime_marker="$2"
  local rec record_id state marker
  rec="$(_fleet_alloc_path "$alloc_id")"
  _fleet_lock
  if [[ ! -f "$rec" ]]; then
    _fleet_unlock
    return 0
  fi
  record_id="$(_fleet_record_get "$rec" ALLOCATION_ID 2>/dev/null || true)"
  state="$(_fleet_record_get "$rec" STATE 2>/dev/null || true)"
  marker="$(_fleet_record_get "$rec" RUNTIME_MARKER 2>/dev/null || true)"
  if [[ "$record_id" != "$alloc_id" || "$state" != "reserved" || "$marker" != "$runtime_marker" ]]; then
    _fleet_unlock
    return 1
  fi
  rm -f "$rec"
  _fleet_unlock
  return 0
}

fleet_acquire() {
  local opt_timeout="" opt_seat="" opt_port=""
  while (( $# )); do
    case "$1" in
      --json) shift ;;
      --timeout) opt_timeout="${2:-}"; shift 2 ;;
      --seat) opt_seat="${2:-}"; shift 2 ;;
      --port) opt_port="${2:-}"; shift 2 ;;
      *) _fleet_fail fleet_invalid_config "Unknown fleet acquire option: $1" ;;
    esac
  done
  _fleet_require_init
  _fleet_config_validate

  if ! _fleet_valid_reap_seconds "$FLEET_ACQUIRE_REAP_GRACE_SECS"; then
    _fleet_fail fleet_invalid_config "FLEET_ACQUIRE_REAP_GRACE_SECS must be an integer from 0 to 86400."
  fi

  local timeout_secs="${FLEET_SESSION_TIMEOUT}"
  if [[ -n "$opt_timeout" ]]; then
    _fleet_valid_int "$opt_timeout" || _fleet_fail fleet_invalid_config "--timeout must be a nonnegative integer."
    timeout_secs="$opt_timeout"
  fi
  if [[ -n "$opt_port" && "$FLEET_ROUTING_MODE" == "subdomain" ]]; then
    _fleet_fail fleet_invalid_config "--port cannot override subdomain routing (seat ports are preconfigured in nginx)."
  fi
  if ! _has_chrome; then
    _fleet_fail fleet_setup_failed "Chrome/Chromium is not installed on this machine."
  fi

  # ── Phase 1: reserve using records only. Port/process observation is
  #    outside the lock. Recovery runs once only when capacity appears
  #    exhausted, keeping the normal acquire path lightweight. ──
  if [[ -n "$opt_seat" ]]; then
    _fleet_valid_username "$opt_seat" || _fleet_fail fleet_invalid_config "Invalid --seat name."
    [[ -f "$(_fleet_seat_record_path "$opt_seat")" ]] || _fleet_fail fleet_invalid_config "Unknown seat '${opt_seat}'."
  fi
  local excluded_seats="" recovery_attempted=0 reserve_rc=0
  local alloc_id chosen chosen_rec main_port public_host now runtime_marker
  while :; do
    if _fleet_try_reserve "$opt_seat" "$opt_port" "$timeout_secs" "$excluded_seats"; then
      alloc_id="${_FLEET_RESERVATION[0]}"
      chosen="${_FLEET_RESERVATION[1]}"
      chosen_rec="${_FLEET_RESERVATION[2]}"
      main_port="${_FLEET_RESERVATION[3]}"
      public_host="${_FLEET_RESERVATION[4]}"
      now="${_FLEET_RESERVATION[5]}"
      runtime_marker="${_FLEET_RESERVATION[6]}"
      if _fleet_port_set_free "$main_port"; then
        break
      fi
      _fleet_warn "Seat ${chosen}: port set around ${main_port} is busy; skipping."
      if ! _fleet_rollback_reservation "$alloc_id" "$runtime_marker"; then
        _fleet_fail fleet_state_inconsistent "Reservation ${alloc_id} changed before busy-port rollback."
      fi
      excluded_seats+=" ${chosen}"
      continue
    else
      reserve_rc=$?
    fi

    (( reserve_rc == 10 )) \
      || _fleet_fail fleet_state_inconsistent "Fleet reservation failed unexpectedly."
    if (( ! recovery_attempted )); then
      recovery_attempted=1
      if ! _fleet_reap_once "$FLEET_ACQUIRE_REAP_GRACE_SECS" 0 "acquire"; then
        _fleet_warn "Acquire-time recovery encountered an error; retrying the current Fleet state once."
      fi
      continue
    fi
    if [[ -n "$opt_port" ]]; then
      _fleet_fail fleet_port_exhausted "No eligible free seat with a usable port set is available."
    fi
    _fleet_fail fleet_exhausted "No locally available Fleet seats remain."
  done

  # ── Phase 2 (unlocked): delegated lifecycle on the reserved seat. ──
  local rollback_reason="" rollback_code=""
  _fleet_enter_target "$chosen"
  _fleet_apply_defaults_env

  # Stop any stale runtime attributable to this free managed seat.
  if sudo -n pgrep -u "$chosen" -f 'browserbox|bbpro' >/dev/null 2>&1; then
    _fleet_info "Stopping stale runtime on ${chosen}..."
    _fleet_stop_seat_runtime
  fi
  sudo -n rm -f "$(_tu_config_dir)/login.link" 2>/dev/null || true

  local token scheme login_url=""
  token="$(openssl rand -hex 16)"
  scheme="https"
  [[ "$FLEET_BACKEND" == "http" ]] && scheme="http"

  local -a setup_args=(--port "$main_port" --token "$token" --backend "$FLEET_BACKEND")
  local seat_hostname="$public_host"
  if [[ "$FLEET_ROUTING_MODE" == "subdomain" ]]; then
    setup_args+=(--zeta)
    seat_hostname="$FLEET_DOMAIN"
  fi

  _tu_ensure_config_dir
  if [[ -z "$rollback_reason" ]] && ! _fleet_ensure_managed_agreement; then
    rollback_reason="Could not install the managed BrowserBox agreement for seat ${chosen}."
    rollback_code="fleet_setup_failed"
  fi
  if [[ -z "$rollback_reason" ]]; then
    _fleet_info "[${chosen}] Running delegated setup (port ${main_port})..."
    if ! BBX_HOSTNAME="$seat_hostname" BBX_NONINTERACTIVE=true _tu_run setup_bbpro "${setup_args[@]}" >/dev/null 2>&1; then
      rollback_reason="Delegated BrowserBox setup failed for seat ${chosen}."
      rollback_code="fleet_setup_failed"
    fi
  fi

  if [[ -z "$rollback_reason" && "$FLEET_ROUTING_MODE" == "subdomain" ]]; then
    if ! _fleet_write_seat_hostsenv "$chosen_rec" "$main_port"; then
      rollback_reason="Failed to write seat service-host map (hosts.env)."
      rollback_code="fleet_setup_failed"
    fi
  fi

  if [[ -z "$rollback_reason" ]]; then
    _fleet_ensure_clean_slate
    local fleet_routing_env_file="${FLEET_DIR}/routing.env"
    local cf kf
    cf="$(_fleet_record_get "$fleet_routing_env_file" CERT_FILE 2>/dev/null || true)"
    kf="$(_fleet_record_get "$fleet_routing_env_file" KEY_FILE 2>/dev/null || true)"
    if [[ -n "$cf" && -n "$kf" ]]; then
      _fleet_install_seat_certs "$cf" "$kf" || true
    fi
  fi

  local alloc_rec_path
  alloc_rec_path="$(_fleet_alloc_path "$alloc_id")"

  if [[ -z "$rollback_reason" ]]; then
    _fleet_lock
    _fleet_record_update "$alloc_rec_path" "STATE=starting" "UPDATED_AT=$(_fleet_now)"
    _fleet_unlock
    local run_rc=0 run_detail=""
    BBX_HOSTNAME="$seat_hostname" BBX_NONINTERACTIVE=true _fleet_delegated_run run_detail || run_rc=$?
    if (( run_rc == 2 )); then
      rollback_reason="License certification failed for seat ${chosen}. ${run_detail}"
      rollback_code="fleet_license_unavailable"
    elif (( run_rc != 0 )); then
      rollback_reason="BrowserBox failed to start for seat ${chosen}. ${run_detail}"
      rollback_code="fleet_start_failed"
    fi
  fi

  if [[ -z "$rollback_reason" ]]; then
    if ! wait_for_local_ready "$main_port" "$scheme" 90 >/dev/null 2>&1; then
      rollback_reason="BrowserBox did not become ready on port ${main_port}."
      rollback_code="fleet_start_failed"
    fi
  fi

  if [[ -z "$rollback_reason" ]]; then
    if [[ "$FLEET_ROUTING_MODE" == "subdomain" ]]; then
      login_url="https://${public_host}/login?token=${token}"
    else
      login_url="${scheme}://${public_host}:${main_port}/login?token=${token}"
    fi
    printf '%s\n' "$login_url" | sudo -n -u "$chosen" tee "$(_tu_config_dir)/login.link" >/dev/null 2>&1 || true
    _fleet_info "Verifying public login URL..."
    if ! _fleet_probe_public_url "$login_url" "$public_host" "$FLEET_ROUTING_MODE" "$main_port"; then
      rollback_reason="Public login URL did not respond for seat ${chosen}."
      rollback_code="fleet_public_route_failed"
    fi
  fi

  if [[ -n "$rollback_reason" ]]; then
    _fleet_warn "Acquire failed: ${rollback_reason} Rolling back."
    _fleet_stop_seat_runtime
    local wiped=0
    _fleet_wipe_seat_profile && wiped=1
    _fleet_exit_target
    _fleet_lock
    if (( wiped )); then
      rm -f "$alloc_rec_path"
    else
      _fleet_record_update "$alloc_rec_path" "STATE=failed" "UPDATED_AT=$(_fleet_now)"
    fi
    _fleet_unlock
    _fleet_fail "${rollback_code:-fleet_start_failed}" "$rollback_reason"
  fi

  _fleet_exit_target

  # ── Phase 3 (locked): confirm the reservation is still ours, mark running. ──
  _fleet_lock
  local check_id
  check_id="$(_fleet_record_get "$alloc_rec_path" ALLOCATION_ID 2>/dev/null || true)"
  if [[ "$check_id" != "$alloc_id" ]]; then
    _fleet_unlock
    _fleet_enter_target "$chosen"
    _fleet_stop_seat_runtime
    _fleet_wipe_seat_profile || true
    _fleet_exit_target
    _fleet_fail fleet_state_inconsistent "Reservation for ${alloc_id} disappeared during startup."
  fi
  _fleet_record_update "$alloc_rec_path" \
    "STATE=running" \
    "UPDATED_AT=$(_fleet_now)" \
    "LOGIN_URL=${login_url}"
  _fleet_unlock

  if (( FLEET_JSON )); then
    _fleet_emit "{\"ok\":true,\"allocation_id\":\"${alloc_id}\",\"state\":\"running\",\"login_url\":\"$(_fleet_json_escape "$login_url")\",\"created_at\":\"${now}\",\"timeout_seconds\":${timeout_secs},\"runtime\":{\"seat\":\"${chosen}\",\"main_port\":${main_port}}}"
  else
    printf '%b\n' "${GREEN}Allocation ready.${NC}" >&2
    draw_box "Login Link: ${login_url}" >&2
    printf '  Allocation ID: %s\n  Seat: %s (port %s)\n' "$alloc_id" "$chosen" "$main_port" >&2
    printf '  Release with: sudo -n bbx fleet release %s\n' "$alloc_id" >&2
  fi
}

# ── fleet release ───────────────────────────────────────────────────

# Canonical allocation release primitive. Manual release, reconciliation,
# and automatic reaping all route through this function.
#
# Return codes:
#   0  released
#   10 already absent
#   11 release already in progress
#   12 allocation changed or recovered before automatic release
_fleet_release_allocation() {
  local alloc_id="$1"
  local force="${2:-0}"
  local expected_marker="${3:-}"
  local require_down="${4:-false}"
  local expected_user="${5:-}"
  local expected_port="${6:-}"
  local expected_state="${7:-}"
  local rec user main_port state record_id runtime_marker health
  FLEET_RELEASED_SEAT=""
  FLEET_RELEASE_NOTE=""
  rec="$(_fleet_alloc_path "$alloc_id")"

  _fleet_lock
  if [[ ! -f "$rec" ]]; then
    _fleet_unlock
    FLEET_RELEASE_NOTE="already released"
    return 10
  fi
  record_id="$(_fleet_record_get "$rec" ALLOCATION_ID 2>/dev/null || true)"
  user="$(_fleet_record_get "$rec" LINUX_USER 2>/dev/null || true)"
  main_port="$(_fleet_record_get "$rec" MAIN_PORT 2>/dev/null || true)"
  state="$(_fleet_record_get "$rec" STATE 2>/dev/null || true)"
  runtime_marker="$(_fleet_record_get "$rec" RUNTIME_MARKER 2>/dev/null || true)"
  if [[ "$record_id" != "$alloc_id" || -z "$user" || -z "$main_port" || -z "$state" ]]; then
    if (( force )); then
      mv -f "$rec" "${FLEET_DIR}/diagnostics/$(basename "$rec").corrupt" 2>/dev/null || rm -f "$rec"
      _fleet_unlock
      _fleet_fail fleet_state_inconsistent "Allocation record was corrupt; quarantined (--force)."
    fi
    _fleet_unlock
    _fleet_fail fleet_state_inconsistent "Allocation record for ${alloc_id} is corrupt. Re-run with --force to quarantine it."
  fi
  if [[ -n "$expected_marker" && "$runtime_marker" != "$expected_marker" ]]; then
    _fleet_unlock
    FLEET_RELEASE_NOTE="allocation changed before release"
    return 12
  fi
  if [[ -n "$expected_user" && "$user" != "$expected_user" ]] \
     || [[ -n "$expected_port" && "$main_port" != "$expected_port" ]]; then
    _fleet_unlock
    FLEET_RELEASE_NOTE="allocation target changed before release"
    return 12
  fi
  if [[ -n "$expected_state" && "$state" != "$expected_state" ]]; then
    _fleet_unlock
    FLEET_RELEASE_NOTE="allocation state changed before release"
    return 12
  fi
  if [[ "$state" == "releasing" && "$expected_state" != "releasing" ]] && (( ! force )); then
    _fleet_unlock
    FLEET_RELEASE_NOTE="release already in progress"
    return 11
  fi
  if [[ "$require_down" == "true" ]]; then
    case "$state" in
      reserved|starting|running|releasing) ;;
      *)
        _fleet_unlock
        FLEET_RELEASE_NOTE="allocation state changed before automatic release"
        return 12
        ;;
    esac
    health="$(_fleet_alloc_health "$user" "$main_port")"
    if [[ "$health" != "down" ]]; then
      _fleet_unlock
      FLEET_RELEASE_NOTE="runtime recovered before automatic release"
      return 12
    fi
  fi
  _fleet_record_update "$rec" "STATE=releasing" "UPDATED_AT=$(_fleet_now)"
  _fleet_unlock

  # Delegated stop + clean-slate cleanup (validates the recorded user
  # against the configured seat range before any destructive action).
  _fleet_enter_target "$user"
  _fleet_stop_seat_runtime
  local wiped=0
  _fleet_wipe_seat_profile && wiped=1
  _fleet_exit_target

  local ports_free=1 p
  for p in $(_fleet_port_set "$main_port"); do
    if _fleet_port_listening "$p"; then ports_free=0; break; fi
  done

  if (( ! wiped )) && (( ! force )); then
    _fleet_lock
    [[ -f "$rec" ]] && _fleet_record_update "$rec" "STATE=failed" "UPDATED_AT=$(_fleet_now)"
    _fleet_unlock
    _fleet_fail fleet_release_failed "Could not verify clean-slate profile removal for seat ${user}. Investigate, then re-run with --force."
  fi
  if (( ! ports_free )) && (( ! force )); then
    _fleet_lock
    [[ -f "$rec" ]] && _fleet_record_update "$rec" "STATE=failed" "UPDATED_AT=$(_fleet_now)"
    _fleet_unlock
    _fleet_fail fleet_release_failed "Ports for seat ${user} are still in use after stop. Investigate, then re-run with --force."
  fi

  _fleet_lock
  if [[ -f "$rec" ]]; then
    record_id="$(_fleet_record_get "$rec" ALLOCATION_ID 2>/dev/null || true)"
    user="$(_fleet_record_get "$rec" LINUX_USER 2>/dev/null || true)"
    main_port="$(_fleet_record_get "$rec" MAIN_PORT 2>/dev/null || true)"
    runtime_marker="$(_fleet_record_get "$rec" RUNTIME_MARKER 2>/dev/null || true)"
    state="$(_fleet_record_get "$rec" STATE 2>/dev/null || true)"
    if [[ "$record_id" != "$alloc_id" || "$state" != "releasing" \
       || ( -n "$expected_marker" && "$runtime_marker" != "$expected_marker" ) \
       || ( -n "$expected_user" && "$user" != "$expected_user" ) \
       || ( -n "$expected_port" && "$main_port" != "$expected_port" ) ]]; then
      _fleet_unlock
      _fleet_fail fleet_state_inconsistent "Allocation ${alloc_id} changed while release cleanup was running."
    fi
  fi
  rm -f "$rec"
  _fleet_unlock

  FLEET_RELEASED_SEAT="$user"
  return 0
}

fleet_release() {
  local alloc_id="" force=0
  while (( $# )); do
    case "$1" in
      --json) shift ;;
      --force) force=1; shift ;;
      -*) _fleet_fail fleet_invalid_config "Unknown fleet release option: $1" ;;
      *) [[ -z "$alloc_id" ]] && alloc_id="$1" || _fleet_fail fleet_invalid_config "Unexpected extra argument: $1"; shift ;;
    esac
  done
  [[ -n "$alloc_id" ]] || _fleet_fail fleet_invalid_config "Usage: bbx fleet release <allocation-id> [--json] [--force]"
  _fleet_valid_alloc_id "$alloc_id" || _fleet_fail fleet_allocation_not_found "Malformed allocation ID '${alloc_id}'."
  _fleet_require_init

  local release_rc=0
  if _fleet_release_allocation "$alloc_id" "$force"; then
    release_rc=0
  else
    release_rc=$?
  fi
  case "$release_rc" in
    10|11)
      if (( FLEET_JSON )); then
        _fleet_emit "{\"ok\":true,\"allocation_id\":\"${alloc_id}\",\"released\":false,\"note\":\"$(_fleet_json_escape "$FLEET_RELEASE_NOTE")\"}"
      else
        _fleet_info "Allocation ${alloc_id}: ${FLEET_RELEASE_NOTE}."
      fi
      return 0
      ;;
    0) ;;
    *) _fleet_fail fleet_release_failed "Could not release allocation ${alloc_id}." ;;
  esac

  if (( FLEET_JSON )); then
    _fleet_emit "{\"ok\":true,\"allocation_id\":\"${alloc_id}\",\"released\":true,\"seat\":\"${FLEET_RELEASED_SEAT}\"}"
  else
    printf '%b\n' "${GREEN}Released allocation ${alloc_id} (seat ${FLEET_RELEASED_SEAT} returned to pool).${NC}" >&2
  fi
}
# ── fleet list ──────────────────────────────────────────────────────

# Health of one allocation: "running" if main port listening and seat
# has BrowserBox processes, else "down"/"partial".
_fleet_alloc_health() {
  local user="$1" main_port="$2"
  local listening=0 procs=0 process_rc=0
  _fleet_port_listening "$main_port" && listening=1
  if _fleet_user_runtime_alive "$user"; then
    procs=1
  else
    process_rc=$?
    if (( process_rc > 1 )); then
      printf 'unknown'
      return
    fi
  fi
  if (( listening && procs )); then printf 'healthy'
  elif (( listening || procs )); then printf 'partial'
  else printf 'down'; fi
}

# Snapshot reclaimable allocation identity under the lock, then perform
# every process/socket observation outside it. The release primitive does
# the authoritative locked identity/state/health revalidation later.
_fleet_reap_candidates() {
  local id rec state seat port marker updated health age now_epoch row
  local -a snapshots=()
  _fleet_lock
  while IFS= read -r id; do
    rec="$(_fleet_alloc_path "$id")"
    state="$(_fleet_record_get "$rec" STATE 2>/dev/null || true)"
    case "$state" in
      reserved|starting|running|releasing) ;;
      *) continue ;;
    esac
    seat="$(_fleet_record_get "$rec" SEAT_NAME 2>/dev/null || true)"
    port="$(_fleet_record_get "$rec" MAIN_PORT 2>/dev/null || true)"
    marker="$(_fleet_record_get "$rec" RUNTIME_MARKER 2>/dev/null || true)"
    updated="$(_fleet_record_get "$rec" UPDATED_AT 2>/dev/null || true)"
    [[ -n "$seat" && -n "$port" && -n "$marker" ]] || continue
    snapshots+=("$id"$'\t'"$seat"$'\t'"$port"$'\t'"$marker"$'\t'"$state"$'\t'"$updated")
  done < <(_fleet_alloc_list)
  _fleet_unlock

  now_epoch="$(_fleet_epoch)"
  for row in "${snapshots[@]:-}"; do
    [[ -n "$row" ]] || continue
    IFS=$'\t' read -r id seat port marker state updated <<< "$row"
    if [[ "$state" != "running" ]]; then
      [[ -n "$updated" ]] || continue
      age=$(( now_epoch - $(_fleet_ts_to_epoch "$updated") ))
      (( age > FLEET_STALE_RESERVE_SECS )) || continue
    fi
    health="$(_fleet_alloc_health "$seat" "$port")"
    [[ "$health" == "down" ]] || continue
    printf '%s\t%s\t%s\t%s\t%s\n' "$id" "$seat" "$port" "$marker" "$state"
  done
}

# Confirm and release fully-down running or stale transitional allocations.
# Args: <grace-seconds> <emit-result:0|1> <source>
_fleet_reap_once() {
  local grace_secs="$1"
  local emit_result="${2:-1}"
  local source="${3:-manual}"
  _fleet_valid_reap_seconds "$grace_secs" \
    || _fleet_fail fleet_invalid_config "Reap grace must be an integer from 0 to 86400 seconds."
  _fleet_valid_log_detail_limit "$FLEET_MONITOR_FAILURE_DETAIL_LIMIT" \
    || _fleet_fail fleet_invalid_config "FLEET_MONITOR_FAILURE_DETAIL_LIMIT must be an integer from 0 to 100."

  local -a candidate_ids=() candidate_seats=() candidate_ports=() candidate_markers=() candidate_states=()
  local id seat port marker state
  while IFS=$'\t' read -r id seat port marker state; do
    [[ -n "$id" ]] || continue
    candidate_ids+=("$id")
    candidate_seats+=("$seat")
    candidate_ports+=("$port")
    candidate_markers+=("$marker")
    candidate_states+=("$state")
  done < <(_fleet_reap_candidates)

  local candidate_count="${#candidate_ids[@]}"
  local reaped=0 skipped=0 failed=0
  local failure_details=0 failure_details_suppressed=0
  local reaped_json="" first=1 release_rc idx

  if (( candidate_count > 0 && grace_secs > 0 )); then
    local grace_deadline grace_now grace_remaining
    grace_deadline=$(( $(_fleet_epoch) + grace_secs ))
    while :; do
      if [[ "$source" == "monitor" ]] && (( ! _FLEET_MONITOR_RUNNING )); then
        _fleet_info "Fleet monitor pass cancelled during confirmation: candidates=${candidate_count}, no allocations released."
        return 0
      fi
      grace_now="$(_fleet_epoch)"
      (( grace_now >= grace_deadline )) && break
      grace_remaining=$(( grace_deadline - grace_now ))
      sleep "$grace_remaining" || true
    done
  fi

  for idx in "${!candidate_ids[@]}"; do
    id="${candidate_ids[$idx]}"
    seat="${candidate_seats[$idx]}"
    marker="${candidate_markers[$idx]}"
    state="${candidate_states[$idx]}"
    if (
      FLEET_JSON=0
      _fleet_release_allocation \
        "$id" \
        0 \
        "$marker" \
        true \
        "$seat" \
        "${candidate_ports[$idx]}" \
        "$state"
    ); then
      release_rc=0
    else
      release_rc=$?
    fi
    case "$release_rc" in
      0)
        reaped=$((reaped + 1))
        (( first )) || reaped_json+=","
        first=0
        reaped_json+="\"${id}\""
        ;;
      10|11|12)
        skipped=$((skipped + 1))
        ;;
      *)
        failed=$((failed + 1))
        if (( failure_details < FLEET_MONITOR_FAILURE_DETAIL_LIMIT )); then
          _fleet_warn "Automatic release failed for ${id}; the allocation remains unavailable pending operator review."
          failure_details=$((failure_details + 1))
        else
          failure_details_suppressed=$((failure_details_suppressed + 1))
        fi
        ;;
    esac
  done

  if (( failure_details_suppressed > 0 )); then
    _fleet_warn "Suppressed ${failure_details_suppressed} additional automatic-release failure detail(s) in this pass."
  fi

  if (( emit_result )); then
    if (( FLEET_JSON )); then
      local ok=true
      (( failed > 0 )) && ok=false
      _fleet_emit "{\"ok\":${ok},\"source\":\"$(_fleet_json_escape "$source")\",\"candidates\":${candidate_count},\"reaped\":${reaped},\"skipped\":${skipped},\"failed\":${failed},\"allocation_ids\":[${reaped_json}]}"
    else
      printf 'Fleet reap: %s candidate(s), %s released, %s skipped, %s failed.\n' \
        "$candidate_count" "$reaped" "$skipped" "$failed" >&2
    fi
  elif (( candidate_count > 0 )); then
    _fleet_info "Fleet reap source=${source}: candidates=${candidate_count}, released=${reaped}, skipped=${skipped}, failed=${failed}."
  fi

  (( failed == 0 ))
}

fleet_reap() {
  local grace_secs="$FLEET_REAP_GRACE_SECS"
  while (( $# )); do
    case "$1" in
      --json) shift ;;
      --grace) grace_secs="${2:-}"; shift 2 ;;
      *) _fleet_fail fleet_invalid_config "Unknown fleet reap option: $1" ;;
    esac
  done
  _fleet_require_init
  _fleet_reap_once "$grace_secs" 1 "reap"
}

fleet_monitor() {
  local interval_secs="$FLEET_REAP_INTERVAL_SECS"
  local grace_secs="$FLEET_REAP_GRACE_SECS"
  while (( $# )); do
    case "$1" in
      --interval) interval_secs="${2:-}"; shift 2 ;;
      --grace) grace_secs="${2:-}"; shift 2 ;;
      --json) _fleet_fail fleet_invalid_config "fleet monitor is a streaming command and does not support --json." ;;
      *) _fleet_fail fleet_invalid_config "Unknown fleet monitor option: $1" ;;
    esac
  done
  _fleet_require_init
  _fleet_valid_reap_seconds "$interval_secs" && (( interval_secs > 0 )) \
    || _fleet_fail fleet_invalid_config "Monitor interval must be an integer from 1 to 86400 seconds."
  _fleet_valid_reap_seconds "$grace_secs" \
    || _fleet_fail fleet_invalid_config "Monitor grace must be an integer from 0 to 86400 seconds."
  _fleet_valid_reap_seconds "$FLEET_MONITOR_MAX_BACKOFF_SECS" \
    && (( FLEET_MONITOR_MAX_BACKOFF_SECS > 0 )) \
    || _fleet_fail fleet_invalid_config "FLEET_MONITOR_MAX_BACKOFF_SECS must be an integer from 1 to 86400."
  _fleet_valid_log_detail_limit "$FLEET_MONITOR_FAILURE_DETAIL_LIMIT" \
    || _fleet_fail fleet_invalid_config "FLEET_MONITOR_FAILURE_DETAIL_LIMIT must be an integer from 0 to 100."

  _FLEET_MONITOR_RUNNING=1
  trap '_FLEET_MONITOR_RUNNING=0' INT TERM HUP
  local max_backoff="$FLEET_MONITOR_MAX_BACKOFF_SECS"
  (( max_backoff < interval_secs )) && max_backoff="$interval_secs"
  local retry_delay="$interval_secs" failure_streak=0
  _fleet_info "Monitoring Fleet allocations (interval ${interval_secs}s, down grace ${grace_secs}s, max error backoff ${max_backoff}s)."
  while (( _FLEET_MONITOR_RUNNING )); do
    if _fleet_reap_once "$grace_secs" 0 "monitor"; then
      if (( failure_streak > 0 )); then
        _fleet_info "Fleet monitor recovered after ${failure_streak} failed pass(es)."
      fi
      failure_streak=0
      retry_delay="$interval_secs"
    else
      failure_streak=$((failure_streak + 1))
      retry_delay=$((retry_delay * 2))
      (( retry_delay > max_backoff )) && retry_delay="$max_backoff"
      _fleet_warn "Fleet monitor pass failed (streak ${failure_streak}); retrying in ${retry_delay}s."
    fi
    (( _FLEET_MONITOR_RUNNING )) || break
    sleep "$retry_delay" || true
  done
  trap - INT TERM HUP
  _FLEET_MONITOR_RUNNING=0
  _fleet_info "Fleet monitor stopped."
}

_fleet_age_of() {
  local ts="$1" now epoch
  now="$(_fleet_epoch)"
  epoch="$(_fleet_ts_to_epoch "$ts")"
  if (( epoch == 0 )); then printf '?'; return; fi
  local s=$(( now - epoch ))
  if (( s < 120 )); then printf '%ss' "$s"
  elif (( s < 7200 )); then printf '%sm' "$((s/60))"
  else printf '%sh' "$((s/3600))"; fi
}

fleet_list() {
  local show_all=0
  while (( $# )); do
    case "$1" in
      --json) shift ;;
      --all) show_all=1; shift ;;
      *) _fleet_fail fleet_invalid_config "Unknown fleet list option: $1" ;;
    esac
  done
  _fleet_require_init

  local id rec state seat host port created health login_url
  local json_items="" first=1
  local -a rows=()
  while IFS= read -r id; do
    rec="$(_fleet_alloc_path "$id")"
    state="$(_fleet_record_get "$rec" STATE 2>/dev/null || echo '?')"
    if (( ! show_all )) && [[ "$state" == "failed" ]]; then continue; fi
    seat="$(_fleet_record_get "$rec" SEAT_NAME 2>/dev/null || echo '?')"
    host="$(_fleet_record_get "$rec" PUBLIC_HOSTNAME 2>/dev/null || echo '?')"
    port="$(_fleet_record_get "$rec" MAIN_PORT 2>/dev/null || echo 0)"
    created="$(_fleet_record_get "$rec" CREATED_AT 2>/dev/null || echo '')"
    login_url="$(_fleet_record_get "$rec" LOGIN_URL 2>/dev/null || echo '')"
    health="down"
    [[ "$seat" != "?" && "$port" != 0 ]] && health="$(_fleet_alloc_health "$seat" "$port")"
    rows+=("$(printf '%s\t%s\t%s\t%s\t%s\t%s\t%s' "$id" "$state" "$(_fleet_age_of "$created")" "$seat" "$host" "$port" "$health")")
    if (( FLEET_JSON )); then
      (( first )) || json_items+=","
      first=0
      # login_url is included in privileged JSON mode only — never in
      # the human table.
      json_items+="{\"allocation_id\":\"${id}\",\"state\":\"${state}\",\"created_at\":\"${created}\",\"seat\":\"$(_fleet_json_escape "$seat")\",\"public_hostname\":\"$(_fleet_json_escape "$host")\",\"main_port\":${port:-0},\"health\":\"${health}\",\"login_url\":\"$(_fleet_json_escape "$login_url")\"}"
    fi
  done < <(_fleet_alloc_list)

  if (( FLEET_JSON )); then
    _fleet_emit "{\"ok\":true,\"allocations\":[${json_items}]}"
  else
    {
      printf '%-38s %-10s %-5s %-14s %-30s %-6s %s\n' "ALLOCATION" "STATE" "AGE" "SEAT" "PUBLIC HOSTNAME" "PORT" "HEALTH"
      local row
      for row in "${rows[@]:-}"; do
        [[ -n "$row" ]] || continue
        IFS=$'\t' read -r id state created seat host port health <<< "$row"
        printf '%-38s %-10s %-5s %-14s %-30s %-6s %s\n' "$id" "$state" "$created" "$seat" "$host" "$port" "$health"
      done
      (( ${#rows[@]} == 0 )) && printf '(no active allocations)\n'
    } >&2
  fi
}

# ── fleet status ────────────────────────────────────────────────────

_fleet_vacancy_advisory() {
  # Advisory license-vacancy snapshot; never authoritative, never fatal.
  local api="${BBX_LICENSE_SERVER_URL:-https://master.dosaygo.com}"
  [[ -n "${LICENSE_KEY:-}" ]] || { printf 'unavailable'; return; }
  command -v jq >/dev/null 2>&1 || { printf 'unavailable'; return; }
  local resp free
  resp="$(curl -sS --connect-timeout 4 --max-time 8 -H "Authorization: Bearer ${LICENSE_KEY}" "${api}/v1/occupancy" 2>/dev/null || true)"
  free="$(printf '%s' "$resp" | jq -r '.occupancy.totals.freeNow // empty' 2>/dev/null || true)"
  if [[ "$free" =~ ^[0-9]+$ ]]; then printf '%s' "$free"; else printf 'unavailable'; fi
}

fleet_status() {
  local target_id=""
  while (( $# )); do
    case "$1" in
      --json) shift ;;
      -*) _fleet_fail fleet_invalid_config "Unknown fleet status option: $1" ;;
      *) [[ -z "$target_id" ]] && target_id="$1" || _fleet_fail fleet_invalid_config "Unexpected extra argument: $1"; shift ;;
    esac
  done
  _fleet_require_init

  if [[ -n "$target_id" ]]; then
    _fleet_valid_alloc_id "$target_id" || _fleet_fail fleet_allocation_not_found "Malformed allocation ID."
    local rec="$(_fleet_alloc_path "$target_id")"
    [[ -f "$rec" ]] || _fleet_fail fleet_allocation_not_found "No allocation ${target_id}."
    local state seat port host login_url health has_link=false clean=false route_ok=false
    state="$(_fleet_record_get "$rec" STATE 2>/dev/null || echo '?')"
    seat="$(_fleet_record_get "$rec" SEAT_NAME 2>/dev/null || echo '')"
    port="$(_fleet_record_get "$rec" MAIN_PORT 2>/dev/null || echo 0)"
    host="$(_fleet_record_get "$rec" PUBLIC_HOSTNAME 2>/dev/null || echo '')"
    login_url="$(_fleet_record_get "$rec" LOGIN_URL 2>/dev/null || echo '')"
    health="$(_fleet_alloc_health "$seat" "$port")"
    if [[ -n "$seat" ]]; then
      _fleet_enter_target "$seat"
      sudo -n test -f "$(_tu_config_dir)/login.link" 2>/dev/null && has_link=true
      sudo -n grep -q '^export BBX_CLEAN_SLATE="true"$' "$(_tu_config_dir)/test.env" 2>/dev/null && clean=true
      _fleet_exit_target
    fi
    if [[ -n "$login_url" ]] && _fleet_probe_public_url "$login_url" "$host" "$FLEET_ROUTING_MODE" "$port"; then
      route_ok=true
    fi
    if (( FLEET_JSON )); then
      _fleet_emit "{\"ok\":true,\"allocation_id\":\"${target_id}\",\"state\":\"${state}\",\"seat\":\"$(_fleet_json_escape "$seat")\",\"main_port\":${port:-0},\"public_hostname\":\"$(_fleet_json_escape "$host")\",\"health\":\"${health}\",\"login_link_present\":${has_link},\"clean_slate\":${clean},\"public_route_ok\":${route_ok}}"
    else
      {
        printf 'Allocation:      %s\n' "$target_id"
        printf 'State:           %s\n' "$state"
        printf 'Seat:            %s (port %s)\n' "$seat" "$port"
        printf 'Public hostname: %s\n' "$host"
        printf 'Runtime health:  %s\n' "$health"
        printf 'Login link file: %s\n' "$has_link"
        printf 'Clean slate:     %s\n' "$clean"
        printf 'Public route OK: %s\n' "$route_ok"
      } >&2
    fi
    return 0
  fi

  local total=0 eligible=0 active=0 running=0 starting=0 failed=0 down=0 partial=0 unknown=0
  local seat rec id state port health
  while IFS= read -r seat; do
    total=$((total + 1))
    rec="$(_fleet_seat_record_path "$seat")"
    [[ "$(_fleet_record_get "$rec" ELIGIBLE 2>/dev/null)" == "true" ]] && eligible=$((eligible + 1))
  done < <(_fleet_seat_list)
  while IFS= read -r id; do
    rec="$(_fleet_alloc_path "$id")"
    state="$(_fleet_record_get "$rec" STATE 2>/dev/null || echo failed)"
    case "$state" in
      running)
        running=$((running + 1))
        active=$((active + 1))
        seat="$(_fleet_record_get "$rec" SEAT_NAME 2>/dev/null || true)"
        port="$(_fleet_record_get "$rec" MAIN_PORT 2>/dev/null || true)"
        if [[ -n "$seat" && -n "$port" ]]; then
          health="$(_fleet_alloc_health "$seat" "$port")"
          [[ "$health" == "down" ]] && down=$((down + 1))
          [[ "$health" == "partial" ]] && partial=$((partial + 1))
          [[ "$health" == "unknown" ]] && unknown=$((unknown + 1))
        fi
        ;;
      starting|reserved|releasing) starting=$((starting + 1)); active=$((active + 1)) ;;
      failed) failed=$((failed + 1)) ;;
    esac
  done < <(_fleet_alloc_list)
  local free=$(( eligible - active ))
  (( free < 0 )) && free=0

  local routing_env="${FLEET_DIR}/routing.env"
  local dns_valid nginx_applied cert_file cert_state="none"
  dns_valid="$(_fleet_record_get "$routing_env" DNS_VALID 2>/dev/null || echo false)"
  nginx_applied="$(_fleet_record_get "$routing_env" NGINX_APPLIED 2>/dev/null || echo false)"
  cert_file="$(_fleet_record_get "$routing_env" CERT_FILE 2>/dev/null || true)"
  if [[ -n "$cert_file" ]]; then
    if sudo -n openssl x509 -in "$cert_file" -noout -checkend 0 >/dev/null 2>&1; then
      cert_state="valid"
    else
      cert_state="expired"
    fi
  fi
  local nginx_state="inactive"
  if command -v nginx >/dev/null 2>&1 && sudo -n nginx -t >/dev/null 2>&1; then
    nginx_state="config-ok"
    sudo -n pgrep -x nginx >/dev/null 2>&1 && nginx_state="active"
  fi
  local vacancy
  load_config >/dev/null 2>&1 || true
  vacancy="$(_fleet_vacancy_advisory)"

  if (( FLEET_JSON )); then
    local vac_json="null"
    [[ "$vacancy" =~ ^[0-9]+$ ]] && vac_json="$vacancy"
    _fleet_emit "{\"ok\":true,\"seats\":{\"configured\":${FLEET_SIZE},\"eligible\":${eligible},\"records\":${total}},\"allocations\":{\"active\":${active},\"running\":${running},\"down\":${down},\"partial\":${partial},\"unknown\":${unknown},\"starting\":${starting},\"failed\":${failed},\"locally_free\":${free}},\"routing\":{\"mode\":\"${FLEET_ROUTING_MODE}\",\"domain\":\"$(_fleet_json_escape "$FLEET_DOMAIN")\",\"subdomain_mode\":\"${FLEET_SUBDOMAIN_MODE}\",\"backend\":\"${FLEET_BACKEND}\",\"nginx\":\"${nginx_state}\",\"dns_valid\":${dns_valid},\"certificate\":\"${cert_state}\"},\"clean_slate\":${FLEET_CLEAN_SLATE},\"ports\":{\"start\":${FLEET_PORT_START},\"end\":${FLEET_PORT_END}},\"license_vacancy_advisory\":${vac_json}}"
  else
    {
      printf 'Fleet status\n'
      printf '  Seats:        %s configured, %s eligible\n' "$FLEET_SIZE" "$eligible"
      printf '  Allocations:  %s active (%s running, %s starting/transitional), %s failed/stale\n' "$active" "$running" "$starting" "$failed"
      printf '  Runtime drift: %s down, %s partial, %s unknown (pending monitor/reconcile)\n' "$down" "$partial" "$unknown"
      printf '  Locally free: %s seats\n' "$free"
      printf '  Routing:      %s' "$FLEET_ROUTING_MODE"
      [[ "$FLEET_ROUTING_MODE" == "subdomain" ]] && printf ' (%s labels, domain %s)' "$FLEET_SUBDOMAIN_MODE" "$FLEET_DOMAIN"
      printf '\n'
      printf '  Nginx:        %s\n' "$nginx_state"
      printf '  DNS valid:    %s\n' "$dns_valid"
      printf '  Certificate:  %s\n' "$cert_state"
      printf '  Clean slate:  %s\n' "$FLEET_CLEAN_SLATE"
      printf '  Port range:   %s-%s\n' "$FLEET_PORT_START" "$FLEET_PORT_END"
      printf '  License vacancy (advisory): %s\n' "$vacancy"
      printf '\nNote: local free seats do not guarantee globally free license seats.\n'
    } >&2
  fi
}

# ── fleet reconcile ─────────────────────────────────────────────────

fleet_reconcile() {
  local fix=0
  while (( $# )); do
    case "$1" in
      --json) shift ;;
      --fix) fix=1; shift ;;
      *) _fleet_fail fleet_invalid_config "Unknown fleet reconcile option: $1" ;;
    esac
  done
  _fleet_require_init
  _fleet_lock 60

  local -a findings=()
  local -a release_ids=() release_markers=() release_forces=() release_seats=() release_ports=() release_states=()
  local id rec state seat port marker health user

  # Allocation state vs runtime.
  while IFS= read -r id; do
    rec="$(_fleet_alloc_path "$id")"
    state="$(_fleet_record_get "$rec" STATE 2>/dev/null || true)"
    seat="$(_fleet_record_get "$rec" SEAT_NAME 2>/dev/null || true)"
    port="$(_fleet_record_get "$rec" MAIN_PORT 2>/dev/null || true)"
    marker="$(_fleet_record_get "$rec" RUNTIME_MARKER 2>/dev/null || true)"
    if [[ -z "$state" || -z "$seat" || -z "$port" ]]; then
      findings+=("corrupt-record ${id}")
      (( fix )) && { mv -f "$rec" "${FLEET_DIR}/diagnostics/$(basename "$rec").corrupt" 2>/dev/null || rm -f "$rec"; }
      continue
    fi
    health="$(_fleet_alloc_health "$seat" "$port")"
    case "$state" in
      starting)
        if [[ "$health" == "healthy" ]]; then
          findings+=("starting-but-healthy ${id}")
          (( fix )) && _fleet_record_update "$rec" "STATE=running" "UPDATED_AT=$(_fleet_now)"
        fi
        ;;
      running)
        if [[ "$health" == "down" ]]; then
          findings+=("running-but-dead ${id}")
          if (( fix )); then
            release_ids+=("$id")
            release_markers+=("$marker")
            release_forces+=(0)
            release_seats+=("$seat")
            release_ports+=("$port")
            release_states+=("$state")
          fi
        fi
        ;;
      releasing)
        if [[ "$health" == "down" ]]; then
          findings+=("stale-releasing ${id}")
          if (( fix )); then
            release_ids+=("$id")
            release_markers+=("$marker")
            release_forces+=(1)
            release_seats+=("$seat")
            release_ports+=("$port")
            release_states+=("$state")
          fi
        fi
        ;;
    esac
  done < <(_fleet_alloc_list)

  # Orphan runtimes: processes under managed users with no allocation.
  # Reported only — never killed automatically.
  while IFS= read -r seat; do
    user="$seat"
    if sudo -n pgrep -u "$user" -f 'browserbox|bbpro' >/dev/null 2>&1; then
      if ! _fleet_alloc_for_seat "$seat" >/dev/null 2>&1; then
        findings+=("orphan-runtime ${seat} (operator review required; not killed)")
      fi
    fi
    # Stale login.link on free seats.
    local home
    home="$(getent passwd "$seat" 2>/dev/null | cut -d: -f6)"
    if [[ "$home" == /*/"$seat" ]] && ! _fleet_alloc_for_seat "$seat" >/dev/null 2>&1; then
      if sudo -n test -f "${home}/.config/dosaygo/bbpro/login.link" 2>/dev/null; then
        findings+=("stale-login-link ${seat}")
        (( fix )) && sudo -n rm -f "${home}/.config/dosaygo/bbpro/login.link"
      fi
    fi
  done < <(_fleet_seat_list)

  # State hygiene: permissions and leftover temp files.
  local f
  for f in "${FLEET_DIR}/seats"/.rec.* "${FLEET_DIR}/allocations"/.rec.*; do
    [[ -e "$f" ]] || continue
    findings+=("incomplete-temp-file $(basename "$f")")
    (( fix )) && rm -f "$f"
  done
  local perms
  perms="$(stat -c '%a' "$FLEET_DIR" 2>/dev/null || echo 700)"
  if [[ "$perms" != "700" ]]; then
    findings+=("state-permission-drift ${FLEET_DIR} (${perms})")
    (( fix )) && chmod 700 "$FLEET_DIR"
  fi

  _fleet_unlock

  # Runtime cleanup is deliberately outside the reconciliation lock.
  # Route every repair through the same stop/profile-wipe release primitive.
  local idx release_rc
  for idx in "${!release_ids[@]}"; do
    id="${release_ids[$idx]}"
    if (
      FLEET_JSON=0
      _fleet_release_allocation \
        "$id" \
        "${release_forces[$idx]}" \
        "${release_markers[$idx]}" \
        true \
        "${release_seats[$idx]}" \
        "${release_ports[$idx]}" \
        "${release_states[$idx]}"
    ); then
      release_rc=0
    else
      release_rc=$?
    fi
    case "$release_rc" in
      0|10|11) ;;
      12) findings+=("release-skipped-changed-or-recovered ${id}") ;;
      *) findings+=("release-failed ${id}") ;;
    esac
  done

  local applied="report-only"
  (( fix )) && applied="fixes-applied"
  if (( FLEET_JSON )); then
    local items="" first=1 fnd
    for fnd in "${findings[@]:-}"; do
      [[ -n "$fnd" ]] || continue
      (( first )) || items+=","
      first=0
      items+="\"$(_fleet_json_escape "$fnd")\""
    done
    _fleet_emit "{\"ok\":true,\"mode\":\"${applied}\",\"findings\":[${items}]}"
  else
    {
      printf 'Fleet reconcile (%s): %s finding(s)\n' "$applied" "${#findings[@]}"
      local fnd
      for fnd in "${findings[@]:-}"; do
        [[ -n "$fnd" ]] && printf '  - %s\n' "$fnd"
      done
    } >&2
  fi
}

# ── fleet doctor ────────────────────────────────────────────────────

fleet_doctor() {
  while (( $# )); do
    case "$1" in
      --json) shift ;;
      *) _fleet_fail fleet_invalid_config "Unknown fleet doctor option: $1" ;;
    esac
  done

  local -a names=() states=() details=()
  local fails=0 warns=0
  _fd_check() { # <pass|warning|fail> <name> [detail]
    names+=("$2"); states+=("$1"); details+=("${3:-}")
    [[ "$1" == "fail" ]] && fails=$((fails + 1))
    [[ "$1" == "warning" ]] && warns=$((warns + 1))
    return 0
  }

  [[ "$(uname -s)" == "Linux" ]] && _fd_check pass "Linux supported" || _fd_check fail "Linux supported" "bbx fleet is Linux-only"
  if [[ "$EUID" -eq 0 ]] || sudo -n true 2>/dev/null; then _fd_check pass "Privileged operator"; else _fd_check fail "Privileged operator" "need root or passwordless sudo"; fi
  local tool
  for tool in flock getent pgrep pkill useradd; do
    command -v "$tool" >/dev/null 2>&1 && _fd_check pass "${tool} available" || _fd_check fail "${tool} available" "install it"
  done
  if command -v ss >/dev/null 2>&1 || command -v lsof >/dev/null 2>&1; then
    _fd_check pass "port-inspection tool (ss/lsof)"
  else
    _fd_check warning "port-inspection tool (ss/lsof)" "falling back to /dev/tcp probes"
  fi
  command -v browserbox >/dev/null 2>&1 && _fd_check pass "BrowserBox binary installed" || _fd_check fail "BrowserBox binary installed" "run the BrowserBox installer first"
  command -v setup_bbpro >/dev/null 2>&1 && _fd_check pass "Delegated lifecycle commands (setup_bbpro)" || _fd_check fail "Delegated lifecycle commands (setup_bbpro)" "BrowserBox install incomplete"
  _has_chrome && _fd_check pass "Chrome/Chromium present" || _fd_check warning "Chrome/Chromium present" "acquire will fail until a browser is installed"

  _fleet_set_dir
  if _fleet_dirs_ready; then
    _fd_check pass "Fleet initialized"
    _fleet_config_load
    local cfg_ok=1
    ( FLEET_JSON=0 _fleet_config_validate ) >/dev/null 2>&1 || cfg_ok=0
    (( cfg_ok )) && _fd_check pass "Fleet configuration valid" || _fd_check fail "Fleet configuration valid" "run bbx fleet init to repair"
    local perms
    perms="$(stat -c '%a' "$FLEET_DIR" 2>/dev/null || echo '?')"
    [[ "$perms" == "700" ]] && _fd_check pass "Fleet state permissions (0700)" || _fd_check warning "Fleet state permissions (0700)" "found ${perms}; run bbx fleet reconcile --fix"

    local present=0 missing=0 seat idx
    for (( idx=0; idx < FLEET_SIZE; idx++ )); do
      seat="$(_fleet_seat_name "$idx")"
      if id "$seat" >/dev/null 2>&1; then present=$((present + 1)); else missing=$((missing + 1)); fi
    done
    if (( missing == 0 )); then
      _fd_check pass "${present}/${FLEET_SIZE} managed users present"
    else
      _fd_check fail "${present}/${FLEET_SIZE} managed users present" "run bbx fleet init to create missing users"
    fi

    # Port-set collision audit across seat records.
    local -a mains=()
    local rec p q collision=0
    while IFS= read -r seat; do
      rec="$(_fleet_seat_record_path "$seat")"
      [[ "$(_fleet_record_get "$rec" ELIGIBLE 2>/dev/null)" == "true" ]] || continue
      p="$(_fleet_record_get "$rec" MAIN_PORT 2>/dev/null || true)"
      [[ -n "$p" ]] || continue
      for q in "${mains[@]:-}"; do
        [[ -n "$q" ]] || continue
        _fleet_port_sets_conflict "$p" "$q" && collision=1
      done
      mains+=("$p")
    done < <(_fleet_seat_list)
    (( collision )) && _fd_check fail "Seat port sets non-overlapping" "collision detected; re-run init" || _fd_check pass "Seat port sets non-overlapping"

    if [[ "$FLEET_ROUTING_MODE" == "subdomain" ]]; then
      command -v nginx >/dev/null 2>&1 && _fd_check pass "nginx available" || _fd_check fail "nginx available" "install nginx"
      if command -v nginx >/dev/null 2>&1; then
        if _fleet_nginx_paths && sudo -n test -f "$FLEET_NGINX_TARGET" 2>/dev/null; then
          _fd_check pass "Fleet nginx configuration installed"
          sudo -n nginx -t >/dev/null 2>&1 && _fd_check pass "nginx syntax valid" || _fd_check fail "nginx syntax valid" "nginx -t failed"
        else
          _fd_check fail "Fleet nginx configuration installed" "run bbx fleet routing apply"
        fi
      fi
      local routing_env="${FLEET_DIR}/routing.env" cert_file
      cert_file="$(_fleet_record_get "$routing_env" CERT_FILE 2>/dev/null || true)"
      if [[ -n "$cert_file" ]] && sudo -n test -r "$cert_file" 2>/dev/null; then
        if sudo -n openssl x509 -in "$cert_file" -noout -checkend 0 >/dev/null 2>&1; then
          if _fleet_cert_covers "$cert_file" "bbxfleetcheck.${FLEET_DOMAIN}"; then
            _fd_check pass "Wildcard certificate covers *.${FLEET_DOMAIN}"
          else
            _fd_check fail "Wildcard certificate covers *.${FLEET_DOMAIN}" "SAN mismatch"
          fi
        else
          _fd_check fail "Wildcard certificate valid" "expired"
        fi
      else
        _fd_check fail "Wildcard certificate configured" "run bbx fleet init with --cert-file/--key-file"
      fi
      if _fleet_is_local_domain "$FLEET_DOMAIN"; then
        _fd_check pass "Fleet domain DNS (local /etc/hosts mode)"
      else
        local dns_ok=1
        FLEET_DNS_VALID=false; FLEET_DNS_PROXIED=false
        _fleet_dns_validate "$FLEET_DOMAIN" "true" >/dev/null 2>&1 || dns_ok=0
        if (( dns_ok )); then
          if [[ "$FLEET_DNS_PROXIED" == "true" ]]; then
            _fd_check warning "Wildcard DNS resolves" "resolves, but not verifiably to this machine"
          else
            _fd_check pass "Wildcard DNS resolves to this machine"
          fi
        else
          _fd_check fail "Wildcard DNS resolves" "create *.${FLEET_DOMAIN} A record"
        fi
      fi
      # Representative public route probe against the first eligible seat.
      local probe_seat probe_rec probe_host probe_port
      probe_seat="$(_fleet_seat_list | head -n1)"
      if [[ -n "$probe_seat" ]]; then
        probe_rec="$(_fleet_seat_record_path "$probe_seat")"
        probe_host="$(_fleet_record_get "$probe_rec" HOST_MAIN 2>/dev/null || true)"
        probe_port="$(_fleet_record_get "$probe_rec" MAIN_PORT 2>/dev/null || true)"
        if [[ -n "$probe_host" ]]; then
          local code
          code="$(curl -k -s -o /dev/null -w '%{http_code}' --connect-timeout 3 --max-time 6 --resolve "${probe_host}:443:127.0.0.1" "https://${probe_host}/" 2>/dev/null || true)"
          if [[ "$code" =~ ^[0-9]{3}$ && "$code" != "000" ]]; then
            _fd_check pass "Representative public route reachable (${probe_host})"
          else
            _fd_check warning "Representative public route reachable (${probe_host})" "no backend running is normal when seat is free"
          fi
        fi
      fi
    fi

    [[ "$FLEET_CLEAN_SLATE" == "true" ]] && _fd_check pass "Clean-slate mode enabled" || _fd_check warning "Clean-slate mode enabled" "FLEET_CLEAN_SLATE=false: seats may retain browser state"

    # Allocation consistency + orphans (report-only).
    local incons=0 orphans=0 aid arec astate aseat aport
    while IFS= read -r aid; do
      arec="$(_fleet_alloc_path "$aid")"
      astate="$(_fleet_record_get "$arec" STATE 2>/dev/null || true)"
      aseat="$(_fleet_record_get "$arec" SEAT_NAME 2>/dev/null || true)"
      aport="$(_fleet_record_get "$arec" MAIN_PORT 2>/dev/null || true)"
      if [[ -z "$astate" || -z "$aseat" || -z "$aport" ]]; then incons=$((incons + 1)); continue; fi
      if [[ "$astate" == "running" && "$(_fleet_alloc_health "$aseat" "$aport")" == "down" ]]; then incons=$((incons + 1)); fi
    done < <(_fleet_alloc_list)
    while IFS= read -r seat; do
      if sudo -n pgrep -u "$seat" -f 'browserbox|bbpro' >/dev/null 2>&1 && ! _fleet_alloc_for_seat "$seat" >/dev/null 2>&1; then
        orphans=$((orphans + 1))
      fi
    done < <(_fleet_seat_list)
    (( incons == 0 )) && _fd_check pass "Allocation state consistent" || _fd_check warning "Allocation state consistent" "${incons} inconsistencies; run bbx fleet reconcile --fix"
    (( orphans == 0 )) && _fd_check pass "No orphan seat runtimes" || _fd_check warning "No orphan seat runtimes" "${orphans} orphan runtime(s) need operator review"
  else
    _fd_check warning "Fleet initialized" "run bbx fleet init"
  fi

  load_config >/dev/null 2>&1 || true
  if [[ -n "${LICENSE_KEY:-}" ]]; then
    _fd_check pass "Operator license key configured"
    local vac
    vac="$(_fleet_vacancy_advisory)"
    if [[ "$vac" =~ ^[0-9]+$ ]]; then
      _fd_check pass "License vacancy (advisory): ${vac} free"
    else
      _fd_check warning "License vacancy" "unavailable"
    fi
  else
    _fd_check warning "Operator license key configured" "set LICENSE_KEY or run bbx certify"
  fi

  local i
  if (( FLEET_JSON )); then
    local items="" first=1
    for i in "${!names[@]}"; do
      (( first )) || items+=","
      first=0
      items+="{\"name\":\"$(_fleet_json_escape "${names[$i]}")\",\"status\":\"${states[$i]}\",\"detail\":\"$(_fleet_json_escape "${details[$i]}")\"}"
    done
    local ok=true
    (( fails > 0 )) && ok=false
    _fleet_emit "{\"ok\":${ok},\"failures\":${fails},\"warnings\":${warns},\"checks\":[${items}]}"
  else
    {
      for i in "${!names[@]}"; do
        case "${states[$i]}" in
          pass) printf '%b %s\n' "${GREEN}✓${NC}" "${names[$i]}" ;;
          warning) printf '%b %s%s\n' "${YELLOW}!${NC}" "${names[$i]}" "${details[$i]:+ — ${details[$i]}}" ;;
          fail) printf '%b %s%s\n' "${RED}✗${NC}" "${names[$i]}" "${details[$i]:+ — ${details[$i]}}" ;;
        esac
      done
      printf '\n%s failure(s), %s warning(s)\n' "$fails" "$warns"
    } >&2
  fi
  (( fails > 0 )) && exit 1
  return 0
}

# ── fleet config ────────────────────────────────────────────────────

fleet_config() {
  local sub="${1:-show}"
  [[ "$sub" == "--json" ]] && sub="show"
  [[ $# -gt 0 ]] && shift
  _fleet_require_init
  local f="${FLEET_DIR}/defaults.env"
  case "$sub" in
    show)
      local json_mode=0
      [[ "${1:-}" == "--json" ]] && json_mode=1
      if (( FLEET_JSON || json_mode )); then
        local items="" first=1 line key val
        if [[ -f "$f" ]]; then
          while IFS= read -r line; do
            [[ "$line" == *"="* ]] || continue
            key="${line%%=*}"; val="${line#*=}"
            _fleet_valid_envkey "$key" || continue
            (( first )) || items+=","
            first=0
            items+="\"$(_fleet_json_escape "$key")\":\"$(_fleet_json_escape "$val")\""
          done < "$f"
        fi
        _fleet_emit "{\"ok\":true,\"defaults\":{${items}}}"
      else
        {
          printf 'Fleet BrowserBox defaults (%s):\n' "$f"
          if [[ -s "$f" ]]; then cat "$f"; else printf '(none set)\n'; fi
        } >&2
      fi
      ;;
    set)
      local key="${1:-}" val="${2:-}"
      [[ -n "$key" && $# -ge 2 ]] || _fleet_fail fleet_invalid_config "Usage: bbx fleet config set <KEY> <VALUE>"
      _fleet_valid_envkey "$key" || _fleet_fail fleet_invalid_config "Invalid environment variable name '${key}'."
      case "$key" in
        LICENSE_KEY|GH_TOKEN|GITHUB_TOKEN|PATH|HOME|SUDO|BBX_FOR_USER)
          _fleet_fail fleet_invalid_config "Refusing to store ${key} in Fleet defaults." ;;
      esac
      [[ "$val" == *$'\n'* ]] && _fleet_fail fleet_invalid_config "Values must not contain newlines."
      local tmp
      tmp="$(mktemp "${FLEET_DIR}/.def.XXXXXX")"
      chmod 600 "$tmp"
      if [[ -f "$f" ]]; then grep -v -E "^${key}=" "$f" >> "$tmp" || true; fi
      printf '%s=%s\n' "$key" "$val" >> "$tmp"
      mv -f "$tmp" "$f"
      if (( FLEET_JSON )); then _fleet_emit "{\"ok\":true,\"set\":\"$(_fleet_json_escape "$key")\"}"; else _fleet_info "Set ${key}."; fi
      ;;
    unset)
      local key="${1:-}"
      [[ -n "$key" ]] || _fleet_fail fleet_invalid_config "Usage: bbx fleet config unset <KEY>"
      _fleet_valid_envkey "$key" || _fleet_fail fleet_invalid_config "Invalid environment variable name '${key}'."
      if [[ -f "$f" ]]; then
        local tmp
        tmp="$(mktemp "${FLEET_DIR}/.def.XXXXXX")"
        chmod 600 "$tmp"
        grep -v -E "^${key}=" "$f" >> "$tmp" || true
        mv -f "$tmp" "$f"
      fi
      if (( FLEET_JSON )); then _fleet_emit "{\"ok\":true,\"unset\":\"$(_fleet_json_escape "$key")\"}"; else _fleet_info "Unset ${key}."; fi
      ;;
    *)
      _fleet_fail fleet_invalid_config "Usage: bbx fleet config <show|set|unset>" ;;
  esac
}

# ── fleet routing ───────────────────────────────────────────────────

fleet_routing() {
  local sub="${1:-show}"
  [[ "$sub" == "--json" ]] && sub="show"
  [[ $# -gt 0 ]] && shift
  _fleet_require_init
  case "$sub" in
    show)
      local routing_env="${FLEET_DIR}/routing.env"
      local cert_file dns_valid dns_proxied nginx_applied
      cert_file="$(_fleet_record_get "$routing_env" CERT_FILE 2>/dev/null || true)"
      dns_valid="$(_fleet_record_get "$routing_env" DNS_VALID 2>/dev/null || echo false)"
      dns_proxied="$(_fleet_record_get "$routing_env" DNS_PROXIED 2>/dev/null || echo false)"
      nginx_applied="$(_fleet_record_get "$routing_env" NGINX_APPLIED 2>/dev/null || echo false)"
      local cert_state="none"
      if [[ -n "$cert_file" ]]; then
        sudo -n openssl x509 -in "$cert_file" -noout -checkend 0 >/dev/null 2>&1 && cert_state="valid" || cert_state="expired"
      fi
      local seat rec host port
      if (( FLEET_JSON )); then
        local items="" first=1
        while IFS= read -r seat; do
          rec="$(_fleet_seat_record_path "$seat")"
          [[ "$(_fleet_record_get "$rec" ELIGIBLE 2>/dev/null)" == "true" ]] || continue
          host="$(_fleet_record_get "$rec" PUBLIC_HOSTNAME 2>/dev/null || true)"
          port="$(_fleet_record_get "$rec" MAIN_PORT 2>/dev/null || echo 0)"
          (( first )) || items+=","
          first=0
          items+="{\"seat\":\"$(_fleet_json_escape "$seat")\",\"public_hostname\":\"$(_fleet_json_escape "$host")\",\"main_port\":${port}}"
        done < <(_fleet_seat_list)
        _fleet_emit "{\"ok\":true,\"mode\":\"${FLEET_ROUTING_MODE}\",\"domain\":\"$(_fleet_json_escape "$FLEET_DOMAIN")\",\"subdomain_mode\":\"${FLEET_SUBDOMAIN_MODE}\",\"backend\":\"${FLEET_BACKEND}\",\"certificate\":{\"path\":\"$(_fleet_json_escape "$cert_file")\",\"state\":\"${cert_state}\"},\"dns_valid\":${dns_valid},\"dns_proxied\":${dns_proxied},\"nginx_applied\":${nginx_applied},\"seats\":[${items}]}"
      else
        {
          printf 'Routing mode:    %s\n' "$FLEET_ROUTING_MODE"
          printf 'Fleet domain:    %s\n' "${FLEET_DOMAIN:-'(none)'}"
          printf 'Subdomain mode:  %s\n' "$FLEET_SUBDOMAIN_MODE"
          printf 'Backend scheme:  %s\n' "$FLEET_BACKEND"
          printf 'Certificate:     %s (%s)\n' "${cert_file:-none}" "$cert_state"
          printf 'DNS validated:   %s (proxied: %s)\n' "$dns_valid" "$dns_proxied"
          printf 'Nginx applied:   %s\n' "$nginx_applied"
          printf '\nSeat routing map:\n'
          printf '  %-14s %-40s %s\n' "SEAT" "PUBLIC HOSTNAME" "UPSTREAM"
          while IFS= read -r seat; do
            rec="$(_fleet_seat_record_path "$seat")"
            [[ "$(_fleet_record_get "$rec" ELIGIBLE 2>/dev/null)" == "true" ]] || continue
            host="$(_fleet_record_get "$rec" PUBLIC_HOSTNAME 2>/dev/null || echo '?')"
            port="$(_fleet_record_get "$rec" MAIN_PORT 2>/dev/null || echo '?')"
            printf '  %-14s %-40s 127.0.0.1:%s\n' "$seat" "$host" "$port"
          done < <(_fleet_seat_list)
        } >&2
      fi
      ;;
    apply)
      local allow_active=0
      while (( $# )); do
        case "$1" in
          --json) shift ;;
          --allow-active) allow_active=1; shift ;;
          *) _fleet_fail fleet_invalid_config "Unknown fleet routing apply option: $1" ;;
        esac
      done
      [[ "$FLEET_ROUTING_MODE" == "subdomain" ]] \
        || _fleet_fail fleet_invalid_config "routing apply is only meaningful in subdomain mode."
      _fleet_lock 60
      local active_count
      active_count="$(_fleet_alloc_list | wc -l | tr -d ' ')"
      if (( active_count > 0 && ! allow_active )); then
        _fleet_unlock
        _fleet_fail fleet_active_allocations "Refusing to rewrite routing with ${active_count} active allocation(s). Pass --allow-active to proceed (already-issued login URLs may become invalid)."
      fi
      (( active_count > 0 )) && _fleet_warn "Applying routing with ${active_count} active allocation(s); issued login URLs may become invalid."
      _fleet_config_validate
      local routing_env="${FLEET_DIR}/routing.env" cert_file key_file
      cert_file="$(_fleet_record_get "$routing_env" CERT_FILE 2>/dev/null || true)"
      key_file="$(_fleet_record_get "$routing_env" KEY_FILE 2>/dev/null || true)"
      if [[ -z "$cert_file" || -z "$key_file" ]]; then
        _fleet_unlock
        _fleet_fail fleet_certificate_invalid "No certificate configured. Run bbx fleet init with --cert-file/--key-file."
      fi
      _fleet_cert_validate "$cert_file" "$key_file" "$FLEET_DOMAIN"
      if ! _fleet_is_local_domain "$FLEET_DOMAIN"; then
        _fleet_dns_validate "$FLEET_DOMAIN" "true" >/dev/null 2>&1 \
          || _fleet_warn "Wildcard DNS for *.${FLEET_DOMAIN} did not validate; continuing (routing is local to nginx)."
      fi
      _fleet_nginx_apply "$cert_file" "$key_file"
      _fleet_record_update "$routing_env" "NGINX_APPLIED=true" "CHECKED_AT=$(_fleet_now)"
      _fleet_unlock
      if (( FLEET_JSON )); then
        _fleet_emit "{\"ok\":true,\"nginx_applied\":true,\"affected_allocations\":${active_count}}"
      else
        _fleet_info "Fleet routing applied atomically (affected active allocations: ${active_count})."
      fi
      ;;
    *)
      _fleet_fail fleet_invalid_config "Usage: bbx fleet routing <show|apply>" ;;
  esac
}

# ── fleet help ──────────────────────────────────────────────────────

fleet_help() {
  {
    printf '%b\n' "${BOLD}bbx fleet${NC} — pool of ephemeral, clean-slate BrowserBox sessions (Linux only)"
    printf '\n'
    printf 'A privileged operator (root or passwordless sudo) initializes a fixed pool of\n'
    printf 'reusable OS-user seats. An external, already-authenticated application then\n'
    printf 'acquires a session, redirects its user to the returned login URL, and releases\n'
    printf 'the allocation when the session ends. Every allocation gets a fresh login\n'
    printf 'token and (by default) a clean browser profile. Login URLs are secret\n'
    printf 'capabilities — do not log them.\n'
    printf '\n'
    printf '%b\n' "${BOLD}Commands${NC}"
    printf '  fleet init [options]        Initialize/expand the seat pool and routing.\n'
    printf '  fleet acquire [--json]      Allocate a seat; returns allocation_id + login_url.\n'
    printf '  fleet release <id> [--force] Return a seat to the pool (clean-slate).\n'
    printf '  fleet list [--json] [--all] List active allocations.\n'
    printf '  fleet status [<id>]         Fleet summary or one allocation in depth.\n'
    printf '  fleet reconcile [--fix]     Report (and optionally repair) state drift.\n'
    printf '  fleet reap [--grace <s>]    Confirm and release dead running allocations.\n'
    printf '  fleet monitor [options]     Continuously reap dead allocations (foreground).\n'
    printf '  fleet doctor [--json]       Environment and configuration health checks.\n'
    printf '  fleet config show|set|unset Fleet-wide BrowserBox env defaults.\n'
    printf '  fleet routing show|apply    Inspect / atomically re-apply nginx routing.\n'
    printf '\n'
    printf '%b\n' "${BOLD}Init options${NC}"
    printf '  --size <n> --domain <host> --routing <subdomain|direct-port>\n'
    printf '  --subdomain-mode <port|seat|random> --backend <http|https>\n'
    printf '  --cert-file <pem> --key-file <pem> --allow-proxied-domain\n'
    printf '  --user-prefix <p> --user-width <n> --port-start <p> --port-end <p>\n'
    printf '\n'
    printf '%b\n' "${BOLD}Monitor options${NC}"
    printf '  --interval <seconds>        Delay between monitor passes (default %s).\n' "$FLEET_REAP_INTERVAL_SECS"
    printf '  --grace <seconds>           Required continuously-down window (default %s).\n' "$FLEET_REAP_GRACE_SECS"
    printf '\n'
    printf '%b\n' "${BOLD}Routing${NC}"
    printf '  subdomain (production): every seat is served through port 443 under a\n'
    printf '  stable per-seat hostname (wildcard DNS *.domain + wildcard TLS cert\n'
    printf '  required). Nginx is fully configured at init — acquire/release never\n'
    printf '  touch nginx or DNS.\n'
    printf '  direct-port: URLs use <host>:<seat-port> directly (testing, internal\n'
    printf '  deployments, or behind another routing layer).\n'
    printf '\n'
    printf '%b\n' "${BOLD}Integration example${NC}"
    printf '  session_json="$(sudo -n bbx fleet acquire --json)"\n'
    printf '  allocation_id="$(jq -r .allocation_id <<<"$session_json")"\n'
    printf '  login_url="$(jq -r .login_url <<<"$session_json")"\n'
    printf '  # redirect the authenticated user to $login_url ...\n'
    printf '  sudo -n bbx fleet release "$allocation_id"\n'
    printf '\n'
    printf 'Wildcard DNS example:  *.browser.example.com A <machine IPv4>\n'
    printf 'Fleet is Linux-only and requires root or passwordless sudo.\n'
  } >&2
}

# ── fleet dispatcher ────────────────────────────────────────────────

fleet_main() {
  local sub="${1:-help}"
  [[ $# -gt 0 ]] && shift
  BBX_SKIP_POLICY_FOOTER=1
  # nginx and user-management tools live in sbin on Debian-family
  # systems; non-root operators do not have sbin on PATH by default.
  case ":$PATH:" in
    *:/usr/sbin:*) ;;
    *) PATH="$PATH:/usr/sbin:/sbin" ;;
  esac

  # JSON purity: when --json is requested, everything incidental goes
  # to stderr; only the final JSON document reaches real stdout.
  local arg
  for arg in "$sub" "$@"; do
    if [[ "$arg" == "--json" ]]; then
      FLEET_JSON=1
      break
    fi
  done
  if (( FLEET_JSON )); then
    exec {_FLEET_STDOUT_FD}>&1
    exec 1>&2
  fi

  case "$sub" in
    help|--help|-h)
      fleet_help
      return 0
      ;;
  esac

  _fleet_require_linux
  _fleet_require_priv

  case "$sub" in
    init) fleet_init "$@" ;;
    acquire) fleet_acquire "$@" ;;
    release) fleet_release "$@" ;;
    list) fleet_list "$@" ;;
    status) fleet_status "$@" ;;
    reconcile) fleet_reconcile "$@" ;;
    reap) fleet_reap "$@" ;;
    monitor) fleet_monitor "$@" ;;
    doctor) fleet_doctor "$@" ;;
    config) fleet_config "$@" ;;
    routing) fleet_routing "$@" ;;
    *)
      _fleet_fail fleet_invalid_config "Unknown fleet subcommand '${sub}'. See: bbx fleet help"
      ;;
  esac
}

# ═══ end FLEET ══════════════════════════════════════════════════════


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
    hostname="$(normalize_hostname_for_local_use "$hostname")"
    local temporary=false

    # Parse arguments with named flags
    while [ $# -gt 0 ]; do
        case "$1" in
            --temporary)
                temporary=true
                shift
                ;;
            --port|-p)
                if [ -z "$2" ]; then
                    printf "${RED}Error: Option $1 requires an argument${NC}\n"
                    printf "Usage: bbx run-as [--temporary] [--port|-p <port>] <username>${NC}\n"
                    exit 1
                fi
                port="$2"
                shift 2
                ;;
            *)
                if [ -z "$user" ]; then
                    user="$1" # First non-flag argument is the username
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
    $SUDO -u "$user" mkdir -p "$HOME_DIR/.config/dosaygo/bbpro" || { printf "${RED}Failed to create config dir for $user${NC}\n"; exit 1; }

    # Rsync .nvm from calling user to target user
    printf "${YELLOW}Copying nvm and Node.js from $HOME/.nvm to $HOME_DIR/.nvm...${NC}\n"
    $SUDO rsync -aq --exclude='.git' "$HOME/.nvm/" "$HOME_DIR/.nvm/" || { printf "${RED}Failed to rsync .nvm directory${NC}\n"; exit 1; }
    GROUP="$(id -gn "$user")"
    $SUDO chown -R "$user":"$GROUP" "$HOME_DIR/.nvm" || { printf "${RED}Failed to chown .nvm directory${NC}\n"; exit 1; }
    NODE_VERSION="v22"
    $SUDO -i -u "$user" bash -c "source ~/.nvm/nvm.sh; nvm use $NODE_VERSION; nvm alias default $NODE_VERSION;" || { printf "${RED}Failed to set up nvm for $user${NC}\n"; exit 1; }

    # Test port accessibility
    pkill ncat &>/dev/null
    for i in {-2..2}; do
        test_port_access $((port+i)) || { printf "${RED}Quit software using these ports or adjust firewall for $user to allow ports $((port-2))-$((port+2))/tcp${NC}\n"; exit 1; }
    done
    test_port_access $((port-3000)) || { printf "${RED}CDP endpoint port $((port-3000)) is blocked for $user${NC}\n"; exit 1; }

    # Generate fresh token
    TOKEN=$(openssl rand -hex 16)

    # Run setup_bbpro with explicit PATH and fresh token, redirecting output as the target user
    $SUDO -u "$user" bash -c "PATH=/usr/local/bin:\$PATH BBX_MINIMAL_MODE=\"${BBX_MINIMAL_MODE:-}\" LICENSE_KEY=\"${LICENSE_KEY}\" setup_bbpro --port $port --token $TOKEN > ~/.config/dosaygo/bbpro/setup_output.txt 2>&1" || { printf "${RED}Setup failed for $user${NC}\n"; $SUDO cat "$HOME_DIR/.config/dosaygo/bbpro/setup_output.txt"; exit 1; }

    # Use caller's LICENSE_KEY
    if [ -z "$LICENSE_KEY" ]; then
        printf "${RED}No product key set in LICENSE_KEY env var. Run 'bbx activate' or go to dosaygo.com to get a valid product key.${NC}\n"
        exit 1
    fi
    $SUDO -u "$user" bash -c "PATH=/usr/local/bin:\$PATH; export LICENSE_KEY='$LICENSE_KEY'; export BBX_MINIMAL_MODE=\"${BBX_MINIMAL_MODE:-}\"; bbcertify && bbpro" || { printf "${RED}Failed to run BrowserBox as $user${NC}\n"; exit 1; }
    sleep 2

    # Retrieve token
    if $SUDO test -f "$HOME_DIR/.config/dosaygo/bbpro/test.env"; then
        TOKEN=$($SUDO -u "$user" bash -c "source ~/.config/dosaygo/bbpro/test.env && echo \$LOGIN_TOKEN") || { printf "${RED}Failed to source test.env for $user${NC}\n"; exit 1; }
    fi
    if [ -z "$TOKEN" ] && $SUDO test -f "$HOME_DIR/.config/dosaygo/bbpro/login.link"; then
        TOKEN=$($SUDO cat "$HOME_DIR/.config/dosaygo/bbpro/login.link" | grep -oE 'token=[^&]+' | sed 's/token=//')
    fi
    [ -n "$TOKEN" ] || { printf "${RED}Failed to retrieve login token for $user${NC}\n"; exit 1; }

    draw_box "Login Link: https://$hostname:$port/login?token=$TOKEN"
    draw_box "Username: $user"
    save_config
}

# Helper: Test if an IP is reachable for Win9x
test_ip_connectivity() {
  local ip=$1
  local port=$2
  local timeout_seconds=2
  # Use curl with a short timeout to test HTTP connectivity
  if timeout "$timeout_seconds" curl --silent --connect-timeout "$timeout_seconds" "http://$ip:$port" &>/dev/null; then
    return 0
  fi
  return 1
}

# Helper: Find best LAN IP for Win9x compatibility
find_best_ip() {
  local port="$1"

  # Get all IPv4 addresses, excluding loopback initially
  local ips=""
  if command -v ip >/dev/null 2>&1; then
    # Linux: Use `ip addr show` to get IPv4 addresses
    ips=$(ip addr show | grep 'inet ' | awk '{print $2}' | cut -d'/' -f1 | grep -v '^127\.0\.0\.1')
  elif command -v ifconfig >/dev/null 2>&1; then
    # macOS/BSD: Use `ifconfig` to get IPv4 addresses
    ips=$(ifconfig | grep 'inet ' | awk '{print $2}' | grep -v '^127\.0\.0\.1')
  fi

  # Append 127.0.0.1 last to prioritize LAN IPs
  ips="$ips 127.0.0.1"

  # Test each IP and use the first one that works
  local best_ip=""
  for ip in $ips; do
    if test_ip_connectivity "$ip" "$port"; then
      best_ip="$ip"
      break
    fi
  done

  # If no connectable IP found, return the first non-loopback or fallback to localhost
  if [[ -z "$best_ip" ]]; then
    for ip in $ips; do
      if [[ "$ip" != "127.0.0.1" ]]; then
        best_ip="$ip"
        break
      fi
    done
    [[ -z "$best_ip" ]] && best_ip="127.0.0.1"
  fi

  echo "$best_ip"
}

# Helper: Show animated Windows flag
show_win9x_flag() {
  # Windows flag colors: red, green, blue, yellow
  cat <<EOF
[?25l[5C[49m         [38;5;232;48;5;232m▄[38;5;232;48;5;16m▄[49m                                      [0m
[5C[49m        [49m [49m [49m [49m [38;5;232;48;5;16m▄[38;5;232;48;5;16m▄[38;5;232;48;5;232m▄[49m [49m  [49m                               [0m
[5C[49m        [38;5;232;48;5;131m▄[49m  [49m [49m [49m [38;5;232;49m▄[38;5;16;48;5;16m▄[38;5;16m▄[38;5;232;48;5;232m▄[38;5;16;49m▄[38;5;16m▄[38;5;16m▄[49m [49m                           [0m
[5C[49m      [49m [38;5;95;49m▄[49m [49m [49m [38;5;16;48;5;203m▄[38;5;232;48;5;95m▄[49m [49m [49m [49m [38;5;16;48;5;232m▄[38;5;16;48;5;16m▄[38;5;16m▄[38;5;232;48;5;16m▄[38;5;16;49m▄[38;5;16;48;5;16m▄[48;5;16m▄[48;5;16m▄[38;5;232;48;5;232m▄[38;5;16;49m▄[48;5;232m▄[48;5;232m▄[38;5;16;48;5;232m▄[38;5;16;49m▄[38;5;16;48;5;16m▄[48;5;16m▄[48;5;16m▄[48;5;232m▄[49m▄[49m▄[38;5;16;49m▄[38;5;16;49m▄[38;5;16m▄[49m [49m        [0m
[5C[49m         [49m [38;5;95;49m▄[49m [49m [38;5;52;48;5;95m▄[38;5;52;48;5;203m▄[38;5;16;48;5;95m▄[49m [38;5;131;49m▄[38;5;167m▄[38;5;95m▄[49m [38;5;232;48;5;16m▄[38;5;232m▄[38;5;232m▄[38;5;232;48;5;16m▄[38;5;16;48;5;16m▄[48;5;16m  [38;5;16m▄[38;5;52;48;5;16m▄[38;5;232;48;5;232m▄[38;5;16;48;5;16m▄         [38;5;16;48;5;16m▄[48;5;232m▄[38;5;16;49m▄[49m [49m    [0m
[5C[49m    [49m [38;5;16;49m▄[38;5;232m▄  [38;5;232;48;5;95m▄[48;5;95m▄[49m [38;5;52;49m▄[38;5;59m▄[49m [49m [38;5;16;48;5;131m▄[38;5;16;48;5;203m▄[38;5;16m▄[49m [38;5;167;49m▄[38;5;203;48;5;95m▄[48;5;95m▄[38;5;52;48;5;52m▄[38;5;16;49m▄[38;5;16;48;5;16m▄[48;5;16m▄[48;5;16m▄[38;5;52;49m▄[38;5;203;48;5;167m▄[48;5;203m▄[48;5;203m  [48;5;167m▄[48;5;131m▄[38;5;131;48;5;95m▄[38;5;16;48;5;16m▄[48;5;16m [38;5;58m▄[38;5;59m▄[38;5;16m▄    [38;5;16;48;5;16m▄[38;5;16;49m▄[49m [49m [0m
[5C[49m     [38;5;232;48;5;16m▄[49m [49m [38;5;16;49m▄[38;5;16m▄ [49m [38;5;232;48;5;203m▄[48;5;167m▄[49m [38;5;167;49m▄[38;5;203;49m▄[38;5;167;49m▄[49m [49m [38;5;232;48;5;131m▄[38;5;16;48;5;131m▄[38;5;16;48;5;95m▄[38;5;16;49m▄[38;5;16;48;5;16m▄[38;5;16m▄[38;5;16m▄[38;5;16;48;5;16m▄[38;5;203;48;5;131m▄[48;5;203m     [38;5;167m▄[38;5;16;48;5;52m▄[48;5;16m [38;5;16m▄[38;5;150;48;5;107m▄[48;5;150m [48;5;150m▄[48;5;65m▄[38;5;150;48;5;16m▄[38;5;59;48;5;16m▄[38;5;16m▄  [38;5;16;48;5;16m▄[38;5;16;49m▄[0m
[5C[49m   [38;5;59m▄[38;5;67m▄  [38;5;232;48;5;232m▄[48;5;16m▄[49m [38;5;16;49m▄[38;5;16m▄[38;5;16m▄[49m [49m [38;5;232;48;5;131m▄[48;5;131m▄[48;5;58m▄[38;5;95;49m▄[38;5;203;48;5;167m▄[48;5;167m▄[38;5;95;48;5;167m▄[38;5;16;49m▄[38;5;16;48;5;16m▄[48;5;16m▄[48;5;16m▄[38;5;16;48;5;16m▄[38;5;167;48;5;95m▄[48;5;203m     [38;5;203m▄[38;5;16;48;5;95m▄[48;5;16m [38;5;16m▄[38;5;150;48;5;65m▄[48;5;150m     [38;5;108m▄[38;5;16;48;5;22m▄[48;5;16m  [38;5;16m▄[38;5;232;48;5;16m▄[0m
[5C[49m      [38;5;66m▄[38;5;67m▄[49m [49m [38;5;232;48;5;16m▄[48;5;16m▄[38;5;232;48;5;232m▄[38;5;16;49m▄[38;5;16;48;5;232m▄[48;5;232m▄[38;5;232;49m▄[49m [38;5;232;48;5;58m▄[38;5;232;48;5;52m▄[38;5;232;49m▄[49m [38;5;16;48;5;16m▄[38;5;16;48;5;16m▄[38;5;16m▄[38;5;232;48;5;16m▄[38;5;131;48;5;52m▄[48;5;203m      [38;5;52;48;5;131m▄[48;5;16m [38;5;16m▄[38;5;107;48;5;59m▄[48;5;150m     [38;5;150m▄[38;5;16;48;5;59m▄[48;5;16m   [38;5;232;48;5;16m▄[49m [0m
[5C[49m [49m [38;5;67;49m▄[49m [49m    [49m [38;5;67;49m▄[38;5;67m▄[49m [49m [38;5;232;48;5;16m▄[48;5;16m▄[48;5;16m▄[38;5;16;48;5;232m▄[48;5;16m   [38;5;232;48;5;16m▄[38;5;16;48;5;16m▄[48;5;16m▄[48;5;16m [38;5;16m▄[38;5;17;48;5;16m▄[38;5;16;48;5;52m▄[48;5;52m▄[48;5;52m▄[48;5;52m▄[48;5;52m▄[48;5;95m▄[48;5;95m▄[48;5;232m▄[48;5;16m [38;5;58;48;5;22m▄[38;5;107;48;5;150m▄     [38;5;16;48;5;101m▄[48;5;16m   [38;5;232;48;5;16m▄[49m  [0m
[5C[49m    [49m [38;5;74;49m▄[49m [49m  [38;5;232;48;5;60m▄[48;5;23m▄[49m [38;5;74;48;5;59m▄[48;5;60m▄[38;5;60;48;5;60m▄[49m [38;5;17;48;5;232m▄[38;5;23;48;5;232m▄[38;5;23;48;5;232m▄[49m [38;5;16;48;5;16m▄[38;5;16;48;5;16m▄[38;5;16m▄[38;5;16m▄[38;5;59;48;5;16m▄[38;5;74;48;5;16m▄[48;5;23m▄[48;5;23m▄[48;5;23m▄[48;5;16m▄[48;5;16m▄[38;5;60;48;5;16m▄  [38;5;16m▄ [38;5;16;48;5;16m▄[48;5;58m▄[48;5;101m▄[38;5;58;48;5;150m▄[38;5;108m▄[38;5;59;48;5;107m▄[38;5;16;48;5;16m▄[48;5;16m  [38;5;16;48;5;16m▄[49m   [0m
[5C[38;5;16;49m▄[38;5;16;48;5;16m▄[49m     [38;5;67;49m▄[38;5;74;49m▄[38;5;59m▄[49m  [38;5;232;48;5;23m▄[49m [49m [38;5;73;48;5;59m▄[48;5;74m [38;5;74m▄[38;5;23;48;5;67m▄[38;5;16;48;5;232m▄[48;5;16m   [38;5;17;48;5;16m▄[38;5;74;48;5;67m▄[48;5;74m     [38;5;67m▄[38;5;16;48;5;16m▄[48;5;16m [38;5;58;48;5;16m▄[38;5;220;48;5;184m▄[48;5;136m▄[48;5;16m▄[38;5;178;48;5;16m▄[38;5;52m▄ [38;5;16;48;5;16m▄[48;5;16m▄[48;5;16m  [38;5;16;48;5;16m▄[49m    [0m
[5C[49m  [49m [38;5;16;48;5;16m▄[38;5;16;48;5;16m▄[49m [49m   [49m [38;5;73;48;5;59m▄[38;5;74;48;5;67m▄[38;5;74;48;5;74m▄[38;5;16;48;5;23m▄[38;5;59;49m▄[38;5;60;49m▄[38;5;66;49m▄[49m [38;5;232;49m▄[38;5;16;48;5;16m▄[38;5;16;48;5;16m▄[38;5;16;48;5;16m▄[38;5;16;48;5;16m▄[38;5;74;48;5;66m▄[48;5;74m     [38;5;74m▄[38;5;16;48;5;23m▄[48;5;16m [38;5;16m▄[38;5;220;48;5;178m▄[48;5;220m    [48;5;220m▄[38;5;178;48;5;100m▄[38;5;16;48;5;16m▄[48;5;16m  [38;5;16m▄[49m [49m    [0m
[5C[49m    [49m [38;5;16;49m▄[38;5;16;48;5;16m▄[38;5;16;48;5;16m▄[49m [49m [49m [49m [49m [49m [38;5;66;48;5;74m▄[38;5;66;48;5;74m▄[38;5;59;48;5;74m▄[38;5;16;49m▄[38;5;16;48;5;16m▄[48;5;16m  [38;5;16;48;5;16m▄[38;5;74;48;5;59m▄[48;5;74m     [38;5;74m▄[38;5;16;48;5;60m▄[48;5;16m [38;5;16m▄[38;5;220;48;5;100m▄[48;5;220m     [38;5;220m▄[38;5;16;48;5;58m▄[48;5;16m  [38;5;16m▄[38;5;232;48;5;232m▄[49m     [0m
[5C[49m       [49m [38;5;16;48;5;16m▄[48;5;16m▄[38;5;16m▄[38;5;232;48;5;16m▄[38;5;16;49m▄[38;5;16;49m▄[49m▄[38;5;16;49m▄[38;5;232;49m▄[38;5;16;48;5;16m▄[38;5;16;48;5;16m▄[38;5;16;48;5;16m▄[38;5;16m▄[38;5;16;48;5;23m▄[38;5;16;48;5;74m▄▄[38;5;16m▄[38;5;16m▄[38;5;23m▄[38;5;59m▄[38;5;17;48;5;67m▄[48;5;16m [38;5;16m▄[38;5;178;48;5;58m▄[48;5;220m      [38;5;16;48;5;100m▄[48;5;16m  [38;5;16m▄[38;5;232;48;5;16m▄[49m      [0m
[5C[49m           [38;5;232;49m▄[38;5;16;48;5;16m▄[38;5;16m▄[38;5;232m▄[38;5;232;48;5;16m▄[38;5;16;48;5;16m▄[48;5;16m  [38;5;16m▄[38;5;16;48;5;16m▄[48;5;16m         [38;5;16;48;5;16m▄[48;5;94m▄[38;5;16;48;5;184m▄[38;5;58;48;5;220m▄[38;5;178m▄  [38;5;58;48;5;142m▄[48;5;16m   [38;5;232;48;5;16m▄[49m       [0m
[5C[49m               [38;5;232;48;5;232m▄[48;5;16m▄[48;5;16m▄[48;5;16m▄[49m [48;5;232m▄[48;5;16m▄[48;5;16m▄[48;5;16m▄[48;5;16m▄[38;5;232;48;5;16m▄[38;5;232;48;5;16m▄[38;5;232m▄[38;5;16m▄[38;5;16m▄    [38;5;16;48;5;16m▄[48;5;94m▄[38;5;16;48;5;178m▄[38;5;16;48;5;16m▄[48;5;16m  [38;5;232;48;5;16m▄[49m        [0m
[5C[49m                              [38;5;232;48;5;232m▄[38;5;232;48;5;16m▄[38;5;232;48;5;16m▄[38;5;16m▄     [38;5;16;48;5;16m▄[49m         [0m
[5C[49m                                  [38;5;232;48;5;16m▄[38;5;232;48;5;16m▄[38;5;16;48;5;16m▄ [38;5;16m▄[49m          [0m
[5C[49m                                     [38;5;232;48;5;16m▄[49m [49m          [0m
[?25h
EOF
}

# Win9x compatibility run
win9x_run() {
  banner
  show_win9x_flag
  load_config
  ensure_deps

  # Trigger setup if not fully configured
  if [ -z "$PORT" ] || [ -z "$BBX_HOSTNAME" ] || [[ ! -f "${BB_CONFIG_DIR}/test.env" ]] ; then
    printf "${YELLOW}BrowserBox not fully set up. Running 'bbx setup' first...${NC}\n"
    setup "$@" # Pass any arguments like --port to setup
    load_config
  fi

  [ -n "$TOKEN" ] || TOKEN=$(openssl rand -hex 16)
  printf "${YELLOW}Starting BrowserBox in Win9x Compatibility Mode...${NC}\n"

  # Set Win9x compatibility mode environment variable
  export WIN9X_COMPATIBILITY_MODE="true"
  export BBX_DONT_KILL_CHROME_ON_STOP="true"

  # Setup with explicit token
  local setup_cmd="setup_bbpro --port $PORT --token $TOKEN"
  BBX_MINIMAL_MODE="${BBX_MINIMAL_MODE:-}" LICENSE_KEY="${LICENSE_KEY}" $setup_cmd &>/dev/null || { printf "${RED}Setup failed${NC}\n"; exit 1; }
  
  # Reload config to get updated values
  source "${BB_CONFIG_DIR}/test.env" && PORT="${APP_PORT:-$PORT}" && TOKEN="${LOGIN_TOKEN:-$TOKEN}" || { printf "${YELLOW}Warning: test.env not found${NC}\n"; }
  
  # Validate license key
  export LICENSE_KEY
  certout="$(bash -c "export LICENSE_KEY=\"$LICENSE_KEY\"; bbcertify 2>&1")"
  if [[ "$?" -ne 0 ]]; then
    printf "${RED}License key invalid or missing. Run 'bbx activate' or go to dosaygo.com to get a valid key.${NC}\n"
    echo "Certification output: $certout"
    exit 1
  else
    printf "${GREEN}Certification complete.${NC}\n"
    if [[ -f "$CERT_META_FILE" ]]; then
      # shellcheck disable=SC1090
      source "$CERT_META_FILE"
      export BBX_RESERVATION_CODE BBX_RESERVED_SEAT_ID BBX_TICKET_ID BBX_TICKET_SLOT
    fi
  fi

  # Start bbpro in background, redirecting output to suppress banner
  printf "${YELLOW}Starting BrowserBox server (silent mode)...${NC}\n"
  export WIN9X_COMPATIBILITY_MODE="true"
  export BBX_DONT_KILL_CHROME_ON_STOP="true"
  nohup bbpro > /dev/null 2>&1 &
  
  # Wait for server to start (allows time for initialization and login.link generation)
  local startup_wait=8
  printf "${YELLOW}Waiting for Win9x Compatibility server to initialize...${NC}\n"
  sleep "$startup_wait"

  # Extract login link and modify for Win9x
  local login_link=""
  if [[ -f "${BB_CONFIG_DIR}/login.link" ]]; then
    login_link=$(cat "${BB_CONFIG_DIR}/login.link")
  else
    login_link="http://$BBX_HOSTNAME:$PORT/login?token=$TOKEN"
  fi

  # Extract path and replace /login with /win9x in one operation
  local rest="${login_link#*://*/}"
  rest="/${rest//login?/win9x/?}"
  
  # Find best IP for Win9x compatibility
  printf "${YELLOW}Detecting best LAN IP address...${NC}\n"
  local best_ip=$(find_best_ip "$PORT")
  
  if [[ -z "$best_ip" ]]; then
    printf "${RED}Could not find a connectable IP address on port $PORT${NC}\n"
    best_ip="127.0.0.1"
  fi

  # Generate Win9x compatibility login link (HTTP, not HTTPS)
  local win9x_link="http://${best_ip}:${PORT}${rest}"

  echo "$best_ip" > "${BB_CONFIG_DIR}/win9x.best.ip"

  printf "${GREEN}BrowserBox Win9x Compatibility Mode is running!${NC}\n"
  draw_box "Win9x Login Link: $win9x_link"
  printf "\n${YELLOW}Note: This link uses HTTP (not HTTPS) and /win9x/ path for legacy browser compatibility.${NC}\n"
  printf "${YELLOW}Use this link from your Windows 9x machine with Internet Explorer 4+.${NC}\n\n"
}

version() {
    printf "${GREEN}bbx version ${VERSION}${NC}\n"
}

# bbx use-chrome <version|url|stable> — download + install a specific Chrome-type
# browser and persist it as this install's browser (written to user.env as
# CHROME_PATH, which survives `bbx setup` and is honored everywhere via the
# BBX_BROWSER_PATH/CHROME_PATH normalization). Linux + macOS; Windows is a
# future (use BBX_BROWSER_PATH there for now). A sudo operation for system
# packages; Chrome-for-Testing installs are per-user (no sudo, no self-updater).
use_chrome() {
    local arg="${1:-}"
    if [[ -z "$arg" ]]; then
        printf "${YELLOW}Usage:${NC} bbx use-chrome <version|url|stable>\n"
        printf "  ${BOLD}<version>${NC}  e.g. 131 or 131.0.6778.85 — installs that Chrome-for-Testing build (per-user, no self-updater)\n"
        printf "  ${BOLD}<url>${NC}      direct link to a .deb / .rpm / .zip / .dmg to download and install\n"
        printf "  ${BOLD}stable${NC}     install the latest system Google Chrome (self-updating)\n"
        return 1
    fi

    local sudo=""
    command -v sudo >/dev/null 2>&1 && sudo="$(command -v sudo)"
    local cft_dir="${BB_CONFIG_DIR}/chrome-for-testing"

    # unzip is required for the Chrome-for-Testing / .zip paths but isn't on a
    # bare system — install it up front (best-effort, platform-appropriate).
    ensure_unzip() {
        command -v unzip >/dev/null 2>&1 && return 0
        printf "${DIM}Installing 'unzip' (required to extract the browser)…${NC}\n"
        if command -v apt-get >/dev/null 2>&1; then $sudo apt-get update -y >/dev/null 2>&1; $sudo apt-get install -y unzip >/dev/null 2>&1
        elif command -v dnf >/dev/null 2>&1; then $sudo dnf install -y unzip >/dev/null 2>&1
        elif command -v brew >/dev/null 2>&1; then brew install unzip >/dev/null 2>&1; fi
        command -v unzip >/dev/null 2>&1
    }

    # Persist the resolved browser path into user.env (create/replace the line).
    persist_chrome_path() {
        local chrome_path="$1"
        local uenv="${BB_CONFIG_DIR}/user.env"
        mkdir -p "$BB_CONFIG_DIR"
        touch "$uenv"
        # Drop any prior CHROME_PATH line, then append the new one.
        grep -v '^export CHROME_PATH=' "$uenv" > "${uenv}.tmp" 2>/dev/null || true
        mv "${uenv}.tmp" "$uenv"
        printf 'export CHROME_PATH=%q\n' "$chrome_path" >> "$uenv"
        export CHROME_PATH="$chrome_path"
        printf "${GREEN}✓ Set CHROME_PATH → ${chrome_path}${NC}\n"
        printf "  ${DIM}Persisted to ${uenv}; takes effect on the next ${BOLD}bbx start${NC}${DIM}.${NC}\n"
    }

    # Chrome-for-Testing platform token + the binary path inside the zip.
    cft_platform() {
        local os arch
        os="$(uname -s)"; arch="$(uname -m)"
        if [[ "$os" == "Linux" ]]; then echo "linux64"; return 0; fi
        if [[ "$os" == "Darwin" ]]; then
            [[ "$arch" == "arm64" ]] && echo "mac-arm64" || echo "mac-x64"; return 0
        fi
        return 1
    }
    cft_binary_in() {
        # $1 = extract root, $2 = platform
        case "$2" in
            linux64) echo "$1/chrome-linux64/chrome" ;;
            mac-arm64) echo "$1/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" ;;
            mac-x64) echo "$1/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" ;;
        esac
    }

    # Resolve a milestone (e.g. 131) or full version to a full CfT version.
    resolve_cft_version() {
        local want="$1"
        if [[ "$want" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then echo "$want"; return 0; fi
        # Milestone → latest known-good full version for that milestone.
        local api="https://googlechromelabs.github.io/chrome-for-testing/latest-versions-per-milestone.json"
        local json
        json="$(curl -fsSL --max-time 30 "$api" 2>/dev/null)" || return 1
        # Extract .milestones["<want>"].version without a JSON dep.
        printf '%s' "$json" \
          | tr -d '\n' \
          | grep -oE "\"${want}\"[[:space:]]*:[[:space:]]*\{[^}]*\"version\"[[:space:]]*:[[:space:]]*\"[0-9.]+\"" \
          | grep -oE '"version"[[:space:]]*:[[:space:]]*"[0-9.]+"' \
          | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | head -1
    }

    install_from_zip_cft() {
        local version="$1" platform="$2"
        local url="https://storage.googleapis.com/chrome-for-testing-public/${version}/${platform}/chrome-${platform}.zip"
        local dest="${cft_dir}/${version}"
        printf "${CYAN}Downloading Chrome for Testing ${version} (${platform})…${NC}\n"
        printf "  ${DIM}${url}${NC}\n"
        ensure_unzip || { printf "${RED}'unzip' is required but could not be installed.${NC}\n"; return 1; }
        rm -rf "$dest"; mkdir -p "$dest"
        local zip="${dest}/chrome.zip"
        if ! curl -fSL --max-time 300 -o "$zip" "$url"; then
            printf "${RED}Download failed — is ${version} a real Chrome-for-Testing version?${NC}\n"
            printf "  ${DIM}Browse available versions: https://googlechromelabs.github.io/chrome-for-testing/${NC}\n"
            rm -rf "$dest"; return 1
        fi
        if ! unzip -q -o "$zip" -d "$dest"; then
            printf "${RED}Failed to unzip the download.${NC}\n"; rm -rf "$dest"; return 1
        fi
        rm -f "$zip"
        local bin; bin="$(cft_binary_in "$dest" "$platform")"
        if [[ ! -f "$bin" ]]; then
            printf "${RED}Chrome binary not found in the extracted archive.${NC}\n"; return 1
        fi
        chmod +x "$bin" 2>/dev/null || true
        # macOS: strip the quarantine bit so it launches without a Gatekeeper prompt.
        [[ "$(uname -s)" == "Darwin" ]] && xattr -dr com.apple.quarantine "$dest" 2>/dev/null || true
        persist_chrome_path "$bin"
    }

    install_from_url() {
        local url="$1"
        local tmp; tmp="$(mktemp -d)"
        local file="${tmp}/$(basename "${url%%\?*}")"
        printf "${CYAN}Downloading ${url}…${NC}\n"
        if ! curl -fSL --max-time 300 -o "$file" "$url"; then
            printf "${RED}Download failed.${NC}\n"; rm -rf "$tmp"; return 1
        fi
        case "$file" in
            *.deb)
                printf "${CYAN}Installing .deb…${NC}\n"
                # `apt-get install ./file.deb` resolves dependencies (apt ≥1.1);
                # update first so a stale cache doesn't 404 on dep fetches.
                $sudo apt-get update -y >/dev/null 2>&1 || true
                $sudo apt-get install -y "$file" || { $sudo dpkg -i "$file"; $sudo apt-get -f install -y; }
                ;;
            *.rpm)
                printf "${CYAN}Installing .rpm…${NC}\n"
                $sudo dnf install -y "$file" || $sudo rpm -i "$file"
                ;;
            *.zip)
                # Assume a Chrome-for-Testing-style zip: extract per-user and point at its chrome.
                ensure_unzip || { printf "${RED}'unzip' is required but could not be installed.${NC}\n"; rm -rf "$tmp"; return 1; }
                local dest="${cft_dir}/from-url-$(date +%s 2>/dev/null || echo url)"
                rm -rf "$dest"; mkdir -p "$dest"
                unzip -q -o "$file" -d "$dest" || { printf "${RED}Unzip failed.${NC}\n"; rm -rf "$tmp" "$dest"; return 1; }
                local bin
                bin="$(find "$dest" -type f \( -name chrome -o -name 'Google Chrome*' -o -name chromium -o -name brave -o -name 'Microsoft Edge*' \) -perm -u+x 2>/dev/null | head -1)"
                [[ -z "$bin" ]] && bin="$(find "$dest" -type f -name chrome 2>/dev/null | head -1)"
                if [[ -z "$bin" ]]; then printf "${RED}No browser binary found in the zip.${NC}\n"; rm -rf "$tmp"; return 1; fi
                chmod +x "$bin" 2>/dev/null || true
                persist_chrome_path "$bin"
                ;;
            *.dmg)
                if [[ "$(uname -s)" != "Darwin" ]]; then printf "${RED}.dmg is macOS-only.${NC}\n"; rm -rf "$tmp"; return 1; fi
                printf "${CYAN}Mounting .dmg…${NC}\n"
                local mnt; mnt="$(hdiutil attach -nobrowse -readonly "$file" | grep -oE '/Volumes/[^ ]+' | head -1)"
                local app; app="$(find "$mnt" -maxdepth 1 -name '*.app' | head -1)"
                if [[ -z "$app" ]]; then printf "${RED}No .app in the dmg.${NC}\n"; hdiutil detach "$mnt" 2>/dev/null; rm -rf "$tmp"; return 1; fi
                cp -R "$app" /Applications/ && printf "${GREEN}Installed $(basename "$app") to /Applications.${NC}\n"
                hdiutil detach "$mnt" 2>/dev/null || true
                local bin="/Applications/$(basename "$app")/Contents/MacOS/$(basename "$app" .app)"
                [[ -f "$bin" ]] && persist_chrome_path "$bin"
                ;;
            *)
                printf "${RED}Unrecognized package type: ${file}. Supported: .deb .rpm .zip .dmg${NC}\n"
                rm -rf "$tmp"; return 1
                ;;
        esac
        local rc=$?
        rm -rf "$tmp"
        return $rc
    }

    # Install the latest system Google Chrome (self-updating), per-platform.
    # Clears any per-user CHROME_PATH override so the system browser is used.
    install_stable_system() {
        printf "${CYAN}Installing the latest system Google Chrome…${NC}\n"
        if [[ "$(uname -s)" == "Darwin" ]]; then
            command -v brew >/dev/null 2>&1 || { printf "${RED}Homebrew required on macOS.${NC}\n"; return 1; }
            brew install --cask google-chrome || return 1
        elif command -v apt >/dev/null 2>&1; then
            local deb; deb="$(mktemp).deb"
            curl -fSL --max-time 300 -o "$deb" "https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb" || { rm -f "$deb"; return 1; }
            # apt-get update first (fresh VMs have a stale cache that 404s on dep
            # fetches); `apt-get install ./deb` resolves Chrome's deps in one go.
            $sudo apt-get update -y >/dev/null 2>&1 || true
            $sudo apt-get install -y "$deb" || { $sudo dpkg -i "$deb"; $sudo apt-get -f install -y; }
            rm -f "$deb"
        elif command -v dnf >/dev/null 2>&1; then
            $sudo dnf install -y "https://dl.google.com/linux/direct/google-chrome-stable_current_$(uname -m).rpm" || return 1
        else
            printf "${RED}No supported package manager (apt/dnf/brew).${NC}\n"; return 1
        fi
        # Drop the override so chrome-finder falls back to the freshly-installed system Chrome.
        local uenv="${BB_CONFIG_DIR}/user.env"
        [[ -f "$uenv" ]] && { grep -v '^export CHROME_PATH=' "$uenv" > "${uenv}.tmp" 2>/dev/null; mv "${uenv}.tmp" "$uenv"; }
        printf "${GREEN}✓ System Google Chrome installed; CHROME_PATH override cleared.${NC}\n"
    }

    # Dispatch on the argument shape.
    if [[ "$arg" == "stable" || "$arg" == "latest" ]]; then
        install_stable_system
        return $?
    elif [[ "$arg" =~ ^https?:// ]]; then
        install_from_url "$arg"
        return $?
    elif [[ "$arg" =~ ^[0-9]+(\.[0-9]+){0,3}$ ]]; then
        local platform; platform="$(cft_platform)" || { printf "${RED}Unsupported OS for Chrome-for-Testing (use a <url> or BBX_BROWSER_PATH).${NC}\n"; return 1; }
        local full; full="$(resolve_cft_version "$arg")"
        if [[ -z "$full" ]]; then printf "${RED}Could not resolve version '${arg}' to a Chrome-for-Testing build.${NC}\n"; return 1; fi
        install_from_zip_cft "$full" "$platform"
        return $?
    else
        printf "${RED}Unrecognized argument '${arg}'.${NC} Expected a version (131), a URL, or 'stable'.\n"
        return 1
    fi
}

usage() {
    banner
    printf "${BLUE}\t\t\t\t Welcome to the ${CYAN}bbx${BLUE} CLI for BrowserBox!${NC}\n\n"
    printf "${BOLD}Usage:${NC}\n"
    printf "  bbx <command> [options]\n\n"

    printf "${BOLD}SETUP & MANAGEMENT${NC}\n"
    printf "  ${GREEN}uninstall${NC}      Remove all BrowserBox components.\n"
    printf "  ${GREEN}setup${NC}          Configure core options. ${BOLD}bbx setup [--port|-p <p>] [--hostname|-h <h>] [--token|-t <t>] [--zeta|-z] [--flipbook-record <dir>] [--flipbook-description <text>]${NC}\n"
    printf "  ${CYAN}activate${NC}       Activate a license for more users. ${BOLD}bbx activate [number_of_users]${NC}\n"
    printf "  ${GREEN}certify${NC}        Validate your current license status.\n"
    printf "  ${GREEN}update${NC}         Update BrowserBox to a specific or latest version. ${BOLD}bbx update [<version>|--latest-rc]${NC}\n"
    printf "  ${GREEN}use-chrome${NC}     Install a specific browser and use it. ${BOLD}bbx use-chrome <version|url|stable>${NC}\n"
    printf "  ${GREEN}status${NC}         Check the running status of BrowserBox.\n"
    printf '%b\n' "  ${GREEN}vacancy${NC}        Show the current license vacancy snapshot."
    printf "  ${GREEN}logs${NC}           View the logs for the BrowserBox service.\n\n"

    printf "${BOLD}CORE ACTIONS${NC}\n"
    printf "  ${GREEN}start${NC}           Start BrowserBox for the current user. ${BOLD}bbx start [--port|-p <port>] [--hostname|-h <hostname>]${NC}\n"
    printf "  ${GREEN}stop${NC}            Stop the BrowserBox instance for the current user.\n"
    printf "  ${GREEN}start-as${NC}        Run a new instance as a different OS user. ${BOLD}bbx start-as [--temporary] [username] [port]${NC}\n"
    printf "  ${GREEN}stop-user${NC}       Stop a BrowserBox instance for a specific user. ${BOLD}bbx stop-user <username> [delay_seconds]${NC}\n"
    printf "  ${GREEN}fleet${NC}           Allocate and release clean-slate BrowserBox sessions from a Linux user pool. ${BOLD}bbx fleet help${NC}\n\n"

    printf "${BOLD}CROSS-USER EXECUTION${NC}\n"
    printf "  ${CYAN}--for <user>${NC}    Run any supported command on behalf of another user.\n"
    printf "                  The operator provides privilege; the target user owns runtime.\n"
    printf "                  ${BOLD}bbx <command> --for <user> [args...]${NC}\n"
    printf "                  Supported: setup, start, stop, status, ng-start\n\n"

    printf "${BOLD}ADVANCED RUNNERS & TUNNELS${NC}\n"
    printf "  ${CYAN}cf-start${NC}        Run BrowserBox securely through a Cloudflare tunnel. ${BOLD}bbx cf-start [--port|-p <port>]${NC}\n"
    printf "  ${BLUE}zt-start${NC}        Expose BrowserBox on your ZeroTier network.\n"
    printf "  ${PURPLE}tor-start${NC}       Serve BrowserBox as a Tor hidden service. ${BOLD}bbx tor-start [--no-darkweb] [--no-onion]${NC}\n"
    printf "  ${GREEN}ng-start${NC}        Proxy BrowserBox with Nginx.\n"
    printf "  ${YELLOW}win9x-start${NC}     Run in Windows 9x compatibility mode.\n\n"

    printf "${BOLD}OTHER COMMANDS${NC}\n"
    printf "  ${BLUE}${BOLD}automate${NC}       Drive BrowserBox with scripts (coming soon).\n"
    printf "  ${GREEN}policy${NC}         Manage canonical policy bundle. ${BOLD}bbx policy <subcommand>${NC}\n"
    printf "  ${GREEN}--faq${NC}           Display frequently asked questions.\n"
    printf "  ${GREEN}--version${NC}       Show the version of the bbx CLI.\n"
    printf "  ${GREEN}--help${NC}          Show this help screen.\n\n"
    printf "  ${NC}bbx CLI version ${VERSION}  |  © DOSAYGO Corp 2018-2026${NC}\n"
}

show_policy_footer() {
    local baseline=""
    local color=""
    local label=""
    local desc=""
    
    # Check if browserbox supports policy command
    if command -v browserbox >/dev/null 2>&1; then
      local policy_output
      policy_output=$(browserbox policy get 2>&1)
      
      if echo "$policy_output" | grep -q "Unknown command\|not found\|unavailable"; then
        # Policy not supported in this version
        color="${RED}"
        label="unsupported"
        desc="policy not available in this BrowserBox version"
        printf "\n"
        printf "  ${color}■${NC} Policy: ${color}${label}${NC} — ${desc}\n"
        printf "    Update BrowserBox to enable policy controls: ${BOLD}bbx update${NC}\n\n"
        return
      fi
      
      # Extract baseline from policy output
      baseline=$(echo "$policy_output" | grep -o '"baselineId"[[:space:]]*:[[:space:]]*"[^"]*"' 2>/dev/null | sed 's/.*"\([^"]*\)"$/\1/' | head -1)
    else
      # browserbox not installed
      color="${YELLOW}"
      printf "\n"
      printf "  ${color}■${NC} Policy: ${color}not installed${NC} — install BrowserBox to enable policy controls\n\n"
      return
    fi
    
    # Determine color and label based on baseline
    if [[ "$baseline" == *"regulated"* ]]; then
      color="${PURPLE}"
      label="regulated"
      desc="navigation restricted, features locked"
    elif [[ "$baseline" == *"compat"* ]]; then
      color="${GREEN}"
      label="compat"
      desc="open navigation, all features enabled"
    elif [[ -n "$baseline" ]]; then
      color="${BLUE}"
      label="custom"
      desc="custom policy active"
    else
      color="${YELLOW}"
      label="no policy"
      desc="default allow-all"
    fi
    
    printf "\n"
    printf "  ${color}■${NC} Policy: ${color}${label}${NC} — ${desc}\n"
    printf "    Run ${BOLD}bbx policy${NC} to view or change what's allowed.\n\n"
}

faq() {
    printf "${BOLD}${CYAN}BrowserBox CLI - Frequently Asked Questions${NC}\n\n"

    printf "${BOLD}1) How do I run multiple BrowserBox instances?${NC}\n"
    printf "   First, ensure your license has enough seats for multiple users.\n"
    printf "   Then use the ${GREEN}start-as${NC} command to run a new instance under a different OS user.\n"
    printf "   Example: ${BOLD}bbx start-as browserbox_user2 8081${NC}\n"
    printf "   ${YELLOW}Important:${NC} Make sure the ports you specify for each instance are unique and do not overlap.\n\n"

    printf "${BOLD}2) How do I see whether a license seat is currently available?${NC}\n"
    printf '%b\n' "   Run ${BOLD}bbx vacancy${NC}. It queries the current license-server vacancy snapshot and prints any local reservation metadata."
    printf "   For full occupancy totals and current lease inventories, the license backend needs an explicit Amulet-side endpoint.\n\n"

    # Add more FAQs here as needed
    # printf "${BOLD}2) Another question?${NC}\n"
    # printf "   Answer to the other question.\n\n"
}

check_agreement() {
  if [[ -n "$BBX_TEST_AGREEMENT" ]]; then 
    if [ ! -f "$BB_CONFIG_DIR/.agreed" ]; then
      # Write a valid email-like string for test agreement so install.sh can pick it up
      echo "${EMAIL:-test@browserbox.io}" > "$BB_CONFIG_DIR/.agreed"
    fi
    return 0
  fi
  if [ ! -f "$BB_CONFIG_DIR/.agreed" ]; then
      printf "${BLUE}BrowserBox v15 Terms:${NC} https://dosaygo.com/terms.txt\n"
      printf "${BLUE}License:${NC} $REPO_URL/blob/${branch}/LICENSE.md\n"
      printf "${BLUE}Privacy:${NC} https://dosaygo.com/privacy.txt\n"
      read -r -p " Agree? (yes/no): " AGREE
      [ "$AGREE" = "yes" ] || { printf "${RED}ERROR: Must agree to terms!${NC}\n"; exit 1; }
      
      while true; do
        read -r -p " Enter your email address: " USER_EMAIL
        if [[ "$USER_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
           break
        else
           printf "${RED}Invalid email format. Please try again.${NC}\n"
        fi
      done

      mkdir -p "$BB_CONFIG_DIR"
      echo "$USER_EMAIL" > "$BB_CONFIG_DIR/.agreed"
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

# Library mode: expose functions to the test suite without running the
# agreement check, update check, or command dispatch.
if [[ -n "${BBX_LIB_MODE:-}" ]]; then
  return 0 2>/dev/null || exit 0
fi

# fleet handles the agreement itself (interactively at init; JSON-safe
# machine paths must not block on the interactive prompt).
[ "$1" != "uninstall" ] && [ "$1" != "fleet" ] && check_agreement
# Call check_and_prepare_update with the first argument
[ -n "$BBX_NO_UPDATE" ] || check_and_prepare_update "$1"

# Chrome guard: commands that launch BrowserBox require a browser
_needs_chrome() {
  case "$1" in
    run|start|restart|run-as|start-as|ng-run|ng-start|tor-run|tor-start|zt-run|zt-start|cf-run|cf-start|win9x-run|win9x-start)
      return 0 ;;
    *) return 1 ;;
  esac
}

_has_chrome() {
  if [[ -n "${CHROME_PATH:-}" && -x "${CHROME_PATH}" ]]; then
    return 0
  fi
  local candidates=(
    google-chrome-stable google-chrome chromium-browser chromium
    /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome
  )
  for c in "${candidates[@]}"; do
    command -v "$c" >/dev/null 2>&1 && return 0
  done
  return 1
}

if _needs_chrome "${1:-}"; then
  load_config
  if ! _has_chrome; then
    printf "${RED}Chrome/Chromium is not installed.${NC}\n"
    printf "BrowserBox requires a Chrome-family browser to run.\n"
    printf "Install it with:  ${BOLD}browserbox --full-install <hostname> <email>${NC}\n"
    exit 1
  fi
fi

case "$1" in
    install)
      printf "${YELLOW}Installation now uses the standalone installer:${NC}\n"
      printf "  ${BOLD}curl -fsSL https://browserbox.io/install.sh | bash${NC}\n"
      exit 0
      ;;
    uninstall) shift 1; uninstall "$@";;
    setup) shift 1; setup "$@";;
    certify) shift 1; certify "$@";;
    run|start) shift 1; run "$@";;
    restart) shift 1; restart "$@";;
    stop) shift 1; stop "$@";;
    stop-user) shift 1; stop_user "$@";;
    logs) shift 1; logs "$@";;
    update) shift 1; update "$@";;
    update-background) shift 1; update_background "$@";;
    use-chrome) shift 1; use_chrome "$@";;
    activate) shift 1; activate "$@";;
    status) shift 1; status "$@";;
    vacancy) shift 1; vacancy "$@";;
    run-as|start-as) shift 1; run_as "$@";;
    fleet) shift 1; fleet_main "$@";;
    help)
      shift 1
      case "${1:-}" in
        fleet) fleet_help;;
        *) usage;;
      esac
      ;;
    tor-run|tor-start) shift 1; banner_color=$PURPLE; tor_run "$@";;
    zt-run|zt-start) shift 1; banner_color=$BLUE; zt_run "$@";;
    cf-run|cf-start) shift 1; banner_color=$CYAN; cf_run "$@";;
    ng-run|ng-start) shift 1; banner_color=$GREEN; ng_run "$@";;
    # Docker commands intentionally disabled while BrowserBox is distributed
    # as a binary-first product. Keep the implementation above for a future re-enable.
    # docker-run|docker-start) shift 1; docker_run "$@";;
    # docker-stop) shift 1; docker_stop "$@";;
    win9x-run|win9x-start) shift 1; banner_color=$YELLOW; win9x_run "$@";;
    policy)
      shift 1
      if command -v bbpolicy >/dev/null 2>&1; then
        bbpolicy "$@"
      elif command -v browserbox >/dev/null 2>&1; then
        browserbox policy "$@"
      else
        printf "${RED}Policy command unavailable: install BrowserBox first.${NC}\n"
        exit 1
      fi
      ;;
    --version|-v) shift 1; version "$@";;
    --help|-h) shift 1; usage "$@";;
    --faq) shift 1; faq "$@";; 
    "") usage;;
    *) printf "${RED}Unknown command: $1${NC}\n"; usage; exit 1;;
esac

# Always show policy status footer (except for fleet, whose JSON
# stdout must stay clean and whose paths are non-interactive)
[[ -n "${BBX_SKIP_POLICY_FOOTER:-}" ]] || show_policy_footer
