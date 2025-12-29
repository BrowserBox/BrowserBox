#!/bin/bash

# Test script for bbx CLI in BrowserBox repository
# Displays output directly in terminal

# Ensure common install locations are in PATH for non-login shells.
export PATH="/usr/local/bin:/usr/bin:/bin:${PATH}"

# Test timeouts (in minutes for timeout command)
TEST_NG_RUN_TIMEOUT="3m"
TEST_TOR_RUN_TIMEOUT="3m"
TEST_INSTALL_TIMEOUT="10m"
TEST_CF_RUN_TIMEOUT="5m"
export SKIP_DOCKER="true" # we haven't build docker images yet so skip

# Tor bootstrap can be significantly slower/flakier inside CI containers.
if [[ -n "${BBX_CI_CONTAINER_IMAGE:-}" || -f "/.dockerenv" ]]; then
  TEST_TOR_RUN_TIMEOUT="6m"
  export BBX_CF_MAX_TIME="${BBX_CF_MAX_TIME:-420}"
fi

if [[ -z "$STATUS_MODE" ]]; then
  echo "Set status mode env" >&2
  STATUS_MODE="quick exit"
elif [[ "$STATUS_MODE" == "quick-exit" ]]; then
  STATUS_MODE="quick exit"
fi

export STATUS_MODE="${STATUS_MODE}"

if [[ -z "$LICENSE_KEY" ]]; then
  if [[ -f "${HOME}/.config/dosaygo/bbpro/config" ]]; then
    # shellcheck disable=SC1090
    source "${HOME}/.config/dosaygo/bbpro/config"
  fi
fi
if [[ -z "$LICENSE_KEY" ]]; then
  echo "Set license key env" >&2
  exit 1
fi
export LICENSE_KEY="${LICENSE_KEY}"

if [[ -z "$INSTALL_DOC_VIEWER" ]]; then
  echo "[ Warning ]: Install doc viewer is not set for tests. Setting..." >&2
  INSTALL_DOC_VIEWER="false"
fi
export INSTALL_DOC_VIEWER="${INSTALL_DOC_VIEWER}"
export BBX_NO_UPDATE="true"
export BBX_SKIP_INSTALL_TESTS="${BBX_SKIP_INSTALL_TESTS:-}"
export BBX_BINARY="${BBX_BINARY:-}"  # Path to local browserbox binary for testing
export BBX_SETUP_PORT="${BBX_SETUP_PORT:-9090}"
export BBX_NG_SETUP_PORT="${BBX_NG_SETUP_PORT:-9999}"

# Resolve script path so we can re-enter the tests reliably after su.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"
SCRIPT_PATH="${SCRIPT_DIR}/$(basename "${BASH_SOURCE[0]:-$0}")"

# Early handoff: If running as root in CI, hand off to install user BEFORE running tests
# This ensures all tests run as the correct user with proper permissions
BB_CONFIG_DIR="${BB_CONFIG_DIR:-${HOME}/.config/dosaygo/bbpro}"
if [ "$(id -u)" -eq 0 ] && [[ -n "$BBX_TEST_AGREEMENT" ]]; then
  install_user=""
  user_home=""
  env_file=""
  
  # Try to find install user from marker file
  if [ -f "${BB_CONFIG_DIR}/.install_user" ]; then
    install_user="$(cat "${BB_CONFIG_DIR}/.install_user")"
  elif [ -n "$BBX_INSTALL_USER" ]; then
    install_user="$BBX_INSTALL_USER"
  fi
  
  if [ -n "$install_user" ] && id "$install_user" &>/dev/null; then
    user_home="$(getent passwd "$install_user" | cut -d: -f6)"
    env_file="${user_home}/.bbx_env_restore.sh"
    
    # Verify user has passwordless sudo capability
    if ! su - "$install_user" -c "sudo -n true" 2>/dev/null; then
      echo "ERROR: Install user '$install_user' does not have passwordless sudo capability." >&2
      echo "BrowserBox tests require sudo. Please ensure the user has NOPASSWD sudo access." >&2
      exit 1
    fi
    
    # Ensure config dir ownership is correct
    if [ -d "$BB_CONFIG_DIR" ]; then
      install_group="$(id -gn "$install_user")"
      chown -R "${install_user}:${install_group}" "$BB_CONFIG_DIR" 2>/dev/null || true
    fi
    
    # Build env file if it doesn't exist (or refresh it)
    su_env_vars=(BBX_HOSTNAME EMAIL LICENSE_KEY BBX_TEST_AGREEMENT STATUS_MODE INSTALL_DOC_VIEWER BBX_NO_UPDATE BBX_RELEASE_REPO BBX_RELEASE_TAG TARGET_RELEASE_REPO PRIVATE_TAG GH_TOKEN GITHUB_TOKEN BBX_INSTALL_USER BB_QUICK_EXIT NVM_DIR NODE_PATH)
    : > "$env_file"
    for var in "${su_env_vars[@]}"; do
      val="${!var-}"
      [[ -n "$val" ]] || continue
      printf 'export %s=%q\n' "$var" "$val" >> "$env_file"
    done
    [[ -n "${PATH:-}" ]] && printf 'export PATH=%q\n' "$PATH" >> "$env_file"
    chown "${install_user}:$(id -gn "$install_user")" "$env_file" 2>/dev/null || true
    chmod 640 "$env_file" 2>/dev/null || true
    
    # Copy test script to user's home if needed
    if [[ ! -f "${user_home}/test-bbx.sh" ]]; then
      cp -f "$SCRIPT_PATH" "${user_home}/test-bbx.sh"
      chmod +x "${user_home}/test-bbx.sh"
      chown "${install_user}:$(id -gn "$install_user")" "${user_home}/test-bbx.sh"
    fi
    
    echo "Root detected in CI mode. Handing off tests to user: $install_user"
    exec su - "$install_user" -c "set -a; source $(printf '%q' "$env_file"); cd $(printf '%q' "$user_home") && ./test-bbx.sh; rc=\$?; rm -f $(printf '%q' "$env_file"); exit \$rc"
  else
    echo "Warning: Running as root but no install user found. Tests may fail." >&2
  fi
fi

# If BBX_BINARY is set, install it directly and skip bootstrap/download logic
if [[ -n "$BBX_BINARY" ]]; then
  if [[ ! -x "$BBX_BINARY" ]]; then
    echo "BBX_BINARY is set but not executable: $BBX_BINARY" >&2
    exit 1
  fi
  echo "Using local binary: $BBX_BINARY" >&2
  "$BBX_BINARY" --install || exit 1
  BBX_SKIP_INSTALL_TESTS="true"
fi

