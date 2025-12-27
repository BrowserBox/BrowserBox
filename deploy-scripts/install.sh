#!/usr/bin/env bash
set -euo pipefail

cho() {
  echo "$@"
}

base_debug_dir="${TMPDIR:-/tmp}/bbx-install-debug"
runner_os="${RUNNER_OS:-$(uname -s)}"
job_name="${GITHUB_JOB:-install}"
run_id="${GITHUB_RUN_ID:-local}"
run_attempt="${GITHUB_RUN_ATTEMPT:-1}"
debug_dir="${base_debug_dir}/${runner_os}/${job_name}-${run_id}-${run_attempt}"
rm -rf "$debug_dir"
mkdir -p "$debug_dir"
debug_log="${debug_dir}/install.log"
debug_xtrace="${debug_dir}/xtrace.log"
exec > >(tee -a "$debug_log") 2>&1
exec 5>>"$debug_xtrace"
BASH_XTRACEFD=5
set -x
echo "Installer debug logging enabled. Logs: ${debug_log}, xtrace: ${debug_xtrace}" >&2

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
  EMAIL              Email for --full-install (LetsEncrypt)
  BBX_INSTALL_USER   Non-root install user when running as root
USAGE
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
  [[ -t 0 && -t 1 ]]
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
    BBX_INSTALL_USER
  )
  HANDOFF_ENV=()
  for key in "${keys[@]}"; do
    if [[ -n "${!key:-}" ]]; then
      HANDOFF_ENV+=("${key}=${!key}")
    fi
  done
}

if [[ "$(id -u)" -eq 0 && -z "${BBX_ROOT_HANDOFF_DONE:-}" ]]; then
  install_user="${BBX_INSTALL_USER:-}"
  if [[ -z "$install_user" ]]; then
    if ! is_interactive; then
      echo "Running as root requires BBX_INSTALL_USER to be set." >&2
      exit 1
    fi
    read -r -p "Install as which non-root user? " install_user
  fi

  if [[ -z "$install_user" ]]; then
    echo "No install user provided. Aborting." >&2
    exit 1
  fi

  ensure_user_exists "$install_user" || exit 1
  ensure_sudo_group "$install_user" || true

  export BBX_ROOT_HANDOFF_DONE=1
  export BBX_INSTALL_USER="$install_user"

  if command -v sudo >/dev/null 2>&1; then
    handoff_env_args
    exec sudo -u "$install_user" -H env BBX_ROOT_HANDOFF_DONE=1 "${HANDOFF_ENV[@]}" bash "$0" "$@"
  fi

  if command -v su >/dev/null 2>&1; then
    arg_line=""
    for arg in "$@"; do
      arg_line+=" $(printf '%q' "$arg")"
    done
    handoff_env_args
    env_line="$(printf '%q ' "${HANDOFF_ENV[@]}")"
    exec su - "$install_user" -c "env BBX_ROOT_HANDOFF_DONE=1 ${env_line} bash $(printf '%q' "$0")${arg_line}"
  fi

  echo "Unable to switch to user '$install_user' (sudo/su not available)." >&2
  exit 1
fi

YES_FLAG=""
if [[ "${1:-}" == "--yes" || "${1:-}" == "-y" ]]; then
  YES_FLAG="--yes"
  shift
fi

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_cmd curl
require_cmd openssl
require_cmd jq
require_cmd xxd

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
  tag=$(printf '%s' "$response" | jq -r '.tag_name // empty' 2>/dev/null)

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
        if($i ~ "\\\"name\\\"" && $i ~ name){has=1}
        if($i ~ "\\\"id\\\""){gsub(/[^0-9]/,"",$i); id=$i}
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

    local release_json
    release_json="$(fetch_release_json "$tag")"
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

    curl -L --fail --progress-bar --connect-timeout 60 \
      -H "Authorization: Bearer ${GH_TOKEN}" \
      -H "Accept: application/octet-stream" \
      -o "$out_path" "https://api.github.com/repos/${BBX_RELEASE_REPO}/releases/assets/${asset_id}"
    return 0
  fi

  local url="https://github.com/${BBX_RELEASE_REPO}/releases/download/${tag}/${asset_name}"
  curl -L --fail --progress-bar --connect-timeout 60 -o "$out_path" "$url"
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
download_release_asset "$release_tag" "release.manifest.json.sig" "$manifest_sig_path"

verify_manifest_signature "$manifest_path" "$manifest_sig_path" "$work_dir"

asset_name="$(manifest_get_value "$manifest_path" ".artifacts[\"$artifact_key\"].fileName")"
asset_sha="$(manifest_get_value "$manifest_path" ".artifacts[\"$artifact_key\"].sha256")"

if [[ -z "$asset_name" || "$asset_name" == "null" ]]; then
  echo "Release manifest missing artifact for ${artifact_key}." >&2
  exit 1
fi

temp_binary="$work_dir/${asset_name}"

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
  EMAIL="$(tail -n1 "$config_dir/.agreed" | tr -d '\r' | tr -d '\n')"
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
      read -r -p "Enter hostname (default: ${hostname_default}): " BBX_HOSTNAME
    fi
  fi
  BBX_HOSTNAME="${BBX_HOSTNAME:-$hostname_default}"

  if [[ -z "$email_value" ]]; then
    if is_interactive; then
      local_notice="required"
      if is_local_hostname "$BBX_HOSTNAME"; then
        local_notice="optional"
      fi
      read -r -p "Enter your email for Let's Encrypt (${local_notice}): " email_value
    fi
  fi

  if ! is_local_hostname "$BBX_HOSTNAME" && [[ -z "$email_value" ]]; then
    echo "Email is required for a public hostname." >&2
    exit 1
  fi

  echo "Running full install..." >&2
  "$temp_binary" --full-install "$BBX_HOSTNAME" "$email_value" ${YES_FLAG}
else
  echo "Running update install..." >&2
  "$temp_binary" --install
fi

echo "BrowserBox install complete." >&2
