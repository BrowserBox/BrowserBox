#!/usr/bin/env bash
set -euo pipefail

if [[ -n "${BBX_DEBUG:-}" ]]; then
  debug_user="${USER:-$(id -un)}"
  base_debug_dir="${TMPDIR:-/tmp}/bbx-install-debug-${debug_user}"
  job_name="${GITHUB_JOB:-install}"
  run_id="${GITHUB_RUN_ID:-local}"
  run_attempt="${GITHUB_RUN_ATTEMPT:-1}"

  sanitize_debug_label() {
    local label="${1:-unknown}"
    label="${label//\/\/-}"
    label="${label//:/\-}"
    label="${label// /\-}"
    label="$(printf '%s' "$label" | tr '[:upper:]' '[:lower:]')"
    label="$(printf '%s' "$label" | tr -cd 'a-z0-9._-')"
    if [[ -z "$label" ]]; then
      label="unknown"
    fi
    printf '%s' "$label"
  }

  detect_os_label() {
    local os_label="${RUNNER_OS:-$(uname -s)}"
    os_label="$(printf '%s' "$os_label" | tr '[:upper:]' '[:lower:]')"
    if [[ "$os_label" == "darwin" || "$os_label" == "macos" ]]; then
      printf '%s' "macos"
      return
    fi
    if [[ "$os_label" == "linux" ]]; then
      if [[ -r /etc/os-release ]]; then
        local os_id os_ver
        # shellcheck disable=SC1091
        os_id="$(. /etc/os-release; echo "${ID:-linux}")"
        # shellcheck disable=SC1091
        os_ver="$(. /etc/os-release; echo "${VERSION_ID:-}")"
        os_id="$(sanitize_debug_label "$os_id")"
        os_ver="$(printf '%s' "$os_ver" | tr -cd '0-9.')"
        if [[ -n "$os_ver" ]]; then
          printf '%s' "${os_id}${os_ver}"
        else
          printf '%s' "${os_id}"
        fi
        return
      fi
    fi
    printf '%s' "$(sanitize_debug_label "$os_label")"
  }

  if [[ -n "${BBX_DEBUG_OS_LABEL:-}" ]]; then
    runner_os="$(sanitize_debug_label "$BBX_DEBUG_OS_LABEL")"
  else
    runner_os="$(detect_os_label)"
  fi

  os_debug_dir="${base_debug_dir}/${runner_os}"
  debug_dir="${os_debug_dir}/${job_name}-${run_id}-${run_attempt}"
  mkdir -p "$os_debug_dir"
  chmod 1777 "$base_debug_dir" 2>/dev/null || true
  chmod 1777 "$os_debug_dir" 2>/dev/null || true
  rm -rf "$debug_dir"
  mkdir -p "$debug_dir"
  debug_log="${debug_dir}/install.log"
  exec > >(tee -a "$debug_log") 2>&1
  set -x
  echo "Installer debug logging enabled. Log: ${debug_log}" >&2
fi

usage() {
  cat <<'USAGE'
BrowserBox installer (non-Windows)

Usage:
  install.sh [--yes|-y] [--help]

Environment overrides:
  BBX_RELEASE_REPO   GitHub repo for releases (default: BrowserBox/BrowserBox)
  BBX_RELEASE_TAG    Pin a specific release tag (e.g., v15.9.4)
  GH_TOKEN/GITHUB_TOKEN  GitHub token for private/internal repos
  BBX_NO_UPDATE      Skip release lookups (requires BBX_RELEASE_TAG)
  BBX_FULL_INSTALL   Force --full-install
  BBX_HOSTNAME       Hostname for --full-install
  EMAIL              Email for --full-install (Required for terms agreement)
  BBX_INSTALL_USER   Non-root install user when running as root
  BBX_SUDOLESS       Set to 'true' to skip sudo usage (for Docker/Cloud Run)
USAGE
}

