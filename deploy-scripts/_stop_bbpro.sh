#!/usr/bin/env bash

if [[ -n "${BBX_DEBUG}" ]]; then
  set -x
fi

if ! command -v nvm &>/dev/null && test -f ~/.nvm/nvm.sh; then
  source ~/.nvm/nvm.sh
fi

if command -v sudo &>/dev/null; then
  SUDO="sudo -n"
fi

# Determine Tor group and cookie file dynamically
if [[ "$(uname -s)" == "Darwin" ]]; then
    TOR_GROUP="admin"  # Homebrew default
    TORDIR="$(brew --prefix)/var/lib/tor"
    COOKIE_AUTH_FILE="$TORDIR/control_auth_cookie"
else
    TORDIR="/var/lib/tor"
    COOKIE_AUTH_FILE="$TORDIR/control_auth_cookie"
    TOR_GROUP=$(ls -ld "$TORDIR" | awk '{print $4}' 2>/dev/null)
    if [[ -z "$TOR_GROUP" || "$TOR_GROUP" == "root" ]]; then
      TOR_GROUP=$(getent group | grep -E 'tor|debian-tor|toranon' | cut -d: -f1 | head -n1)
    fi
    if [[ -z "$TOR_GROUP" ]]; then
      TOR_GROUP="${TOR_GROUP:-debian-tor}"  # Allow env override
      printf "${YELLOW}Warning: Could not detect Tor group. Using default: $TOR_GROUP. Set TOR_GROUP env var if incorrect.${NC}\n"
    fi
fi

# Ensure pm2 is available
command -v pm2 &>/dev/null || npm i -g pm2@latest

# Stop main process with a headsup in case pm2 rushes the shutdown
# because we need to ensure our shutdown tasks like releasing license occur
bpid="$(pgrep -x browserbox -u "$(whoami)")"
if [[ -n "$bpid" ]]; then
  kill -HUP $bpid
fi

pm2 delete run-docspark
pm2 delete devtools-server
pm2 delete start_audio

sleep 1

pm2 stop basic-bb-main-service 

sleep 1

pm2 delete basic-bb-main-service
pm2 save --force

# Kill pm2 if no processes are running
if [[ "$(pm2 jlist)" == "[]" ]] || ! timeout 5s pm2 jlist; then
  pm2 kill
  pkill pm2
fi

kill_chrome() {
  # Loop through all the pid files for Chrome processes
  for pidf in "$HOME/.config/dosyago/bbpro/chrome-"*/pid; do
    pid="$(cat "$pidf")"
    killtree "$pid" || kill "$pid"
    rm -f "$pidf"
  done
  # don't just randomly kill all chromes if this is set
  if [[ -n "${BBX_DONT_KILL_CHROME_ON_STOP}" ]]; then
    return 0
  fi
  pkill -i chrome
}

pkill -u "$(whoami)" browserbox*

kill_chrome
pulseaudio -k

# Check if the login link is an onion address and torbb.env exists
login_link_file="$HOME/.config/dosyago/bbpro/login.link"
torbb_env_file="$HOME/.config/dosyago/bbpro/torbb.env"