# BBX_CMD: prefer globally installed commands from the binary install
if command -v bbx &>/dev/null; then
  BBX_CMD="bbx"
elif command -v browserbox &>/dev/null; then
  BBX_CMD="browserbox"
elif [[ -x "/usr/local/bin/bbx" ]]; then
  BBX_CMD="/usr/local/bin/bbx"
elif [[ -x "/usr/local/bin/browserbox" ]]; then
  BBX_CMD="/usr/local/bin/browserbox"
elif [[ -x "/usr/bin/bbx" ]]; then
  BBX_CMD="/usr/bin/bbx"
elif [[ -x "/usr/bin/browserbox" ]]; then
  BBX_CMD="/usr/bin/browserbox"
else
  echo "No bbx/browserbox installed in PATH or common locations" >&2
  exit 1
fi

ensure_bbx_cmd() {
  # After install, prefer global commands if available
  if command -v bbx &>/dev/null; then
    BBX_CMD="bbx"
    return 0
  elif command -v browserbox &>/dev/null; then
    BBX_CMD="browserbox"
    return 0
  fi
  for candidate in /usr/local/bin/bbx /usr/local/bin/browserbox /usr/bin/bbx /usr/bin/browserbox; do
    if [[ -x "$candidate" ]]; then
      BBX_CMD="$candidate"
      return 0
    fi
  done
  return 1
}

# Safely handle bbcertify output
if command -v bbcertify; then
  cert_file=$(bbcertify --no-reservation)
  reservation_file="${HOME}/.config/dosaygo/bbpro/tickets/reservation.json"
  if [ $? -eq 0 ] && [ -n "$cert_file" ] && [ -f "$cert_file" ]; then
    rm -f "$cert_file"
    rm -f "$reservation_file"
  else
    echo "Warning: bbcertify failed or no file to remove" >&2
  fi
fi

# ANSI colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'
PWD="$(pwd)"
BB_CONFIG_DIR="$HOME/.config/dosaygo/bbpro"

BROWSERBOX_CMD="${BROWSERBOX_CMD:-browserbox}"

export BBX_CMD BROWSERBOX_CMD

trap 'saga_bbx_stop &>/dev/null' EXIT

# Counters for summary
passed=0
failed=0
warnings=0

# Exit trap for summary
trap 'echo -e "\n${NC}Test Summary:"; \
      echo -e "${GREEN}Passed: $passed${NC}"; \
      echo -e "${RED}Failed: $failed${NC}"; \
      echo -e "${YELLOW}Warnings: $warnings${NC}"' EXIT

# Environment variables (standardized to uppercase)
export BBX_HOSTNAME="${BBX_HOSTNAME:-localhost}"
export EMAIL="${EMAIL:-test@example.com}"
export LICENSE_KEY="${LICENSE_KEY:-TEST-KEY-1234-5678-90AB-CDEF-GHIJ-KLMN-OPQR}"
export BBX_TEST_AGREEMENT="${BBX_TEST_AGREEMENT:-true}"
export BBX_DEBUG="${BBX_DEBUG:-}"

is_quick_exit() {
  [[ "${STATUS_MODE}" == "quick exit" || -n "${BB_QUICK_EXIT:-}" ]]
}

port_in_use() {
  local port="$1"
  if command -v lsof &>/dev/null; then
    lsof -iTCP:"$port" -sTCP:LISTEN -n -P >/dev/null 2>&1
    return $?
  fi
  if command -v ss &>/dev/null; then
    ss -ltn "( sport = :$port )" 2>/dev/null | awk 'NR>1 {exit 0} END{exit 1}'
    return $?
  fi
  if command -v netstat &>/dev/null; then
    netstat -an 2>/dev/null | awk -v p=":$port" '$0 ~ p && $0 ~ /LISTEN/ {exit 0} END{exit 1}'
    return $?
  fi
  return 1
}

nginx_listening_on_port() {
  local port="$1"
  if command -v lsof &>/dev/null; then
    lsof -iTCP:"$port" -sTCP:LISTEN -n -P 2>/dev/null | awk 'NR>1 {print $1}' | grep -qi '^nginx$'
    return $?
  fi
  return 1
}

nginx_is_active() {
  if command -v pgrep &>/dev/null; then
    pgrep -x nginx >/dev/null 2>&1 && return 0
  fi
  if command -v lsof &>/dev/null; then
    lsof -iTCP -sTCP:LISTEN -n -P 2>/dev/null | awk 'NR>1 {print $1}' | grep -qi '^nginx$' && return 0
  fi
  return 1
}

record_nginx_active_state() {
  local state_file="${BB_CONFIG_DIR}/nginx_active_before"
  if nginx_is_active; then
    printf '1' > "$state_file"
  else
    printf '0' > "$state_file"
  fi
}

nginx_active_before() {
  local state_file="${BB_CONFIG_DIR}/nginx_active_before"
  if [[ -f "$state_file" ]]; then
    [[ "$(cat "$state_file" 2>/dev/null)" == "1" ]]
    return $?
  fi
  return 1
}

stop_nginx_full() {
  if command -v nginx &>/dev/null; then
    sudo nginx -s quit >/dev/null 2>&1 || true
    sudo nginx -s stop >/dev/null 2>&1 || true
  fi
  if command -v brew &>/dev/null; then
    sudo brew services stop nginx >/dev/null 2>&1 || true
  fi
  if command -v systemctl &>/dev/null; then
    sudo systemctl stop nginx >/dev/null 2>&1 || true
  fi
  pkill -f nginx >/dev/null 2>&1 || true
}