print_non_interactive_help() {
  echo "----------------------------------------------------------------" >&2
  echo "BrowserBox Non-Interactive Install Helper" >&2
  echo "----------------------------------------------------------------" >&2
  echo "It appears you are running the installer in a non-interactive" >&2
  echo "environment (e.g. CI/CD or piped script) without all required" >&2
  echo "environment variables." >&2
  echo "" >&2
  echo "REQUIRED VARIABLES:" >&2
  
  if [[ "$(id -u)" -eq 0 ]]; then
    echo "  BBX_INSTALL_USER  : System username to own the installation (CANNOT be root)" >&2
  fi
  
  echo "  EMAIL             : Email address for Let's Encrypt / Terms Agreement" >&2
  echo "" >&2
  echo "OPTIONAL VARIABLES:" >&2
  echo "  BBX_HOSTNAME      : Domain name (Defaults to system hostname)" >&2
  echo "  BBX_FULL_INSTALL  : Set to 'true' to force a full reinstall" >&2
  echo "" >&2
  echo "EXAMPLE usage:" >&2
  local ex_user=""
  if [[ "$(id -u)" -eq 0 ]]; then
    ex_user="BBX_INSTALL_USER=ubuntu "
  fi
  echo "  export ${ex_user}EMAIL=me@example.com" >&2
  echo "  curl -fsSL https://browserbox.io/install.sh | bash" >&2
  echo "----------------------------------------------------------------" >&2
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

# Prefer GH_TOKEN if provided; fall back to GITHUB_TOKEN for convenience.
if [[ -z "${GH_TOKEN:-}" && -n "${GITHUB_TOKEN:-}" ]]; then
  GH_TOKEN="$GITHUB_TOKEN"
fi

script_source="${BASH_SOURCE[0]:-$0}"
script_source_base="$(basename "$script_source")"
case "$script_source_base" in
  bash|sh|dash|ksh|zsh|ash)
    script_source=""
    ;;
esac
if [[ -z "$script_source" || "$script_source" == "-" || "$script_source" == "/dev/stdin" || "$script_source" == "/proc/self/fd/0" ]]; then
  script_source=""
fi
if [[ -n "$script_source" && ! -f "$script_source" ]]; then
  script_source=""
fi
if [[ -z "$script_source" ]]; then
  install_script_url="${BBX_INSTALL_SCRIPT_URL:-https://browserbox.io/install.sh}"
  temp_script="$(mktemp "${TMPDIR:-/tmp}/bbx-install-script.XXXX")"
  curl -fsSL "$install_script_url" -o "$temp_script"
  chmod 644 "$temp_script"
  script_source="$temp_script"
fi
script_dir="$(cd "$(dirname "$script_source")" && pwd)"
script_path="${script_dir}/$(basename "$script_source")"

maybe_load_gh_token_from_gh() {
  if [[ -n "${GH_TOKEN:-}" ]]; then
    return 0
  fi
  if ! command -v gh >/dev/null 2>&1; then
    return 0
  fi

  local repo_root
  repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
  if [[ -z "$repo_root" ]]; then
    return 0
  fi

  if [[ "$script_path" != "$repo_root/deploy-scripts/install.sh" ]]; then
    return 0
  fi

  local token
  token="$(gh auth token 2>/dev/null || true)"
  if [[ -n "$token" ]]; then
    GH_TOKEN="$token"
    if [[ -z "${GITHUB_TOKEN:-}" ]]; then
      GITHUB_TOKEN="$token"
    fi
  fi
}

maybe_load_gh_token_from_gh

BBX_RELEASE_REPO="${BBX_RELEASE_REPO:-BrowserBox/BrowserBox}"

INTEGRITY_PUBLIC_KEY_PEM='-----BEGIN PUBLIC KEY-----
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
-----END PUBLIC KEY-----'

is_truthy() {
  case "${1:-}" in
    1|true|TRUE|yes|YES|y|Y|on|ON) return 0 ;;
    *) return 1 ;;
  esac
}

is_interactive() {
  if [[ -t 0 && -t 1 ]]; then
    return 0
  fi
  if [[ -c /dev/tty ]]; then
    return 0
  fi
  return 1
}

prompt_input() {
  local prompt="$1"
  local output_var_name="$2"
  
  if [[ -t 0 ]]; then
    read -r -p "$prompt" "${output_var_name?}"
  elif [[ -c /dev/tty ]]; then
    # Read from /dev/tty if stdin is not a TTY (e.g. pipe)
    read -r -p "$prompt" "${output_var_name?}" < /dev/tty
  else
    return 1
  fi
}

ensure_user_exists() {
  local user="$1"
  if id "$user" >/dev/null 2>&1; then
    return 0
  fi

  local os
  os="$(uname -s)"
  if [[ "$os" == "Darwin" ]]; then
    echo "User '$user' does not exist. Please create it manually on macOS." >&2
    return 1
  fi

  if command -v useradd >/dev/null 2>&1; then
    useradd -m -s /bin/bash "$user"
  elif command -v adduser >/dev/null 2>&1; then
    adduser --disabled-password --gecos "" "$user"
  else
    echo "Unable to create user '$user' (useradd/adduser not found)." >&2
    return 1
  fi
  return 0
}