if [[ -f "$login_link_file" && -f "$torbb_env_file" ]]; then
  login_link=$(cat "$login_link_file")

  if command -v ufw &>/dev/null || sudo bash -c 'command -v ufw' &>/dev/null; then
    $SUDO ufw disable
  fi
  
  if [[ "$login_link" == *.onion* ]]; then
    echo "Detected onion address in login link: $login_link"
    
    # Check if user is already in TOR_GROUP
    user="$(whoami)"
    in_tor_group=false
    if id | grep -qw "$TOR_GROUP"; then
      in_tor_group=true
      echo "User $user already in group $TOR_GROUP"
    elif ! command -v sg >/dev/null 2>&1; then
      echo "sg not found and $user not in $TOR_GROUP, attempting cleanup with sudo fallback"
    else
      echo "Using sg to run cleanup in $TOR_GROUP context"
    fi
    
    # Define the cleanup script for direct execution
    cleanup_script() {
      # Load env (expects TORDIR, ADDR_* vars, etc.)
      source "$torbb_env_file"

      # --- Helpers ---------------------------------------------------------------

      # Find a timeout shim: GNU coreutils 'timeout' (Linux), or 'gtimeout' (macOS via brew)
      _timeout_cmd=""  # empty means "don't wrap"
      if command -v timeout >/dev/null 2>&1; then
        _timeout_cmd="timeout"
      elif command -v gtimeout >/dev/null 2>&1; then
        _timeout_cmd="gtimeout"
      fi

      # Detect nc features across BSD/GNU/Nmap variants
      _nc="${NC_PATH:-nc}"
      if ! command -v "$_nc" >/dev/null 2>&1; then
        echo "Error: 'nc' (netcat) is required." >&2
        return 1
      fi
      _nc_help="$("$_nc" -h 2>&1 || true)"
      _nc_has_flag() { printf '%s' "$_nc_help" | grep -qE "(^|[[:space:]-])$1([[:space:]]|,|$)"; }
      # Prefer -N (OpenBSD/macOS) else -q 0 (GNU), else no EOF flag
      _nc_eof_flag=""
      if _nc_has_flag "-N"; then
        _nc_eof_flag="-N"
      elif printf '%s' "$_nc_help" | grep -q -- "-q"; then
        _nc_eof_flag="-q 0"
      fi
      # Prepare timeout options: prefer external timeout; else nc -w if available
      NC_TIMEOUT="${NC_TIMEOUT:-5}"   # seconds; override via env
      _nc_time_prefix=()              # external timeout wrapper
      _nc_time_flag=()                # internal nc timeout flag
      if [[ -n "$_timeout_cmd" ]]; then
        _nc_time_prefix=("$_timeout_cmd" "$NC_TIMEOUT")
      elif printf '%s' "$_nc_help" | grep -q -- "-w"; then
        _nc_time_flag=("-w" "$NC_TIMEOUT")
      fi

      # Check if control port is actually listening
      control_port="${TOR_CONTROL_PORT:-9051}"
      _is_listening() {
        # Try lsof first
        if command -v lsof >/dev/null 2>&1; then
          # -nP to avoid DNS/servname; -sTCP:LISTEN to filter listening sockets
          if lsof -nP -iTCP:"$control_port" -sTCP:LISTEN 2>/dev/null | grep -q .; then
            return 0
          else
            return 1
          fi
        fi
        # Fallback to ss (modern Linux)
        if command -v ss >/dev/null 2>&1; then
          if ss -ltn 2>/dev/null | awk '{print $4}' | grep -E "(:|\.)${control_port}(\s|$)" >/dev/null; then
            return 0
          else
            return 1
          fi
        fi
        # Fallback to netstat (older systems)
        if command -v netstat >/dev/null 2>&1; then
          if netstat -an 2>/dev/null | grep -E "LISTEN|LISTENING" | grep -E "[:\.]${control_port}[[:space:]]" >/dev/null; then
            return 0
          else
            return 1
          fi
        fi
        # If we can’t verify, be conservative and say "not confirmed"
        return 1
      }

      # Read Tor control cookie as hex (try unprivileged, then with $SUDO)
      tor_cookie_hex=$(xxd -p "${TORDIR}/control_auth_cookie" 2>/dev/null || ${SUDO:-} xxd -p "${TORDIR}/control_auth_cookie" 2>/dev/null)
      tor_cookie_hex=$(echo "$tor_cookie_hex" | tr -d '\n')
      if [[ -z "$tor_cookie_hex" ]]; then
        echo "Could not read Tor control cookie (permissions?)." >&2
        return 1
      fi

      # Verify control port is listening before issuing DEL_ONION commands
      if ! _is_listening; then
        echo "Tor control port ${control_port} does not appear to be listening (lsof/ss/netstat check failed)." >&2
        return 1
      fi

      # --- Main ------------------------------------------------------------------
      # For each ADDR_* variable, compute service_id and send DEL_ONION over Tor control port
      # Note: We target localhost; adjust if your Tor control binds elsewhere.
      for var in $(compgen -A variable | grep "^ADDR_"); do
        onion_address="${!var}"
        [[ -z "$onion_address" ]] && continue
        service_id="${onion_address%.onion}"
        echo "Removing onion service: $service_id"

        control_command=$(printf 'AUTHENTICATE %s\r\nDEL_ONION %s\r\nQUIT\r\n' "$tor_cookie_hex" "$service_id")

        # Build the netcat invocation:
        # Optional external timeout, then nc with internal timeouts/EOF handling if available.
        if ! printf '%s' "$control_command" \
          | "${_nc_time_prefix[@]}" "$_nc" "${_nc_time_flag[@]}" $_nc_eof_flag localhost "$control_port" >/dev/null 2>&1
        then
          echo "Warning: netcat command to Tor control port failed for $service_id (may have timed out or refused)." >&2
          # Continue attempting to remove other onions rather than aborting the entire cleanup
          continue
        fi
      done
    }
    
    # Run cleanup based on group membership
    if $in_tor_group; then
      cleanup_script
    elif command -v sg >/dev/null 2>&1; then
      # Export variables needed in the heredoc
      export TORDIR SUDO torbb_env_file
      $SUDO -u ${SUDO_USER:-$USER} sg "$TOR_GROUP" -c "env TORDIR='$TORDIR' SUDO='$SUDO' torbb_env_file='$torbb_env_file' bash" << 'EOF'