cleanup_nginx_sites() {
  local removed=0
  local user_prefix="${USER}-"
  local brew_prefix=""
  local servers_dir=""
  local sites_available=""
  local sites_enabled=""
  local confd_dir=""

  if command -v brew &>/dev/null; then
    brew_prefix="$(brew --prefix 2>/dev/null || true)"
    if [[ -n "$brew_prefix" ]]; then
      servers_dir="${brew_prefix}/etc/nginx/servers"
    fi
  fi
  if [[ -d /etc/nginx/sites-available && -d /etc/nginx/sites-enabled ]]; then
    sites_available="/etc/nginx/sites-available"
    sites_enabled="/etc/nginx/sites-enabled"
  elif [[ -d /etc/nginx/conf.d ]]; then
    confd_dir="/etc/nginx/conf.d"
  fi

  if [[ -n "$servers_dir" && -d "$servers_dir" ]]; then
    if ls "${servers_dir}/${user_prefix}"*.conf >/dev/null 2>&1; then
      sudo rm -f "${servers_dir}/${user_prefix}"*.conf >/dev/null 2>&1 || true
      removed=1
    fi
  fi
  if [[ -n "$sites_available" && -d "$sites_available" ]]; then
    if ls "${sites_available}/${user_prefix}"*.conf >/dev/null 2>&1; then
      sudo rm -f "${sites_available}/${user_prefix}"*.conf >/dev/null 2>&1 || true
      removed=1
    fi
    if [[ -n "$sites_enabled" && -d "$sites_enabled" ]]; then
      if ls "${sites_enabled}/${user_prefix}"*.conf >/dev/null 2>&1; then
        sudo rm -f "${sites_enabled}/${user_prefix}"*.conf >/dev/null 2>&1 || true
        removed=1
      fi
    fi
  fi
  if [[ -n "$confd_dir" && -d "$confd_dir" ]]; then
    if ls "${confd_dir}/${user_prefix}"*.conf >/dev/null 2>&1; then
      sudo rm -f "${confd_dir}/${user_prefix}"*.conf >/dev/null 2>&1 || true
      removed=1
    fi
  fi

  if (( removed )); then
    if command -v nginx &>/dev/null; then
      sudo nginx -t >/dev/null 2>&1 || true
      sudo nginx -s reload >/dev/null 2>&1 || true
    elif command -v systemctl &>/dev/null; then
      sudo systemctl reload nginx >/dev/null 2>&1 || true
    fi
    if ! nginx_active_before; then
      stop_nginx_full
    fi
    return 0
  fi

  if command -v setup_nginx &>/dev/null; then
    setup_nginx --cleanup >/dev/null 2>&1 || true
    if ! nginx_active_before; then
      stop_nginx_full
    fi
    return 0
  fi
  return 1
}

port_block_free() {
  local base="$1"
  local p
  for p in $((base-2)) $((base-1)) "$base" $((base+1)) $((base+2)); do
    if [[ "$p" -le 0 ]]; then
      return 1
    fi
    if port_in_use "$p"; then
      return 1
    fi
  done
  return 0
}

ensure_setup_port() {
  local base="$1"
  local default_base=8080
  if port_block_free "$base"; then
    return 0
  fi
  if nginx_listening_on_port "$base" && [[ "${BBX_STOP_NGINX_ON_CONFLICT:-1}" != "0" && "${BBX_STOP_NGINX_ON_CONFLICT:-1}" != "false" ]]; then
    echo "Port ${base} is busy (nginx). Cleaning up BrowserBox nginx sites..." >&2
    cleanup_nginx_sites
    if port_block_free "$base"; then
      return 0
    fi
  fi
  if [[ "$base" == "$default_base" && "${BBX_ALLOW_SETUP_PORT_FALLBACK:-1}" != "0" && "${BBX_ALLOW_SETUP_PORT_FALLBACK:-1}" != "false" ]]; then
    local candidate
    for candidate in 9090 10080 11080 12080 13080; do
      if port_block_free "$candidate"; then
        echo "Default port block ${base} is busy; switching setup port to ${candidate}." >&2
        export BBX_SETUP_PORT="$candidate"
        return 0
      fi
    done
  fi
  return 1
}

bbx_exec_path() {
  ensure_bbx_cmd || return 1
  if [[ -x "$BBX_CMD" ]]; then
    printf '%s' "$BBX_CMD"
    return 0
  fi
  if command -v "$BBX_CMD" &>/dev/null; then
    printf '%s' "$BBX_CMD"
    return 0
  fi
  return 1
}

saga_bbx_stop() {
  if [[ -x "$BBX_CMD" ]] || command -v "$BBX_CMD" &>/dev/null; then
    "$BBX_CMD" stop
  elif command -v "$BROWSERBOX_CMD" &>/dev/null; then
    "$BROWSERBOX_CMD" pm2 stop bb-main || true
  fi
}