ensure_sudo_group() {
  local user="$1"
  if command -v getent >/dev/null 2>&1; then
    if getent group sudo >/dev/null 2>&1; then
      usermod -aG sudo "$user" 2>/dev/null || true
      return 0
    fi
    if getent group wheel >/dev/null 2>&1; then
      usermod -aG wheel "$user" 2>/dev/null || true
      return 0
    fi
  fi
  return 0
}

configure_passwordless_sudo() {
  local user="$1"
  local sudoers_file="/etc/sudoers.d/99-browserbox-${user}"
  
  if [[ -f "$sudoers_file" ]]; then
    return 0
  fi

  echo "Configuring passwordless sudo for $user..." >&2
  
  # Ensure the directory exists
  if [[ ! -d "/etc/sudoers.d" ]]; then
    mkdir -p /etc/sudoers.d
    chmod 755 /etc/sudoers.d
  fi
  
  # Write the configuration
  echo "${user} ALL=(ALL) NOPASSWD:ALL" > "$sudoers_file"
  
  # Ensure correct permissions (security requirement for sudoers)
  chmod 0440 "$sudoers_file"
}

handoff_env_args() {
  local keys=(
    BBX_RELEASE_REPO
    BBX_RELEASE_TAG
    GH_TOKEN
    GITHUB_TOKEN
    BBX_NO_UPDATE
    BBX_FULL_INSTALL
    BBX_HOSTNAME
    EMAIL
    BBX_TEST_AGREEMENT
    BBX_INSTALL_USER
    BBX_SUDOLESS
  )
  HANDOFF_ENV=()
  for key in "${keys[@]}"; do
    if [[ -n "${!key:-}" ]]; then
      HANDOFF_ENV+=("${key}=${!key}")
    fi
  done
}

# Skip root handoff if BBX_SUDOLESS is set (for Docker, Cloud Run, etc.)
if [[ "${BBX_SUDOLESS:-false}" != "true" ]] && [[ "$(id -u)" -eq 0 && -z "${BBX_ROOT_HANDOFF_DONE:-}" ]]; then
  install_user="${BBX_INSTALL_USER:-}"
  if [[ -z "$install_user" ]]; then
    if ! is_interactive; then
      print_non_interactive_help
      echo "Error: Running as root requires BBX_INSTALL_USER to be set." >&2
      exit 1
    fi
    prompt_input "Install as which non-root user? " install_user
  fi

  if [[ -z "$install_user" ]]; then
    echo "No install user provided. Aborting." >&2
    exit 1
  fi

  ensure_user_exists "$install_user" || exit 1
  ensure_sudo_group "$install_user" || true
  
  # FIX: Configure passwordless sudo using safe /etc/sudoers.d method
  configure_passwordless_sudo "$install_user" || true

  export BBX_ROOT_HANDOFF_DONE=1
  export BBX_INSTALL_USER="$install_user"

  if command -v sudo >/dev/null 2>&1; then
    handoff_env_args
    exec sudo -u "$install_user" -H env BBX_ROOT_HANDOFF_DONE=1 "${HANDOFF_ENV[@]}" bash "$script_source" "$@"
  fi

  if command -v su >/dev/null 2>&1; then
    arg_line=""
    for arg in "$@"; do
      arg_line+=" $(printf '%q' "$arg")"
    done
    handoff_env_args
    env_line="$(printf '%q ' "${HANDOFF_ENV[@]}")"
    exec su - "$install_user" -c "env BBX_ROOT_HANDOFF_DONE=1 ${env_line} bash $(printf '%q' "$script_source")${arg_line}"
  fi

  echo "Unable to switch to user '$install_user' (sudo/su not available)." >&2
  exit 1
fi

SKIP_PROMPT_VAR=""
release_json=""

# NOTE: The --yes flag is intentionally not used to bypass the binary's prompt.
# We set BBX_TEST_AGREEMENT=true if the user agrees in this script.
if [[ "${1:-}" == "--yes" || "${1:-}" == "-y" ]]; then
  export BBX_TEST_AGREEMENT=true
  shift
fi

# ----------------------------------------------------------------------
# Dependency Management & Installation Helpers
# ----------------------------------------------------------------------