source "$torbb_env_file"

# --- Config knobs (can override via env) --------------------------------------
control_port="${TOR_CONTROL_PORT:-9051}"
NC_TIMEOUT="${NC_TIMEOUT:-5}"   # seconds

# --- Find tools ---------------------------------------------------------------
# timeout wrapper: GNU 'timeout' (Linux) or 'gtimeout' (macOS via coreutils)
_timeout_cmd=""
if command -v timeout >/dev/null 2>&1; then
  _timeout_cmd="timeout"
elif command -v gtimeout >/dev/null 2>&1; then
  _timeout_cmd="gtimeout"
fi

# netcat flavor detection
_nc="${NC_PATH:-nc}"
if ! command -v "$_nc" >/dev/null 2>&1; then
  echo "Error: 'nc' (netcat) is required." >&2
  exit 1
fi
_nc_help="$("$_nc" -h 2>&1 || true)"
_nc_has_flag() { printf '%s' "$_nc_help" | grep -qE "(^|[[:space:]-])$1([[:space:]]|,|$)"; }

# Choose EOF flag: prefer -N (OpenBSD/macOS), else -q 0 (GNU), else none
_nc_eof_flag=""
if _nc_has_flag "-N"; then
  _nc_eof_flag="-N"
elif printf '%s' "$_nc_help" | grep -q -- "-q"; then
  _nc_eof_flag="-q 0"
fi

# Timeout strategy: external timeout wrapper if available, else nc -w
_nc_time_prefix=()
_nc_time_flag=()
if [[ -n "$_timeout_cmd" ]]; then
  _nc_time_prefix=("$_timeout_cmd" "$NC_TIMEOUT")
elif printf '%s' "$_nc_help" | grep -q -- "-w"; then
  _nc_time_flag=("-w" "$NC_TIMEOUT")
fi

# --- Listen check helpers -----------------------------------------------------
_is_listening() {
  # lsof (best across macOS/Linux)
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$control_port" -sTCP:LISTEN 2>/dev/null | grep -q .
    return $?
  fi
  # ss (modern Linux)
  if command -v ss >/dev/null 2>&1; then
    ss -ltn 2>/dev/null | awk '{print $4}' | grep -E "(:|\.)${control_port}(\s|$)" >/dev/null
    return $?
  fi
  # netstat (older systems)
  if command -v netstat >/dev/null 2>&1; then
    netstat -an 2>/dev/null | grep -E "LISTEN|LISTENING" | grep -E "[:\.]${control_port}[[:space:]]" >/dev/null
    return $?
  fi
  return 1
}

# --- Read Tor cookie ----------------------------------------------------------
tor_cookie_hex=$(xxd -p "${TORDIR}/control_auth_cookie" 2>/dev/null || ${SUDO:-} xxd -p "${TORDIR}/control_auth_cookie" 2>/dev/null)
tor_cookie_hex=$(echo "$tor_cookie_hex" | tr -d '\n')
if [[ -z "$tor_cookie_hex" ]]; then
  echo "Could not get Tor control cookie (permissions?)." >&2
  exit 1
fi

# --- Ensure control port is listening -----------------------------------------
if ! _is_listening; then
  echo "Tor control port ${control_port} does not appear to be listening." >&2
  exit 1
fi

# --- Delete onions listed in ADDR_* vars --------------------------------------
for var in $(compgen -A variable | grep "^ADDR_"); do
  onion_address="${!var}"
  [[ -z "$onion_address" ]] && continue
  service_id="${onion_address%.onion}"
  echo "Removing onion service: $service_id"

  control_command=$(printf 'AUTHENTICATE %s\r\nDEL_ONION %s\r\nQUIT\r\n' "$tor_cookie_hex" "$service_id")

  if ! printf '%s' "$control_command" \
      | "${_nc_time_prefix[@]}" "$_nc" "${_nc_time_flag[@]}" $_nc_eof_flag localhost "$control_port" >/dev/null 2>&1; then
    echo "Warning: control command failed or timed out for $service_id." >&2
    # continue with the next service instead of aborting
    continue
  fi
done
EOF
    else
      cleanup_script
    fi
    # Check exit status of last command
    [ $? -eq 0 ] || { printf "${RED}Failed to remove onion services${NC}\n"; exit 1; }
    rm -f "$torbb_env_file"
    rm -f "$login_link_file"
  else
    echo "No onion address detected in login link."
  fi
fi

echo "BrowserBox stopped."
exit 0