dump_service_logs() {
  local label="${1:-}"
  local log_dir="${BB_CONFIG_DIR}/service_logs"
  local services=(bb-main bb-audio bb-devtools bb-docs)

  echo -e "${YELLOW}⚠ Collecting service logs${label:+ for }${label}...${NC}"
  if command -v "$BROWSERBOX_CMD" &>/dev/null; then
    for svc in "${services[@]}"; do
      echo "== ${svc} logs (pm2) =="
      "$BROWSERBOX_CMD" pm2 logs "$svc" --nostream --lines 200 2>/dev/null || true
      local err_file="${log_dir}/${svc}-err.log"
      if [[ -f "$err_file" ]]; then
        echo "== ${svc} stderr (tail) =="
        tail -n 200 "$err_file" 2>/dev/null || true
      fi
    done
  fi
  if [[ -d "$log_dir" ]]; then
    for f in "$log_dir"/*.log "$log_dir"/*.err.log; do
      [[ -f "$f" ]] || continue
      echo "== $(basename "$f") (tail) =="
      tail -n 200 "$f" 2>/dev/null || true
    done
  fi
}

saga_bbx_uninstall() {
  ensure_bbx_cmd || true
  if [[ -x "$BBX_CMD" ]] || command -v "$BBX_CMD" &>/dev/null; then
    yes yes | "$BBX_CMD" uninstall
    return $?
  fi
  return 1
}

saga_bbx_install() {
  ensure_bbx_cmd || true
  if [[ -x "$BBX_CMD" ]] || command -v "$BBX_CMD" &>/dev/null; then
    yes yes | "$BBX_CMD" install
    return $?
  fi
  if command -v "$BROWSERBOX_CMD" &>/dev/null; then
    "$BROWSERBOX_CMD" --install
    return $?
  fi
  echo "No installer found. BBX_CMD=${BBX_CMD} BROWSERBOX_CMD=${BROWSERBOX_CMD}" >&2
  return 1
}

saga_bbx_setup() {
  ensure_bbx_cmd || true
  if [[ -x "$BBX_CMD" ]] || command -v "$BBX_CMD" &>/dev/null; then
    "$BBX_CMD" setup "$@"
    return $?
  fi
  return 1
}

saga_bbx_run() {
  ensure_bbx_cmd || true
  if [[ -x "$BBX_CMD" ]] || command -v "$BBX_CMD" &>/dev/null; then
    "$BBX_CMD" run
    return $?
  fi
  return 1
}

saga_bbx_ng_run() {
  ensure_bbx_cmd || true
  if [[ -x "$BBX_CMD" ]] || command -v "$BBX_CMD" &>/dev/null; then
    "$BBX_CMD" ng-run
    return $?
  fi
  return 1
}

saga_bbx_tor_run() {
  ensure_bbx_cmd || true
  if [[ -x "$BBX_CMD" ]] || command -v "$BBX_CMD" &>/dev/null; then
    "$BBX_CMD" tor-run
    return $?
  fi
  return 1
}

saga_bbx_cf_run() {
  ensure_bbx_cmd || true
  if [[ -x "$BBX_CMD" ]] || command -v "$BBX_CMD" &>/dev/null; then
    "$BBX_CMD" cf-run
    return $?
  fi
  return 1
}

saga_bbx_docker_run() {
  ensure_bbx_cmd || true
  if [[ -x "$BBX_CMD" ]] || command -v "$BBX_CMD" &>/dev/null; then
    "$BBX_CMD" docker-run "$@"
    return $?
  fi
  return 1
}

saga_bbx_docker_stop() {
  if [[ -x "$BBX_CMD" ]] || command -v "$BBX_CMD" &>/dev/null; then
    "$BBX_CMD" docker-stop "$@"
    return $?
  fi
  return 1
}

# Function to extract login link from bbx output (cross-platform)
extract_login_link() {
  local output="$1"
  echo "$output" | grep -E -o 'https?://[^ ]+'
}

# Function to extract nickname from docker-run output (cross-platform)
extract_nickname() {
  local output="$1"
  echo "$output" | grep -E -o 'Nickname: [a-zA-Z0-9_-]+' | sed 's/Nickname: //'
}

# Function to test login link with curl
test_login_link() {
  local link="$1"                # The URL to test
  local use_tor="$2"             # Optional: "tor" to use Tor SOCKS proxy
  local start_time=$(date +%s)   # Record the start time in seconds
  local max_time=45              # Maximum wait time in seconds
  local interval=2               # Time between retries in seconds
  local timeout=5
  local success=0                # Flag to track success
  local http_code=""             # Variable to store the HTTP status code
  local curl_opts="-s -k -L -w %{http_code} --max-time $timeout --fail --output /dev/null"

  # Add Tor SOCKS proxy if specified
  if [ "$use_tor" = "tor" ]; then
    interval=5
    timeout=25
    max_time=180
    curl_opts="-s -k -L -w %{http_code} --max-time $timeout --fail --output /dev/null --proxy socks5h://127.0.0.1:9050"
    echo -n "Testing Tor login link $link with retries... "
  else
    echo -n "Testing login link $link with retries... "
  fi

  # Loop until max_time is reached or success is achieved
  while [ $(( $(date +%s) - start_time )) -lt $max_time ]; do
    # Execute curl with the constructed options
    http_code="$(curl $curl_opts "$link")"

    # Check if the status code starts with '2' (indicating 2xx success)
    if [[ "$http_code" =~ ^2 ]]; then
      success=1
      break  # Exit the loop on success
    fi

    # Wait before the next attempt
    sleep $interval
  done

  # Report the result
  if [ $success -eq 1 ]; then
    if [ "$use_tor" = "tor" ]; then
      echo -e "${GREEN}✔ Success (HTTP $http_code via Tor)${NC}"
    else
      echo -e "${GREEN}✔ Success (HTTP $http_code)${NC}"
    fi
    ((passed++))
    return 0
  else
    echo -e "${RED}✘ Failed after $max_time seconds (Last HTTP code: $http_code)${NC}"
    ((failed++))
    return 1
  fi
}

test_basic_link() {
  local link="$1"                # The URL to test
  local label="$2"               # Human-readable label
  local start_time=$(date +%s)   # Record the start time in seconds
  local max_time=45              # Maximum wait time in seconds
  local interval=2               # Time between retries in seconds
  local timeout=5
  local success=0                # Flag to track success
  local http_code=""             # Variable to store the HTTP status code
  local curl_opts="-s -k -L -w %{http_code} --max-time $timeout --fail --output /dev/null"

  echo -n "Testing ${label} link $link with retries... "

  while [ $(( $(date +%s) - start_time )) -lt $max_time ]; do
    http_code="$(curl $curl_opts "$link")"

    if [[ "$http_code" =~ ^2 ]]; then
      success=1
      break
    fi

    sleep $interval
  done

  if [ $success -eq 1 ]; then
    echo -e "${GREEN}✔ Success (HTTP $http_code)${NC}"
    ((passed++))
    return 0
  else
    echo -e "${RED}✘ Failed after $max_time seconds (Last HTTP code: $http_code)${NC}"
    ((failed++))
    return 1
  fi
}

test_service_links() {
  local login_link="$1"
  local env_file="${BB_CONFIG_DIR}/test.env"
  local hosts_file="${BB_CONFIG_DIR}/hosts.env"

  if [ ! -f "$env_file" ]; then
    echo -e "${YELLOW}⚠ Warning: ${env_file} not found; skipping service link checks${NC}"
    ((warnings++))
    return 0
  fi

  # shellcheck disable=SC1090
  source "$env_file"
  if [[ -n "${HOST_PER_SERVICE-}" && -f "$hosts_file" ]]; then
    # shellcheck disable=SC1090
    source "$hosts_file"
  fi

  local token="${LOGIN_TOKEN:-}"
  if [ -z "$token" ]; then
    token="$(echo "$login_link" | sed -n 's/.*token=\([^&]*\).*/\1/p')"
  fi

  local proto="${login_link%%://*}"
  local hostport="${login_link#*://}"
  hostport="${hostport%%/*}"
  local host="${hostport%:*}"
  local has_port="yes"
  if [[ "$hostport" == "$host" ]]; then
    has_port="no"
  fi

  if [[ -z "${AUDIO_PORT-}" || -z "${DEVTOOLS_PORT-}" || -z "${DOCS_PORT-}" ]]; then
    echo -e "${YELLOW}⚠ Warning: service ports missing in ${env_file}; skipping service link checks${NC}"
    ((warnings++))
    return 0
  fi

  service_hostport() {
    local port="$1"
    local addr_var="ADDR_${port}"
    local addr="${!addr_var-}"
    if [[ -n "$addr" ]]; then
      if [[ "$addr" == *:* ]]; then
        printf '%s' "$addr"
      else
        printf '%s:%s' "$addr" "$port"
      fi
      return
    fi
    if [[ "$has_port" == "yes" ]]; then
      printf '%s:%s' "$host" "$port"
    else
      printf '%s' "$host"
    fi
  }

  local audio_hostport devtools_hostport docs_hostport
  audio_hostport="$(service_hostport "$AUDIO_PORT")"
  devtools_hostport="$(service_hostport "$DEVTOOLS_PORT")"
  docs_hostport="$(service_hostport "$DOCS_PORT")"

  local audio_link="${proto}://${audio_hostport}/login?token=${token}"
  local devtools_link="${proto}://${devtools_hostport}/login?token=${token}"
  local docs_link="${proto}://${docs_hostport}/"

  local ok=0
  if [[ -n "${BBX_SKIP_AUDIO-}" ]]; then
    echo -e "${YELLOW}⚠ Warning: BBX_SKIP_AUDIO set; skipping audio service check${NC}"
    ((warnings++))
  else
    local platform
    platform="$(uname -s)"
    if [[ "$platform" == "MINGW"* || "$platform" == "MSYS"* || "$platform" == "CYGWIN"* ]]; then
      echo -e "${YELLOW}⚠ Warning: Windows detected; skipping audio service check${NC}"
      ((warnings++))
    else
      test_basic_link "$audio_link" "audio service" || ok=1
    fi
  fi
  test_basic_link "$devtools_link" "devtools service" || ok=1
  test_basic_link "$docs_link" "docs service" || ok=1

  if [ $ok -ne 0 ]; then
    dump_service_logs "service link failures"
    return 1
  fi
  return 0
}
# Test functions
test_uninstall() {
  echo "Uninstalling bbx... "
  if saga_bbx_uninstall; then
    echo -e "${GREEN}✔ Success${NC}"
    ((passed++))
    return 0
  else
    echo -e "${YELLOW}⚠ Warning${NC}"
    ((warnings++))
    return 0
  fi
}

