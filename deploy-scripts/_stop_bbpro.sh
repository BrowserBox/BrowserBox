#!/usr/bin/env bash

if [[ -n "${BBX_DEBUG}" ]]; then
  export BBX_DEBUG
  set -x
fi

# Colors (safe defaults)
RED=${RED:-$'\e[31m'}
YELLOW=${YELLOW:-$'\e[33m'}
NC=${NC:-$'\e[0m'}

if ! command -v nvm &>/dev/null && test -f ~/.nvm/nvm.sh; then
  # shellcheck disable=SC1090
  source ~/.nvm/nvm.sh
fi

SUDO=""
if command -v sudo &>/dev/null; then
  SUDO="sudo -n"
fi

# Determine Tor group and cookie file dynamically
if [[ "$(uname -s)" == "Darwin" ]]; then
    TOR_GROUP="admin"  # Homebrew default (often 'staff', but 'admin' is common in your env)
    TORDIR="$(brew --prefix)/var/lib/tor"
    COOKIE_AUTH_FILE="$TORDIR/control_auth_cookie"
else
    TORDIR="/var/lib/tor"
    COOKIE_AUTH_FILE="$TORDIR/control_auth_cookie"
    TOR_GROUP=$(ls -ld "$TORDIR" 2>/dev/null | awk '{print $4}' || true)
    if [[ -z "${TOR_GROUP:-}" || "$TOR_GROUP" == "root" ]]; then
      TOR_GROUP=$(getent group 2>/dev/null | grep -E '^(tor|debian-tor|toranon):' | cut -d: -f1 | head -n1 || true)
    fi
    if [[ -z "${TOR_GROUP:-}" ]]; then
      TOR_GROUP="${TOR_GROUP:-debian-tor}"  # Allow env override
      printf "${YELLOW}Warning: Could not detect Tor group. Using default: %s. Set TOR_GROUP env var if incorrect.${NC}\n" "$TOR_GROUP" >&2
    fi
fi

# Ensure pm2 is available
command -v pm2 &>/dev/null || npm i -g pm2@latest

# Stop main process with a heads-up: we want license release etc. to run
bpid="$(pgrep -x browserbox -u "$(whoami)" || true)"
if [[ -n "$bpid" ]]; then
  kill -HUP "$bpid" || true
fi

pm2 delete run-docspark    || true
pm2 delete devtools-server || true
pm2 delete start_audio     || true

sleep 1
pm2 stop basic-bb-main-service || true
sleep 1
pm2 delete basic-bb-main-service || true
pm2 save --force || true

# Kill pm2 if no processes are running (or pm2 is wedged)
if [[ "$(pm2 jlist || echo '[]')" == "[]" ]] || ! timeout 5s pm2 jlist; then
  pm2 kill || true
  pkill pm2 || true
fi

kill_chrome() {
  # Loop through all the pid files for Chrome processes
  shopt -s nullglob
  for pidf in "$HOME/.config/dosyago/bbpro/chrome-"*/pid; do
    if [[ -f "$pidf" ]]; then
      pid="$(cat "$pidf" 2>/dev/null || true)"
      if [[ -n "$pid" ]]; then
        command -v killtree &>/dev/null && killtree "$pid" || kill "$pid" || true
      fi
      rm -f "$pidf"
    fi
  done
  # don't just randomly kill all chromes if this is set
  if [[ -n "${BBX_DONT_KILL_CHROME_ON_STOP:-}" ]]; then
    return 0
  fi
  pkill -i chrome || true
}

pkill -u "$(whoami)" 'browserbox.*' || true

kill_chrome
pulseaudio -k || true

# Files we use for onion teardown + cert cleanup
login_link_file="$HOME/.config/dosyago/bbpro/login.link"
torbb_env_file="$HOME/.config/dosyago/bbpro/torbb.env"