attempt_install_package() {
  local pkg="$1"
  local cmd_prefix=""

  # Determine if we need sudo
  # Skip sudo if BBX_SUDOLESS is set (for Docker, Cloud Run, etc.)
  if [[ "${BBX_SUDOLESS:-false}" != "true" ]] && [[ "$(id -u)" -ne 0 ]]; then
    if command -v sudo >/dev/null 2>&1; then
      cmd_prefix="sudo -E"
    else
      echo "Warning: Not root and sudo not found. Cannot auto-install $pkg." >&2
      return 1
    fi
  fi

  echo "Attempting to install missing dependency: $pkg..." >&2

  # macOS (Homebrew)
  if [[ "$(uname -s)" == "Darwin" ]]; then
    if command -v brew >/dev/null 2>&1; then
      # brew install is usually interactive-safe, but we ensure no updates block it
      brew install "$pkg" || return 1
      return 0
    else
      echo "Homebrew not found. Cannot install $pkg on macOS." >&2
      return 1
    fi
  fi

  # Linux Package Managers
  if command -v apt-get >/dev/null 2>&1; then
    # Debian / Ubuntu
    # We try to update quietly first to ensure package lists aren't stale
    $cmd_prefix apt-get update -qq >/dev/null 2>&1 || true
    $cmd_prefix apt-get install -y "$pkg"
  elif command -v apk >/dev/null 2>&1; then
    # Alpine
    $cmd_prefix apk add --no-cache "$pkg"
  elif command -v dnf >/dev/null 2>&1; then
    # Fedora / RHEL 8+
    $cmd_prefix dnf install -y "$pkg"
  elif command -v yum >/dev/null 2>&1; then
    # RHEL 7 / CentOS
    $cmd_prefix yum install -y "$pkg"
  elif command -v pacman >/dev/null 2>&1; then
    # Arch Linux
    $cmd_prefix pacman -Sy --noconfirm "$pkg"
  elif command -v zypper >/dev/null 2>&1; then
    # openSUSE
    $cmd_prefix zypper install -n "$pkg"
  else
    echo "No supported package manager found. Cannot install $pkg." >&2
    return 1
  fi
}

require_cmd() {
  local cmd="$1"
  local pkg="${2:-$1}" # Allow specifying a package name different from the command

  if command -v "$cmd" >/dev/null 2>&1; then
    return 0
  fi

  attempt_install_package "$pkg"

  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: Missing required command: $cmd (failed to install package: $pkg)" >&2
    exit 1
  fi
}

require_tool_or_python() {
  local tool="$1"
  local pkg="${2:-$1}"

  # 1. Check if tool exists
  if command -v "$tool" >/dev/null 2>&1; then
    return 0
  fi

  # 2. Try to install the tool (e.g., install 'jq')
  if attempt_install_package "$pkg"; then
    if command -v "$tool" >/dev/null 2>&1; then
      return 0
    fi
  fi

  # 3. Check for Python fallback
  if command -v python3 >/dev/null 2>&1 || command -v python >/dev/null 2>&1; then
    return 0
  fi

  # 4. Try to install Python3
  echo "Command '$tool' missing and Python fallback missing." >&2
  if attempt_install_package "python3"; then
    if command -v python3 >/dev/null 2>&1; then
      return 0
    fi
  fi

  # 5. Final attempt for 'python' (some older distros)
  if attempt_install_package "python"; then
    if command -v python >/dev/null 2>&1; then
      return 0
    fi
  fi

  echo "Error: Missing required command: $tool" >&2
  echo "       Could not install '$pkg' and could not find or install a Python fallback." >&2
  exit 1
}

# Ensure base tools are present or installed
require_cmd curl
require_cmd openssl

# jq: Try to install 'jq'. If fail, ensure 'python3' is available.
require_tool_or_python jq jq

# xxd: Try to install 'xxd'. If fail, ensure 'python3' is available.
# Note: 'xxd' is often in 'vim-common' or 'xxd' package depending on distro.
# We try 'xxd' first as it's the most common package name for the standalone tool.
require_tool_or_python xxd xxd