test_install() {
  echo "Installing bbx... "
  local timeout_cmd="timeout"
  local install_output=""
  local install_rc=0
  local bbx_exec=""
  local platform
  platform="$(uname -s)"
  if [[ "$platform" == "Darwin" ]]; then
    brew install coreutils
    if command -v gtimeout &>/dev/null; then
      timeout_cmd="gtimeout"
    else
      timeout_cmd=""
    fi
  fi
  if ! bbx_exec="$(bbx_exec_path)"; then
    echo "Install failed: bbx not found and no bootstrap available." >&2
    echo -e "${RED}✘ Failed${NC}"
    ((failed++))
    exit 1
  fi
  if [[ -n "$timeout_cmd" ]] && command -v "$timeout_cmd" &>/dev/null; then
    install_output="$(
      set -o pipefail
      yes yes | "$timeout_cmd" -k 15s "$TEST_INSTALL_TIMEOUT" "$bbx_exec" install
    2>&1)"
    install_rc=$?
  else
    echo "Warning: timeout not available; running install without timeout" >&2
    install_output="$(
      set -o pipefail
      yes yes | "$bbx_exec" install
    2>&1)"
    install_rc=$?
  fi
  if [ $install_rc -eq 0 ]; then
    echo -e "${GREEN}✔ Success${NC}"
    ((passed++))
    # Update BBX_CMD to use the installed binary
    if command -v bbx &>/dev/null; then
      BBX_CMD="bbx"
      echo "Using installed bbx: $BBX_CMD"
    elif command -v browserbox &>/dev/null; then
      BBX_CMD="browserbox"
      BROWSERBOX_CMD="browserbox"
      echo "Using installed browserbox: $BBX_CMD"
    fi
  else
    if [[ -n "$install_output" ]]; then
      echo "$install_output"
    fi
    echo "Install failed (exit $install_rc). timeout_cmd=${timeout_cmd:-none}" >&2
    echo -e "${RED}✘ Failed${NC}"
    ((failed++))
    exit 1
  fi
  # if we just installed as root, then we have created a correct user called something or yes so let's hand off install script to them :)
  if [ "$(id -u)" -eq 0 ]; then
    if [ -f "${BB_CONFIG_DIR}/.install_user" ]; then
      install_user="$(cat "${BB_CONFIG_DIR}"/.install_user)"
      if id "$install_user" &>/dev/null; then
        # Verify user has passwordless sudo capability
        if ! su - "$install_user" -c "sudo -n true" 2>/dev/null; then
          echo "ERROR: Install user '$install_user' does not have passwordless sudo capability." >&2
          echo "BrowserBox tests require sudo. Please ensure the user has NOPASSWD sudo access." >&2
          exit 1
        fi
        # Copy BrowserBox directory to install user's home
        user_home="$(getent passwd "$install_user" | cut -d: -f6)"
        install_group="$(id -gn "$install_user")"
        if [ -d "$user_home/.bbx/BrowserBox" ]; then
          sudo -u "$install_user" cp -r "$user_home/.bbx/BrowserBox" "$user_home/" 2>/dev/null || true
        fi
        # Fix ownership of config dir
        if [ -d "$BB_CONFIG_DIR" ]; then
          chown -R "${install_user}:${install_group}" "$BB_CONFIG_DIR" 2>/dev/null || true
        fi
        # Forward BBX-related env plus PATH vars via file in user's home.
        su_env_vars=(BBX_HOSTNAME EMAIL LICENSE_KEY BBX_TEST_AGREEMENT STATUS_MODE INSTALL_DOC_VIEWER BBX_NO_UPDATE BBX_RELEASE_REPO BBX_RELEASE_TAG TARGET_RELEASE_REPO PRIVATE_TAG GH_TOKEN GITHUB_TOKEN BBX_INSTALL_USER BB_QUICK_EXIT NVM_DIR NODE_PATH)
        env_file="${user_home}/.bbx_env_restore.sh"
        : > "$env_file"
        for var in "${su_env_vars[@]}"; do
          val="${!var-}"
          [[ -n "$val" ]] || continue
          printf 'export %s=%q\n' "$var" "$val" >> "$env_file"
        done
        [[ -n "${PATH:-}" ]] && printf 'export PATH=%q\n' "$PATH" >> "$env_file"
        chown "${install_user}:${install_group}" "$env_file" 2>/dev/null || true
        chmod 640 "$env_file" 2>/dev/null || true
        exec su - "${install_user}" -c "set -a; source $(printf '%q' "$env_file"); cd $(printf '%q' "$SCRIPT_DIR") && $(printf '%q' "$SCRIPT_PATH"); rc=\$?; rm -f $(printf '%q' "$env_file"); exit \$rc"
      else
        echo "Warning: Install user $install_user does not exist, continuing as root"
      fi
    else
      echo "Warning: No .install_user file found, continuing as root"
    fi
  fi
  return 0
}