# Helper: nc timeout/EOF handling + listen check + DEL_ONION + cert cleanup
cleanup_script() {
  # Load env (expects ADDR_*, SSLCERTS_DIR, etc.)
  # shellcheck disable=SC1090
  source "$torbb_env_file"

  # ---- Config / Paths --------------------------------------------------------
  control_port="${TOR_CONTROL_PORT:-9051}"
  NC_TIMEOUT="${NC_TIMEOUT:-5}"        # seconds
  # If SSLCERTS_DIR is absolute, use it; else treat as $HOME/<dir>
  _certs_root="${SSLCERTS_DIR:-tor-sslcerts}"
  if [[ "${_certs_root}" != /* ]]; then
    _certs_root="${HOME}/${_certs_root}"
  fi

  # ---- Timeout / nc flags ----------------------------------------------------
  _timeout_cmd=""
  if command -v timeout >/dev/null 2>&1; then
    _timeout_cmd="timeout"
  elif command -v gtimeout >/dev/null 2>&1; then
    _timeout_cmd="gtimeout"
  fi

  _nc="${NC_PATH:-nc}"
  if ! command -v "$_nc" >/dev/null 2>&1; then
    echo "Error: 'nc' (netcat) is required." >&2
    return 1
  fi
  _nc_help="$("$_nc" -h 2>&1 || true)"
  _nc_has_flag() { printf '%s' "$_nc_help" | grep -qE "(^|[[:space:]-])$1([[:space:]]|,|$)"; }

  _nc_eof_flag=""
  if _nc_has_flag "-N"; then
    _nc_eof_flag="-N"
  elif printf '%s' "$_nc_help" | grep -q -- "-q"; then
    _nc_eof_flag="-q 0"
  fi

  _nc_time_prefix=()
  _nc_time_flag=()
  if [[ -n "$_timeout_cmd" ]]; then
    _nc_time_prefix=("$_timeout_cmd" "$NC_TIMEOUT")
  elif printf '%s' "$_nc_help" | grep -q -- "-w"; then
    _nc_time_flag=("-w" "$NC_TIMEOUT")
  fi

  # ---- Listen check ----------------------------------------------------------
  _is_listening() {
    if command -v lsof >/dev/null 2>&1; then
      lsof -nP -iTCP:"$control_port" -sTCP:LISTEN 2>/dev/null | grep -q .
      return $?
    fi
    if command -v ss >/dev/null 2>&1; then
      ss -ltn 2>/dev/null | awk '{print $4}' | grep -E "(:|\.)${control_port}(\s|$)" >/dev/null
      return $?
    fi
    if command -v netstat >/dev/null 2>&1; then
      netstat -an 2>/dev/null | grep -E "LISTEN|LISTENING" | grep -E "[:\.]${control_port}[[:space:]]" >/dev/null
      return $?
    fi
    return 1
  }

  # ---- Tor cookie ------------------------------------------------------------
  tor_cookie_hex=$(xxd -p "${TORDIR}/control_auth_cookie" 2>/dev/null || ${SUDO:-} xxd -p "${TORDIR}/control_auth_cookie" 2>/dev/null)
  tor_cookie_hex=$(echo "$tor_cookie_hex" | tr -d '\n')
  if [[ -z "$tor_cookie_hex" ]]; then
    echo "Could not read Tor control cookie (permissions?)." >&2
    return 1
  fi

  if ! _is_listening; then
    echo "Tor control port ${control_port} does not appear to be listening." >&2
    # We still attempt cert cleanup, but DEL_ONION commands will be skipped
  fi

  # ---- Collect all onion addresses first (so we can also delete certs) -------
  mapfile -t _onions < <(compgen -A variable | grep '^ADDR_' | while read -r v; do printf '%s\n' "${!v}"; done | sed '/^$/d')

  # ---- DEL_ONION loop --------------------------------------------------------
  for onion_address in "${_onions[@]:-}"; do
    [[ -z "$onion_address" ]] && continue
    service_id="${onion_address%.onion}"
    echo "Removing onion service: $service_id"

    control_command=$(printf 'AUTHENTICATE %s\r\nDEL_ONION %s\r\nQUIT\r\n' "$tor_cookie_hex" "$service_id")

    if _is_listening; then
      if ! printf '%s' "$control_command" \
        | "${_nc_time_prefix[@]}" "$_nc" "${_nc_time_flag[@]}" $_nc_eof_flag localhost "$control_port" >/dev/null 2>&1
      then
        echo "Warning: netcat control command failed/timed out for $service_id." >&2
      fi
    else
      echo "Skipping DEL_ONION for $service_id (control port not listening)." >&2
    fi
  done

  # ---- TLS certs cleanup for each onion -------------------------------------
  for onion_address in "${_onions[@]:-}"; do
    [[ -z "$onion_address" ]] && continue
    cert_dir="$_certs_root/$onion_address"
    if [[ -d "$cert_dir" ]]; then
      echo "Removing TLS cert directory: $cert_dir"
      rm -rf -- "$cert_dir" || echo "Warning: failed to remove $cert_dir" >&2
    fi
  done
}

# Stop firewall if we enabled it earlier (best-effort)
disable_firewall_if_present() {
  if command -v ufw &>/dev/null || $SUDO bash -c 'command -v ufw' &>/dev/null; then
    $SUDO ufw disable || true
  fi
}

# -----------------------------
# Main teardown flow
# -----------------------------

if [[ -f "$login_link_file" && -f "$torbb_env_file" ]]; then
  login_link="$(cat "$login_link_file")"

  disable_firewall_if_present

  if [[ "$login_link" == *.onion* ]]; then
    echo "Detected onion address in login link: $login_link"

    user="$(whoami)"
    in_tor_group=false
    if id | grep -qw "$TOR_GROUP"; then
      in_tor_group=true
      echo "User $user already in group $TOR_GROUP" >&2
    elif ! command -v sg >/dev/null 2>&1; then
      echo "sg not found and $user not in $TOR_GROUP; attempting cleanup with sudo fallback" >&2
    else
      echo "Using sg to run cleanup in $TOR_GROUP context" >&2
    fi

    if $in_tor_group; then
      cleanup_script
    elif command -v sg >/dev/null 2>&1; then
      # Export variables needed in the heredoc
      export TORDIR SUDO torbb_env_file
      $SUDO -u ${SUDO_USER:-$USER} sg "$TOR_GROUP" -c "env TORDIR='$TORDIR' SUDO='$SUDO' torbb_env_file='$torbb_env_file' bash" << 'EOF'
set -euo pipefail
# shellcheck disable=SC1090
source "$torbb_env_file"

control_port="${TOR_CONTROL_PORT:-9051}"
NC_TIMEOUT="${NC_TIMEOUT:-5}"
_certs_root="${SSLCERTS_DIR:-tor-sslcerts}"
if [[ "${_certs_root}" != /* ]]; then _certs_root="${HOME}/${_certs_root}"; fi

_timeout_cmd=""
if command -v timeout >/dev/null 2>&1; then
  _timeout_cmd="timeout"
elif command -v gtimeout >/dev/null 2>&1; then
  _timeout_cmd="gtimeout"
fi

_nc="${NC_PATH:-nc}"
if ! command -v "$_nc" >/dev/null 2>&1; then
  echo "Error: 'nc' (netcat) is required." >&2
  exit 1
fi
_nc_help="$("$_nc" -h 2>&1 || true)"
_nc_has_flag() { printf '%s' "$_nc_help" | grep -qE "(^|[[:space:]-])$1([[:space:]]|,|$)"; }

_nc_eof_flag=""
if _nc_has_flag "-N"; then
  _nc_eof_flag="-N"
elif printf '%s' "$_nc_help" | grep -q -- "-q"; then
  _nc_eof_flag="-q 0"
fi

_nc_time_prefix=()
_nc_time_flag=()
if [[ -n "$_timeout_cmd" ]]; then
  _nc_time_prefix=("$_timeout_cmd" "$NC_TIMEOUT")
elif printf '%s' "$_nc_help" | grep -q -- "-w"; then
  _nc_time_flag=("-w" "$NC_TIMEOUT")
fi

_is_listening() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$control_port" -sTCP:LISTEN 2>/dev/null | grep -q .
    return $?
  fi
  if command -v ss >/dev/null 2>&1; then
    ss -ltn 2>/dev/null | awk '{print $4}' | grep -E "(:|\.)${control_port}(\s|$)" >/dev/null
    return $?
  fi
  if command -v netstat >/dev/null 2>&1; then
    netstat -an 2>/dev/null | grep -E "LISTEN|LISTENING" | grep -E "[:\.]${control_port}[[:space:]]" >/dev/null
    return $?
  fi
  return 1
}

tor_cookie_hex=$(xxd -p "${TORDIR}/control_auth_cookie" 2>/dev/null || ${SUDO:-} xxd -p "${TORDIR}/control_auth_cookie" 2>/dev/null)
tor_cookie_hex=$(echo "$tor_cookie_hex" | tr -d '\n')
if [[ -z "$tor_cookie_hex" ]]; then
  echo "Could not get Tor control cookie (permissions?)." >&2
  exit 1
fi

# Gather onions up front (for DEL_ONION and cert removal)
mapfile -t _onions < <(compgen -A variable | grep '^ADDR_' | while read -r v; do printf '%s\n' "${!v}"; done | sed '/^$/d')

if _is_listening; then
  for onion_address in "${_onions[@]:-}"; do
    [[ -z "$onion_address" ]] && continue
    service_id="${onion_address%.onion}"
    echo "Removing onion service: $service_id"
    control_command=$(printf 'AUTHENTICATE %s\r\nDEL_ONION %s\r\nQUIT\r\n' "$tor_cookie_hex" "$service_id")
    if ! printf '%s' "$control_command" \
        | "${_nc_time_prefix[@]}" "$_nc" "${_nc_time_flag[@]}" $_nc_eof_flag localhost "$control_port" >/dev/null 2>&1; then
      echo "Warning: control command failed or timed out for $service_id." >&2
    fi
  done
else
  echo "Tor control port ${control_port} is not listening; skipping DEL_ONION." >&2
fi

# Remove TLS cert directories
for onion_address in "${_onions[@]:-}"; do
  [[ -z "$onion_address" ]] && continue
  cert_dir="$_certs_root/$onion_address"
  if [[ -d "$cert_dir" ]]; then
    echo "Removing TLS cert directory: $cert_dir"
    rm -rf -- "$cert_dir" || echo "Warning: failed to remove $cert_dir" >&2
  fi
done
EOF
    else
      cleanup_script
    fi

    # Check exit status of last command
    echo "Onion teardown + cert cleanup complete." >&2
    rm -f "$torbb_env_file" || true
    rm -f "$login_link_file" || true
  else
    echo "No onion address detected in login link." >&2
  fi
fi

echo "BrowserBox stopped."
exit 0