hex_to_bin() {
  local hex_file="$1"
  local bin_file="$2"
  if command -v xxd >/dev/null 2>&1; then
    xxd -r -p "$hex_file" > "$bin_file"
    return 0
  fi
  if command -v python3 >/dev/null 2>&1; then
    python3 - "$hex_file" "$bin_file" <<'PY'
import binascii,sys
with open(sys.argv[1], 'r', encoding='utf-8') as f:
    data = f.read().strip()
with open(sys.argv[2], 'wb') as out:
    out.write(binascii.unhexlify(data))
PY
    return 0
  fi
  if command -v python >/dev/null 2>&1; then
    python - "$hex_file" "$bin_file" <<'PY'
import binascii,sys
with open(sys.argv[1], 'r') as f:
    data = f.read().strip()
with open(sys.argv[2], 'wb') as out:
    out.write(binascii.unhexlify(data))
PY
    return 0
  fi
  echo "Unable to decode signature hex (need xxd or python)." >&2
  return 1
}

verify_manifest_signature() {
  echo "Verifying release manifest signature..." >&2
  local manifest_path="$1"
  local sig_path="$2"
  local work_dir="$3"
  local key_path="$work_dir/integrity_root.pem"
  local sig_bin="$work_dir/manifest.sig.bin"
  local payload="$work_dir/manifest.payload"

  printf '%s\n' "$INTEGRITY_PUBLIC_KEY_PEM" > "$key_path"

  printf 'INTEGRITY/RELEASE_MANIFEST/v1\0' > "$payload"
  cat "$manifest_path" >> "$payload"
  hex_to_bin "$sig_path" "$sig_bin"

  if ! openssl dgst -sha256 -verify "$key_path" -signature "$sig_bin" "$payload" >/dev/null 2>&1; then
    echo "Release manifest signature verification failed." >&2
    return 1
  fi
}

extract_tag_name() {
  if command -v jq >/dev/null 2>&1; then
    jq -r '.tag_name // empty' 2>/dev/null
    return 0
  fi
  if command -v python3 >/dev/null 2>&1; then
    python3 - <<'PY'
import json,sys
try:
  data=json.load(sys.stdin)
  print(data.get('tag_name') or '')
except:
  pass
PY
    return 0
  fi
  if command -v python >/dev/null 2>&1; then
    python - <<'PY'
import json,sys
try:
  data=json.load(sys.stdin)
  print(data.get('tag_name') or '')
except:
  pass
PY
    return 0
  fi
}

get_latest_release_tag() {
  if [[ -n "${BBX_NO_UPDATE:-}" ]]; then
    if [[ -n "${BBX_RELEASE_TAG:-}" ]]; then
      echo "$BBX_RELEASE_TAG"
      return 0
    fi
    echo "BBX_NO_UPDATE is set; provide BBX_RELEASE_TAG to continue." >&2
    exit 1
  fi

  local api_url="https://api.github.com/repos/${BBX_RELEASE_REPO}/releases/latest"
  local auth=()
  if [[ -n "${GH_TOKEN:-}" ]]; then
    auth=(-H "Authorization: Bearer ${GH_TOKEN}")
  fi

  local response
  response=$(curl -sS --connect-timeout 10 "${auth[@]}" "$api_url" || true)
  local tag
  tag=$(printf '%s' "$response" | extract_tag_name)

  if [[ -z "$tag" ]]; then
    echo "Failed to fetch latest release tag from ${BBX_RELEASE_REPO}." >&2
    exit 1
  fi
  echo "$tag"
}

fetch_release_json() {
  local tag="$1"
  local auth_header=()
  if [[ -n "${GH_TOKEN:-}" ]]; then
    auth_header=(-H "Authorization: Bearer ${GH_TOKEN}")
  fi

  local json
  json=$(curl -sS --fail "${auth_header[@]}" "https://api.github.com/repos/${BBX_RELEASE_REPO}/releases/tags/${tag}" 2>/dev/null || true)
  if [[ -z "$json" && -n "${GH_TOKEN:-}" ]]; then
    json=$(curl -sS --fail "${auth_header[@]}" "https://api.github.com/repos/${BBX_RELEASE_REPO}/releases" 2>/dev/null || true)
  fi
  printf '%s' "$json"
}