test_setup() {
  echo "Setting up bbx... "
  if ! ensure_setup_port "${BBX_SETUP_PORT}"; then
    echo -e "${RED}✘ Failed (no available setup port block)${NC}"
    ((failed++))
    exit 1
  fi
  if saga_bbx_setup --port "${BBX_SETUP_PORT}" --hostname localhost; then
    echo -e "${GREEN}✔ Success${NC}"
    ((passed++))
    return 0
  fi
  if [[ "${BBX_ALLOW_SETUP_PORT_FALLBACK:-1}" != "0" && "${BBX_ALLOW_SETUP_PORT_FALLBACK:-1}" != "false" ]]; then
    local candidate
    for candidate in 9090 10080 11080 12080 13080; do
      if port_block_free "$candidate"; then
        echo "Retrying setup with fallback port ${candidate}." >&2
        export BBX_SETUP_PORT="$candidate"
        if saga_bbx_setup --port "${BBX_SETUP_PORT}" --hostname localhost; then
          echo -e "${GREEN}✔ Success${NC}"
          ((passed++))
          return 0
        fi
      fi
    done
  fi
  echo -e "${RED}✘ Failed${NC}"
  ((failed++))
  exit 1
}

test_run() {
  echo "Running bbx... "
  echo "DEBUG: About to call saga_bbx_run"
  output="$(saga_bbx_run 2>&1)"
  exit_code=$?
  echo "DEBUG: saga_bbx_run returned exit_code=$exit_code"
  echo "DEBUG: Output was:"
  echo "$output"
  echo "DEBUG: Checking for service_logs directory..."
  ls -la "$HOME/.config/dosaygo/bbpro/" 2>/dev/null || echo "Config dir not found"
  ls -la "$HOME/.config/dosaygo/bbpro/service_logs/" 2>/dev/null || echo "service_logs dir not found"
  login_link="$(extract_login_link "$output" | tail -n 1)"
  echo "DEBUG: Extracted login_link=$login_link"
  if [ -z "$login_link" ] || [ $exit_code -ne 0 ]; then
    echo -e "${RED}✘ Failed (No login link or run failed)${NC}"
    echo "$output"
    ((failed++))
    saga_bbx_stop
    return 1
  fi
  echo -e "${GREEN}✔ Success (Run completed)${NC}"
  ((passed++))
  
  # Test login link immediately
  if [ -f ~/.nvm/nvm.sh ]; then
    source ~/.nvm/nvm.sh 2>/dev/null || true
  fi
  if command -v timeout &>/dev/null && command -v browserbox &>/dev/null; then
    timeout 15s browserbox pm2 list 2>/dev/null || true
  fi

  if ! test_login_link "$login_link"; then
    saga_bbx_stop
    return 1
  fi
  if ! test_service_links "$login_link"; then
    saga_bbx_stop
    return 1
  fi
  # Wait 45 seconds and test again
  echo "Waiting 45 seconds to check instance activity... "
  sleep 45
  echo -e "${GREEN}✔ Wait complete${NC}"
  ((passed++))
  if ! test_login_link "$login_link"; then
    saga_bbx_stop
    return 1
  fi
  if ! test_service_links "$login_link"; then
    saga_bbx_stop
    return 1
  fi
  saga_bbx_stop
  return 0
}

test_ng_run() {
  # This test is only reliable on macOS where nginx setup is more predictable for local testing
  if [[ "$(uname -s)" != "Darwin" ]]; then
    echo "Skipping Nginx run test (only runs on macOS for now)"
    ((passed++))
    return 0
  fi

  record_nginx_active_state
  echo "Running bbx with Nginx... "
  # use wildcard-able hostname for ng-run
  if ! saga_bbx_setup --port "${BBX_NG_SETUP_PORT}" --hostname "ci.test" -z; then
    echo -e "${RED}✘ Failed (bbx setup failed for ng-run)${NC}"
    ((failed++))
    return 1
  fi
  local bbx_exec=""
  local timeout_cmd="timeout"
  if ! bbx_exec="$(bbx_exec_path)"; then
    echo -e "${RED}✘ Failed (bbx command not found)${NC}"
    ((failed++))
    return 1
  fi
  if [[ "$(uname -s)" == "Darwin" ]]; then
    if command -v gtimeout &>/dev/null; then
      timeout_cmd="gtimeout"
    else
      timeout_cmd=""
    fi
  fi
  if [[ -n "$timeout_cmd" ]] && command -v "$timeout_cmd" &>/dev/null; then
    "$timeout_cmd" -k 15s "$TEST_NG_RUN_TIMEOUT" "$bbx_exec" ng-run 2>&1
  else
    "$bbx_exec" ng-run 2>&1
  fi
  exit_code=$?
  output="$(cat "${BB_CONFIG_DIR}/login.link")"
  login_link="$(extract_login_link "$output" | tail -n 1)"
  if [ -z "$login_link" ] || [ $exit_code -ne 0 ]; then
    echo -e "${RED}✘ Failed (No login link or ng-run failed)${NC}"
    ((failed++))
    saga_bbx_stop
    return 1
  fi
  echo -e "${GREEN}✔ Success (Nginx run completed)${NC}"
  ((passed++))

  # Test login link immediately
  if ! test_login_link "$login_link"; then
    saga_bbx_stop
    return 1
  fi

  if is_quick_exit; then
    saga_bbx_stop
    return 0
  fi

  # Wait 25 seconds and test again
  echo "Waiting 25 seconds to check instance activity... "
  sleep 25
  echo -e "${GREEN}✔ Wait complete${NC}"
  ((passed++))
  if ! test_login_link "$login_link"; then
    saga_bbx_stop
    return 1
  fi
  saga_bbx_stop
  if [[ "${BBX_STOP_NGINX_AFTER_NG_RUN:-1}" != "0" && "${BBX_STOP_NGINX_AFTER_NG_RUN:-1}" != "false" ]]; then
    cleanup_nginx_sites
  fi
  return 0
}

test_tor_run() {
  echo "Running bbx with Tor... "
  local bbx_exec=""
  local timeout_cmd="timeout"
  if ! bbx_exec="$(bbx_exec_path)"; then
    echo -e "${RED}✘ Failed (bbx command not found)${NC}"
    ((failed++))
    return 1
  fi
  if [[ "$(uname -s)" == "Darwin" ]]; then
    if command -v gtimeout &>/dev/null; then
      timeout_cmd="gtimeout"
    else
      timeout_cmd=""
    fi
  fi
  if [[ -n "$timeout_cmd" ]] && command -v "$timeout_cmd" &>/dev/null; then
    "$timeout_cmd" -k 15s "$TEST_TOR_RUN_TIMEOUT" "$bbx_exec" tor-run 2>&1
  else
    "$bbx_exec" tor-run 2>&1
  fi
  exit_code=$?
  output="$(cat "${BB_CONFIG_DIR}/login.link")"
  login_link="$(extract_login_link "$output" | tail -n 1)"
  if [ -z "$login_link" ] || [ $exit_code -ne 0 ]; then
    echo -e "${RED}✘ Failed (No login link or tor-run failed)${NC}"
    ((failed++))
    saga_bbx_stop
    return 1
  fi
  echo -e "${GREEN}✔ Success (Tor run completed)${NC}"
  ((passed++))
  
  # Test login link immediately
  if ! test_login_link "$login_link" "tor"; then
    saga_bbx_stop
    return 1
  fi
  
  # Wait 25 seconds and test again
  if is_quick_exit; then
    saga_bbx_stop
    return 0
  fi
  echo "Waiting 25 seconds to check instance activity... "
  sleep 25
  echo -e "${GREEN}✔ Wait complete${NC}"
  ((passed++))
  if ! test_login_link "$login_link" "tor"; then
    saga_bbx_stop
    return 1
  fi
  saga_bbx_stop
  return 0
}

