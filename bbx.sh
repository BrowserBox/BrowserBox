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
# BrowserBox Binary Installer & Wrapper
# This script downloads and runs pre-compiled BrowserBox binaries
# from the public BrowserBox/BrowserBox repository.

set -euo pipefail

if [[ -n "${BBX_DEBUG:-}" ]]; then
  set -x
fi

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
CYAN='\033[1;36m'
NC='\033[0m'

# Protect Windows users
protecc_win_sysadmins() {
  # Check for Windows environments
  if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" || -n "$WINDIR" || "$(uname -s)" =~ ^MINGW || "$(uname -s)" =~ ^CYGWIN || -n "$WSL_DISTRO_NAME" ]]; then
    echo -e "${RED}⚠️  WARNING: You're on Windows! ⚠️${NC}"
    echo -e "${YELLOW}This Bash script (bbx) isn't meant for Windows sysadmins.${NC}"
    echo -e "Please use the native PowerShell install method instead:"
    echo -e "${GREEN}irm dosaygo.com/browserbox | iex${NC}"
    echo -e "Run this in PowerShell to get a Windows-friendly bbx setup."
    exit 1
  fi
}

protecc_win_sysadmins

# Configuration
PUBLIC_REPO="BrowserBox/BrowserBox"
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
  local repo="$1"
  local tag=""
  
  # Try using curl with GitHub API
  if command -v curl >/dev/null 2>&1; then
    local api_url="https://api.github.com/repos/${repo}/releases/latest"
    local response
    response=$(curl -sS --connect-timeout 10 "$api_url" 2>/dev/null || echo "")
    
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
  
  echo "$tag"
}

# Function to download the binary
download_binary() {
  local platform="$1"
  local tag="$2"
  local asset_name
  case "$platform" in
    macos) asset_name="browserbox-macos-bin" ;;
    linux) asset_name="browserbox-linux-bin" ;;
    *) echo -e "${RED}Unsupported platform: $platform${NC}" >&2; exit 1 ;;
  esac
  local download_url="https://github.com/${PUBLIC_REPO}/releases/download/${tag}/${asset_name}"
  local temp_file
  temp_file="$(mktemp "${TMPDIR:-/tmp}/browserbox.XXXX")"
  
  echo -e "${CYAN}Downloading BrowserBox ${tag} for ${platform}...${NC}"
  
  # Check if curl is available
  if ! command -v curl >/dev/null 2>&1; then
    echo -e "${RED}Error: curl is required but not installed.${NC}" >&2
    echo -e "Please install curl and try again." >&2
    exit 1
  fi
  
  if ! curl -L --fail --progress-bar --connect-timeout 30 -o "$temp_file" "$download_url" 2>&1; then
    echo -e "${RED}Failed to download binary from ${download_url}${NC}" >&2
    echo -e "${YELLOW}This could mean:${NC}" >&2
    echo -e "  - No release is available for ${platform}" >&2
    echo -e "  - Network connectivity issues" >&2
    echo -e "  - The release ${tag} doesn't have a ${asset_name} asset" >&2
    rm -f "$temp_file"
    exit 1
  fi
  
  if [[ ! -s "$temp_file" ]]; then
    echo -e "${RED}Downloaded file is empty${NC}" >&2
    rm -f "$temp_file"
    exit 1
  fi

  $INSTALL_CMD "$temp_file" "$BINARY_PATH"
  rm -f "$temp_file"
  
  echo -e "${GREEN}Successfully downloaded and installed BrowserBox binary${NC}"
  echo -e "${CYAN}Binary installed at: ${BINARY_PATH}${NC}"
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

# Function to ensure binary is installed
ensure_binary() {
  if ! binary_exists; then
    echo -e "${YELLOW}BrowserBox binary not found. Installing...${NC}"
    local platform
    platform=$(detect_platform)
    local tag
    tag=$(get_latest_release "$PUBLIC_REPO")
    download_binary "$platform" "$tag"
  fi
}

# Function to check for updates
check_update() {
  if binary_exists; then
    local current_version
    current_version=$(get_binary_version)
    
    # Don't check for updates if we can't get version
    if [[ "$current_version" == "unknown" ]] || [[ "$current_version" == "not_installed" ]]; then
      return
    fi
    
    # Get latest release
    local latest_tag
    latest_tag=$(get_latest_release "$PUBLIC_REPO" 2>/dev/null || echo "")
    
    if [[ -n "$latest_tag" ]] && [[ "$latest_tag" != "$current_version" ]]; then
      echo -e "${YELLOW}Note: A new version of BrowserBox is available: ${latest_tag}${NC}"
      echo -e "      Run 'bbx install' to update."
    fi
  fi
}

# Main execution logic
main() {
  local command="${1:-}"
  
  # Special case: install/update commands explicitly download/update the binary
  if [[ "$command" == "install" ]] || [[ "$command" == "update" ]]; then
    local platform
    platform=$(detect_platform)
    local tag
    tag=$(get_latest_release "$PUBLIC_REPO")
    download_binary "$platform" "$tag"
    
    # For install command, run the binary with --install flag
    if [[ "$command" == "install" ]]; then
      shift
      exec "$BINARY_PATH" --install "$@"
    else
      # For update, just report success
      echo -e "${GREEN}BrowserBox updated to ${tag}${NC}"
      exit 0
    fi
  fi
  
  # Special case: version flags
  if [[ "$command" == "--version" ]] || [[ "$command" == "-v" ]]; then
    ensure_binary
    exec "$BINARY_PATH" --version
  fi
  
  # Special case: help flags
  if [[ "$command" == "--help" ]] || [[ "$command" == "-h" ]] || [[ -z "$command" ]]; then
    ensure_binary
    exec "$BINARY_PATH" --help
  fi
  
  # For all other commands, ensure binary exists and pass through
  ensure_binary
  
  # Add binary directory to PATH if not already there
  if [[ ":$PATH:" != *":$BINARY_DIR:"* ]]; then
    export PATH="$BINARY_DIR:$PATH"
  fi
  
  # Optional: Check for updates (non-blocking)
  if [[ -z "${BBX_NO_UPDATE:-}" ]]; then
    check_update || true
  fi
  
  # Pass all arguments through to the binary
  exec "$BINARY_PATH" "$@"
}

# Run main with all arguments
main "$@"