extract_asset_id() {
  local asset_name="$1"
  if command -v jq >/dev/null 2>&1; then
    jq -r --arg name "$asset_name" '.assets[] | select(.name==$name) | .id' 2>/dev/null | head -n1
    return 0
  fi

  if command -v python3 >/dev/null 2>&1; then
    python3 - "$asset_name" <<'PY'
import json,sys
name=sys.argv[1]
try:
  data=json.load(sys.stdin)
except Exception:
  print('')
  sys.exit(0)
assets=data.get('assets',[])
for asset in assets:
  if asset.get('name')==name:
    print(asset.get('id',''))
    break
PY
    return 0
  fi

  if command -v python >/dev/null 2>&1; then
    python - "$asset_name" <<'PY'
import json,sys
name=sys.argv[1]
try:
  data=json.load(sys.stdin)
except Exception:
  print('')
  sys.exit(0)
assets=data.get('assets',[])
for asset in assets:
  if asset.get('name')==name:
    print(asset.get('id',''))
    break
PY
    return 0
  fi

  awk -v name="$asset_name" ' 
    BEGIN{RS="{";FS=","}
    {
      has=0;id=""
      for(i=1;i<=NF;i++){
        if($i ~ "\"name\"" && $i ~ name){has=1}
        if($i ~ "\"id\""){gsub(/[^0-9]/,"",$i); id=$i}
      }
      if(has && id!=""){print id; exit}
    }'
}

download_release_asset() {
  local tag="$1"
  local asset_name="$2"
  local out_path="$3"

  if [[ -z "$out_path" ]]; then
    echo "Download path is empty; cannot write release asset." >&2
    exit 1
  fi
  if [[ -d "$out_path" ]]; then
    echo "Download path '$out_path' is a directory; cannot write release asset." >&2
    exit 1
  fi
  mkdir -p "$(dirname "$out_path")"

  if [[ -n "${GH_TOKEN:-}" || "$BBX_RELEASE_REPO" != "BrowserBox/BrowserBox" ]]; then
    if [[ -z "${GH_TOKEN:-}" ]]; then
      echo "GH_TOKEN/GITHUB_TOKEN is required to download from ${BBX_RELEASE_REPO}." >&2
      exit 1
    fi

    if [[ -z "${release_json:-}" ]]; then
        release_json="$(fetch_release_json "$tag")"
    fi

    if [[ -z "$release_json" ]]; then
      echo "Failed to fetch release metadata for ${tag}." >&2
      exit 1
    fi

    local asset_id
    asset_id=$(printf '%s' "$release_json" | extract_asset_id "$asset_name")
    if [[ -z "$asset_id" || "$asset_id" == "null" ]]; then
      echo "Asset ${asset_name} not found on release ${tag}." >&2
      exit 1
    fi

    # Retry loop for HTTP errors (curl --retry doesn't retry on HTTP 500)
    local max_attempts=3
    local attempt=1
    while [[ $attempt -le $max_attempts ]]; do
      if curl -L --fail --progress-bar --connect-timeout 60 --retry 3 --retry-delay 2 \
        -H "Authorization: Bearer ${GH_TOKEN}" \
        -H "Accept: application/octet-stream" \
        -o "$out_path" "https://api.github.com/repos/${BBX_RELEASE_REPO}/releases/assets/${asset_id}"; then
        return 0
      fi
      echo "Download attempt $attempt failed, retrying in 2s..." >&2
      sleep 2
      ((attempt++))
    done
    echo "Failed to download asset after $max_attempts attempts." >&2
    return 1
  fi

  local url="https://github.com/${BBX_RELEASE_REPO}/releases/download/${tag}/${asset_name}"
  # Retry loop for HTTP errors
  local max_attempts=3
  local attempt=1
  while [[ $attempt -le $max_attempts ]]; do
    if curl -L --fail --progress-bar --connect-timeout 60 --retry 3 --retry-delay 2 -o "$out_path" "$url"; then
      return 0
    fi
    echo "Download attempt $attempt failed, retrying in 2s..." >&2
    sleep 2
    ((attempt++))
  done
  echo "Failed to download asset after $max_attempts attempts." >&2
  return 1
}

hash_file() {
  local path="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$path" | awk '{print $1}'
    return 0
  fi
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$path" | awk '{print $1}'
    return 0
  fi
  if command -v openssl >/dev/null 2>&1; then
    openssl dgst -sha256 "$path" | awk '{print $2}'
    return 0
  fi
  echo "Unable to compute SHA-256 (sha256sum/shasum/openssl missing)." >&2
  return 1
}