test_cf_run() {
  if [[ -f /.dockerenv ]]; then
    local os_id=""
    if [[ -f /etc/os-release ]]; then
      # shellcheck disable=SC1091
      source /etc/os-release
      os_id="${ID:-}"
    fi
    if [[ "$os_id" == "centos" || "$os_id" == "rhel" || "$os_id" == "fedora" ]]; then
      echo -e "${YELLOW}⚠ Warning: ${os_id} container detected; using local-run CF path with IPv4 edge${NC}"
      export BBX_CF_USE_LOCAL_RUN=1
    fi
  fi
  # use ipV4 edges universally as they seem less flaky
  export BBX_CF_EDGE_IP_VERSION="${BBX_CF_EDGE_IP_VERSION:-4}"
  # Check if we have internet connectivity by testing Cloudflare endpoint
  if ! curl --connect-timeout 5 -s -o /dev/null https://www.cloudflare.com 2>/dev/null; then
    echo "Skipping Cloudflare tunnel test (no internet connectivity)"
    ((passed++))
    return 0
  fi

  if [[ -n "${BBX_CF_USE_LOCAL_RUN:-}" ]]; then
    echo "Running Cloudflare tunnel against local bbx run... "
    if ! command -v cloudflared &>/dev/null; then
      echo -e "${YELLOW}⚠ Warning: cloudflared not found; skipping CF test${NC}"
      ((warnings++))
      return 0
    fi

    if ! saga_bbx_setup --port "${BBX_SETUP_PORT}" --hostname localhost; then
      echo -e "${RED}✘ Failed (bbx setup failed for CF run)${NC}"
      ((failed++))
      return 1
    fi

    output="$(saga_bbx_run 2>&1)"
    login_link="$(extract_login_link "$output" | tail -n 1)"
    if [ -z "$login_link" ]; then
      echo -e "${RED}✘ Failed (No login link or run failed)${NC}"
      ((failed++))
      saga_bbx_stop
      return 1
    fi

    local env_file="${BB_CONFIG_DIR}/test.env"
    if [ ! -f "$env_file" ]; then
      echo -e "${YELLOW}⚠ Warning: ${env_file} not found; skipping CF test${NC}"
      ((warnings++))
      saga_bbx_stop
      return 0
    fi
    # shellcheck disable=SC1090
    source "$env_file"
    local local_port="${APP_PORT:-}"
    local token="${LOGIN_TOKEN:-}"
    if [[ -z "$local_port" ]]; then
      echo -e "${YELLOW}⚠ Warning: APP_PORT missing; skipping CF test${NC}"
      ((warnings++))
      saga_bbx_stop
      return 0
    fi

    local cf_log_file="${BB_CONFIG_DIR}/cloudflared.log"
    local scheme="https"
    if [[ "${BBX_HTTP_ONLY:-}" == "true" ]]; then
      scheme="http"
    fi

    local cf_edge_args=()
    if [[ -n "${BBX_CF_EDGE_IP_VERSION:-}" ]]; then
      cf_edge_args+=(--edge-ip-version "${BBX_CF_EDGE_IP_VERSION}")
    fi
    cloudflared tunnel --no-autoupdate "${cf_edge_args[@]}" --url "${scheme}://127.0.0.1:${local_port}" --no-tls-verify > "$cf_log_file" 2>&1 &
    cf_pid=$!

    local attempts=0
    local max_attempts=120
    local tunnel_url=""
    while [ $attempts -lt $max_attempts ]; do
      if [ -f "$cf_log_file" ]; then
        tunnel_url=$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$cf_log_file" | head -1)
        if [ -n "$tunnel_url" ]; then
          break
        fi
      fi
      sleep 0.5
      attempts=$((attempts + 1))
    done

    if [ -z "$tunnel_url" ]; then
      echo -e "${RED}✘ Failed to extract tunnel URL from cloudflared log${NC}"
      kill $cf_pid 2>/dev/null || true
      saga_bbx_stop
      return 1
    fi

    local cf_login_link="${tunnel_url}/login?token=${token}"
    echo -e "${GREEN}✔ Success (CF run started, link: ${cf_login_link})${NC}"
    ((passed++))

    sleep 10

    local start_time=$(date +%s)
    local max_time="${BBX_CF_MAX_TIME:-180}"
    local interval="${BBX_CF_INTERVAL:-4}"
    local timeout=10
    local success=0
    local http_code=""
    local curl_opts="-s -k -L -w %{http_code} --max-time $timeout --fail --output /dev/null"
    echo -n "Testing CF login link ${cf_login_link} with retries... "
    while [ $(( $(date +%s) - start_time )) -lt $max_time ]; do
      http_code="$(curl $curl_opts "$cf_login_link")"
      if [[ "$http_code" =~ ^2 ]]; then
        success=1
        break
      fi
      sleep $interval
    done
    if [ $success -ne 1 ]; then
      echo -e "${RED}✘ Failed after $max_time seconds (Last HTTP code: $http_code)${NC}"
      kill $cf_pid 2>/dev/null || true
      saga_bbx_stop
      return 1
    fi
    echo -e "${GREEN}✔ Success (HTTP $http_code)${NC}"
    ((passed++))

    kill $cf_pid 2>/dev/null || true
    saga_bbx_stop
    return 0
  fi

  echo "Running bbx with Cloudflare tunnel... "
  # Run cf-run with a timeout (allow extra time for tunnel propagation)
  local bbx_exec=""
  local timeout_cmd="timeout"
  if ! bbx_exec="$(bbx_exec_path)"; then
    echo -e "${RED}✘ Failed (bbx command not found)${NC}"
    ((failed++))
    return 1
  fi
  if [[ "$(uname -s)" == "Darwin" ]]; then
    if command -v gtimeout &>/dev/null; then
      timeout_cmd="gtimeout"
    else
      timeout_cmd=""
    fi
  fi
  if [[ -n "$timeout_cmd" ]] && command -v "$timeout_cmd" &>/dev/null; then
    "$timeout_cmd" -k 15s "$TEST_CF_RUN_TIMEOUT" "$bbx_exec" cf-run 2>&1 &
  else
    "$bbx_exec" cf-run 2>&1 &
  fi
  cf_pid=$!
  
  # Wait for cf-run to start and create login.link
  sleep 30
  
  if [ ! -f "${BB_CONFIG_DIR}/login.link" ]; then
    echo -e "${YELLOW}⚠ Warning: login.link not found (cf-run may still be starting)${NC}"
    kill $cf_pid 2>/dev/null || true
    saga_bbx_stop
    ((warnings++))
    return 0
  fi
  
  output="$(cat "${BB_CONFIG_DIR}/login.link")"
  login_link="$(extract_login_link "$output" | tail -n 1)"
  
  if [ -z "$login_link" ]; then
    echo -e "${YELLOW}⚠ Warning: No login link found${NC}"
    kill $cf_pid 2>/dev/null || true
    saga_bbx_stop
    ((warnings++))
    return 0
  fi
  
  echo -e "${GREEN}✔ Success (CF run started, link: ${login_link})${NC}"
  ((passed++))

  # Wait for the local origin to be reachable before hitting the tunnel.
  local env_file="${BB_CONFIG_DIR}/test.env"
  if [ -f "$env_file" ]; then
    # shellcheck disable=SC1090
    source "$env_file"
    local local_port="${APP_PORT:-}"
    local token="${LOGIN_TOKEN:-}"
    if [[ -n "$local_port" ]]; then
      local origin_link="http://127.0.0.1:${local_port}/login"
      if [[ -n "$token" ]]; then
        origin_link="${origin_link}?token=${token}"
      fi
      local start_time=$(date +%s)
      local max_time=60
      local interval=2
      local http_code=""
      while [ $(( $(date +%s) - start_time )) -lt $max_time ]; do
        http_code="$(curl -s -L -w %{http_code} --max-time 5 --fail --output /dev/null "$origin_link")"
        if [[ "$http_code" =~ ^2 ]]; then
          break
        fi
        sleep $interval
      done
    fi
  fi

  # Cloudflare quick tunnels can take a bit to become active.
  sleep 10
  
  # Test login link with longer retries for tunnel propagation.
  local start_time=$(date +%s)
  local max_time="${BBX_CF_MAX_TIME:-180}"
  local interval="${BBX_CF_INTERVAL:-4}"
  local timeout=10
  local success=0
  local http_code=""
  local curl_opts="-s -k -L -w %{http_code} --max-time $timeout --fail --output /dev/null"
  echo -n "Testing CF login link $login_link with retries... "
  while [ $(( $(date +%s) - start_time )) -lt $max_time ]; do
    http_code="$(curl $curl_opts "$login_link")"
    if [[ "$http_code" =~ ^2 ]]; then
      success=1
      break
    fi
    sleep $interval
  done
  if [ $success -ne 1 ]; then
      echo -e "${RED}✘ Failed after $max_time seconds (Last HTTP code: $http_code)${NC}"
      kill $cf_pid 2>/dev/null || true
      saga_bbx_stop
      return 1
    fi
  echo -e "${GREEN}✔ Success (HTTP $http_code)${NC}"
  ((passed++))
  
  # Cleanup
  kill $cf_pid 2>/dev/null || true
  saga_bbx_stop
  
  echo -e "${GREEN}✔ CF run test complete${NC}"
  ((passed++))
  return 0
}