manifest_get_value() {
  local manifest_path="$1"
  local expr="$2"
  if command -v jq >/dev/null 2>&1; then
    jq -r "$expr" "$manifest_path" 2>/dev/null
    return 0
  fi
  if command -v python3 >/dev/null 2>&1; then
    python3 - "$manifest_path" "$expr" <<'PY'
import json,sys
path=sys.argv[1]
expr=sys.argv[2]
with open(path,'r',encoding='utf-8') as f:
  data=json.load(f)
# Only supports the exact expressions used in this script.
if expr.startswith('.artifacts['):
  key=expr.split('["',1)[1].split('"]',1)[0]
  rest=expr.split('].',1)[1]
  entry=data.get('artifacts',{}).get(key,{})
  print(entry.get(rest,'') or '')
  sys.exit(0)
if expr == '.install.fullInstallRequired':
  val=data.get('install',{}).get('fullInstallRequired', False)
  print('true' if val else 'false')
  sys.exit(0)
if expr == '.full_install_required':
  val=data.get('full_install_required', False)
  print('true' if val else 'false')
  sys.exit(0)
print('')
PY
    return 0
  fi
  if command -v python >/dev/null 2>&1; then
    python - "$manifest_path" "$expr" <<'PY'
import json,sys
path=sys.argv[1]
expr=sys.argv[2]
with open(path,'r') as f:
  data=json.load(f)
if expr.startswith('.artifacts['):
  key=expr.split('["',1)[1].split('"]',1)[0]
  rest=expr.split('].',1)[1]
  entry=data.get('artifacts',{}).get(key,{})
  print(entry.get(rest,'') or '')
  sys.exit(0)
if expr == '.install.fullInstallRequired':
  val=data.get('install',{}).get('fullInstallRequired', False)
  print('true' if val else 'false')
  sys.exit(0)
if expr == '.full_install_required':
  val=data.get('full_install_required', False)
  print('true' if val else 'false')
  sys.exit(0)
print('')
PY
    return 0
  fi
  echo ""  # fallback
}

resolve_platform() {
  case "$(uname -s)" in
    Linux) echo "linux" ;;
    Darwin) echo "darwin" ;;
    *)
      echo "Unsupported OS: $(uname -s)" >&2
      exit 1
      ;;
  esac
}

resolve_arch() {
  local arch
  arch="$(uname -m)"
  case "$arch" in
    x86_64|amd64) echo "x64" ;;
    arm64|aarch64) echo "arm64" ;;
    *) echo "$arch" ;;
  esac
}

platform="$(resolve_platform)"
arch="$(resolve_arch)"
artifact_key="${platform}-${arch}"

if [[ "$artifact_key" == "darwin-x64" ]]; then
  echo "macOS x64 is not supported by current releases." >&2
  exit 1
fi

if [[ "$artifact_key" != "linux-x64" && "$artifact_key" != "darwin-arm64" ]]; then
  echo "Unsupported platform: ${artifact_key}" >&2
  exit 1
fi

release_tag="${BBX_RELEASE_TAG:-}"
if [[ -z "$release_tag" ]]; then
  release_tag="$(get_latest_release_tag)"
fi

work_dir="$(mktemp -d "${TMPDIR:-/tmp}/bbx-install.XXXX")"
trap 'rm -rf "$work_dir"' EXIT

manifest_path="$work_dir/release.manifest.json"
manifest_sig_path="$work_dir/release.manifest.json.sig"

echo "Downloading release manifest..." >&2
download_release_asset "$release_tag" "release.manifest.json" "$manifest_path"
echo "Downloading release manifest signature..." >&2
download_release_asset "$release_tag" "release.manifest.json.sig" "$manifest_sig_path"

verify_manifest_signature "$manifest_path" "$manifest_sig_path" "$work_dir"

asset_name="$(manifest_get_value "$manifest_path" ".artifacts[\"$artifact_key\"].fileName")"
asset_sha="$(manifest_get_value "$manifest_path" ".artifacts[\"$artifact_key\"].sha256")"

if [[ -z "$asset_name" || "$asset_name" == "null" ]]; then
  echo "Release manifest missing artifact for ${artifact_key}." >&2
  exit 1
fi

temp_binary="$work_dir/${asset_name}"

# --- NEW LOCATION: Full Install Logic & Validation ---
full_install=false
if ! command -v browserbox >/dev/null 2>&1; then
  full_install=true
fi
if is_truthy "${BBX_FULL_INSTALL:-}"; then
  full_install=true
fi

manifest_full="$(manifest_get_value "$manifest_path" '.install.fullInstallRequired')"
legacy_full="$(manifest_get_value "$manifest_path" '.full_install_required')"
if [[ "$manifest_full" == "true" || "$legacy_full" == "true" ]]; then
  full_install=true
fi