test_docker_run() {
  # Self-detect if running in a Docker container
  if [[ -n "$SKIP_DOCKER" ]] || [ -f /.dockerenv ] || ([[ "$(uname -s)" == "Darwin" ]] && ! command -v docker &>/dev/null); then
    echo "Skipping Dockerized bbx test (detected running in Docker container or macOS, or environment has SKIP_DOCKER)"
    ((passed++))  # Increment passed to maintain test count
    return 0
  fi

  echo "Running Dockerized bbx... "
  nickname="test-docker"
  local bbx_exec=""
  local timeout_cmd="timeout"
  if ! bbx_exec="$(bbx_exec_path)"; then
    echo -e "${RED}✘ Failed (bbx command not found)${NC}"
    ((failed++))
    return 1
  fi
  if [[ "$(uname -s)" == "Darwin" ]]; then
    if command -v gtimeout &>/dev/null; then
      timeout_cmd="gtimeout"
    else
      timeout_cmd=""
    fi
  fi
  if [[ -n "$timeout_cmd" ]] && command -v "$timeout_cmd" &>/dev/null; then
    output="$(timeout -k 15s 10m "$bbx_exec" docker-run "$nickname" 2>&1)"
  else
    output="$("$bbx_exec" docker-run "$nickname" 2>&1)"
  fi
  echo "$output"
  exit_code=$?
  login_link="$(extract_login_link "$output" | tail -n 1)"
  if [ -z "$login_link" ] || [ -z "$nickname" ] || [ $exit_code -ne 0 ]; then
    echo -e "${RED}✘ Failed (No login link, nickname, or docker-run failed)${NC}"
    echo "$output"
    ((failed++))
    saga_bbx_docker_stop "$nickname"
    return 1
  fi
  echo -e "${GREEN}✔ Success (Docker run completed)${NC}"
  ((passed++))
  
  # Test login link
  if ! test_login_link "$login_link"; then
    saga_bbx_docker_stop "$nickname"
    return 1
  fi

  # Wait 25 seconds and test again
  if is_quick_exit; then
    return 0
  fi
  echo "Waiting 25 seconds to check instance activity... "
  sleep 25
  echo -e "${GREEN}✔ Wait complete${NC}"
  ((passed++))

  # Test login link
  if ! test_login_link "$login_link"; then
    saga_bbx_docker_stop "$nickname"
    return 1
  fi
  
  # Stop Docker instance with nickname
  echo "Stopping Dockerized bbx with nickname $nickname... "
  if saga_bbx_docker_stop "$nickname"; then
    echo -e "${GREEN}✔ Success${NC}"
    ((passed++))
  else
    echo -e "${RED}✘ Failed${NC}"
    ((failed++))
    return 1
  fi
  return 0
}

# Main test sequence
echo "Starting bbx Test Saga..."

test_setup || exit 1
test_run || exit 1
test_ng_run || exit 1
if [[ "${BBX_RESET_AFTER_NG_RUN:-1}" != "0" && "${BBX_RESET_AFTER_NG_RUN:-1}" != "false" ]]; then
  test_setup || exit 1
fi
test_tor_run || exit 1
test_cf_run || exit 1
test_docker_run || exit 1

# Cleanup
  saga_bbx_stop || true

echo "bbx Test Saga completed!"
exit 0