config_dir="${HOME}/.config/dosaygo/bbpro"
if [[ -z "${BBX_HOSTNAME:-}" && -f "$config_dir/test.env" ]]; then
  BBX_HOSTNAME="$(sed -n 's/^DOMAIN=//p' "$config_dir/test.env" | tail -n1)"
fi

if [[ -z "${EMAIL:-}" && -f "$config_dir/.agreed" ]]; then
  agreed_val="$(tail -n1 "$config_dir/.agreed" | tr -d '\r' | tr -d '\n')"
  if [[ "$agreed_val" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
    EMAIL="$agreed_val"
  fi
fi

hostname_default="${BBX_HOSTNAME:-$(hostname)}"
email_value="${EMAIL:-}"

is_local_hostname() {
  case "$1" in
    localhost|127.0.0.1|::1) return 0 ;;
    *.local|*.test|*.example) return 0 ;;
    *) return 1 ;;
  esac
}

if [[ "$full_install" == "true" ]]; then
  if [[ -z "${BBX_HOSTNAME:-}" ]]; then
    if is_interactive; then
      prompt_input "Enter hostname (default: ${hostname_default}): " BBX_HOSTNAME
    fi
  fi
  BBX_HOSTNAME="${BBX_HOSTNAME:-$hostname_default}"

  # FIX: Email is now strictly required for full install
  if [[ -z "$email_value" ]]; then
    if is_interactive; then
      prompt_input "Enter your email for Let's Encrypt and BrowserBox terms agreement (required): " email_value
    fi
  fi

  if [[ -z "$email_value" ]]; then
    if ! is_interactive; then
      print_non_interactive_help
    fi
    echo "Error: Email is required for terms agreement and Let's Encrypt." >&2
    exit 1
  fi
  
  if [[ ! "$email_value" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
    if ! is_interactive; then
      print_non_interactive_help
    fi
    echo "Error: '$email_value' is not a valid email address." >&2
    exit 1
  fi
  
  # FIX: Handle terms agreement inside the script using /dev/tty
  # so we can export BBX_TEST_AGREEMENT=true, avoiding stdin pipe exhaustion.
  if [[ -z "${BBX_TEST_AGREEMENT:-}" ]]; then
     if is_interactive; then
        echo "" >&2
        echo "Before proceeding, please note:" >&2
        echo "  - A valid, purchased license is required for use." >&2
        echo "  - By installing, you agree to the terms available at https://dosaygo.com" >&2
        echo "  - Commercial use (including evaluation) requires a license." >&2
        echo "" >&2
        
        agreed_resp=""
        prompt_input "Do you agree to these terms and confirm a license for use? (yes/no): " agreed_resp
        if is_truthy "$agreed_resp"; then
           export BBX_TEST_AGREEMENT=true
        else
           echo "Terms not accepted. Aborting." >&2
           exit 1
        fi
     fi
  fi
fi
# --- END NEW LOCATION ---

echo "Downloading ${asset_name} (${release_tag})..." >&2
download_release_asset "$release_tag" "$asset_name" "$temp_binary"
chmod +x "$temp_binary"

if [[ -n "$asset_sha" ]]; then
  actual_sha="$(hash_file "$temp_binary")" || actual_sha=""
  if [[ -n "$actual_sha" && "$actual_sha" != "$asset_sha" ]]; then
    echo "SHA-256 mismatch for ${asset_name}." >&2
    exit 1
  fi
else
  echo "Release manifest missing sha256 for ${artifact_key}." >&2
  exit 1
fi

# Install manifest to a shared location for integrity checks.
manifest_target_dir="${HOME}/.config/dosaygo/bbpro"
if [[ -w "/usr/local/share" || "$(id -u)" -eq 0 ]]; then
  manifest_target_dir="/usr/local/share/dosaygo/bbpro"
fi
mkdir -p "$manifest_target_dir"
cp "$manifest_path" "$manifest_target_dir/release.manifest.json"
cp "$manifest_sig_path" "$manifest_target_dir/release.manifest.json.sig"
chmod 644 "$manifest_target_dir/release.manifest.json" "$manifest_target_dir/release.manifest.json.sig" 2>/dev/null || true

if [[ "$full_install" == "true" ]]; then
  echo "Running full install..." >&2
  # BBX_TEST_AGREEMENT environment variable is used instead of --yes
  "$temp_binary" --full-install "$BBX_HOSTNAME" "$email_value"
else
  echo "Running update install..." >&2
  "$temp_binary" --install
fi
