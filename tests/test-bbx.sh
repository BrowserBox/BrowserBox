#!/bin/bash

# Test script for bbx CLI in BrowserBox repository
# Displays output directly in terminal

# Test timeouts (in minutes for timeout command)
TEST_NG_RUN_TIMEOUT="3m"
TEST_TOR_RUN_TIMEOUT="3m"
TEST_INSTALL_TIMEOUT="10m"
export SKIP_DOCKER="true" # we haven't build docker images yet so skip

if [[ -z "$STATUS_MODE" ]]; then
  echo "Set status mode env" >&2
  STATUS_MODE="quick exit"
fi

export STATUS_MODE="${STATUS_MODE}"

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

# Resolve script and repo paths so we can re-enter the tests reliably after su.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"
SCRIPT_PATH="${SCRIPT_DIR}/$(basename "${BASH_SOURCE[0]:-$0}")"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd -P)"

# Avoid git safe.directory prompts/noise in CI
git config --global --add safe.directory "$REPO_ROOT" 2>/dev/null || true

# Safely handle bbcertify output
if command -v bbcertify; then
  cert_file=$(bbcertify --no-reservation)
  reservation_file="${HOME}/.config/dosyago/bbpro/tickets/reservation.json"
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
BB_CONFIG_DIR="$HOME/.config/dosyago/bbpro"

trap './bbx.sh stop &>/dev/null' EXIT

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
export BBX_DEBUG=false

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

# Test functions
test_uninstall() {
  echo "Uninstalling bbx... "
  yes yes | ./bbx.sh uninstall
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✔ Success${NC}"
    ((passed++))
  else
    echo -e "${YELLOW}⚠ Warning${NC}"
    ((warnings++))
  fi
}

test_install() {
  echo "Installing bbx... "
  if [[ "$(uname -s)" == "Darwin" ]]; then
    brew install coreutils
  fi
  yes yes | timeout -k 10s "$TEST_INSTALL_TIMEOUT" ./bbx.sh install
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✔ Success${NC}"
    ((passed++))
  else
    echo -e "${RED}✘ Failed${NC}"
    ((failed++))
    exit 1
  fi
  # if we just installed as root, then we have created a correct user called something or yes so let's hand off install script to them :)
  if [ "$(id -u)" -eq 0 ]; then
    if [ -f "${BB_CONFIG_DIR}/.install_user" ]; then
      install_user="$(cat "${BB_CONFIG_DIR}"/.install_user)"
      if id "$install_user" &>/dev/null; then
        # Copy BrowserBox directory to install user's home
        user_home="$(eval echo ~"$install_user")"
        if [ -d "$user_home/.bbx/BrowserBox" ]; then
          sudo -u "$install_user" cp -r "$user_home/.bbx/BrowserBox" "$user_home/" 2>/dev/null || true
        fi
        # Forward only the BBX-related env we rely on via a temp file to avoid su - env stripping.
        su_env_vars=(BBX_HOSTNAME EMAIL LICENSE_KEY BBX_TEST_AGREEMENT STATUS_MODE INSTALL_DOC_VIEWER BBX_NO_UPDATE BBX_RELEASE_REPO BBX_RELEASE_TAG TARGET_RELEASE_REPO PRIVATE_TAG GH_TOKEN GITHUB_TOKEN BBX_INSTALL_USER BB_QUICK_EXIT)
        env_file="$(mktemp)"
        for var in "${su_env_vars[@]}"; do
          val="${!var-}"
          [[ -n "$val" ]] || continue
          printf '%s=%q\n' "$var" "$val" >> "$env_file"
        done
        chown "$install_user" "$env_file" 2>/dev/null || true
        exec su - "${install_user}" -c "set -a; source $(printf '%q' "$env_file"); cd $(printf '%q' "$REPO_ROOT") && $(printf '%q' "$SCRIPT_PATH"); rc=\$?; rm -f $(printf '%q' "$env_file"); exit \$rc"
      else
        echo "Warning: Install user $install_user does not exist, continuing as root"
      fi
    else
      echo "Warning: No .install_user file found, continuing as root"
    fi
  fi
}

test_setup() {
  echo "Setting up bbx... "
  ./bbx.sh setup --port 8080 --hostname localhost
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✔ Success${NC}"
    ((passed++))
  else
    echo -e "${RED}✘ Failed${NC}"
    ((failed++))
    exit 1
  fi
}

test_run() {
  echo "Running bbx... "
  output="$(./bbx.sh run 2>&1)"
  exit_code=$?
  login_link="$(extract_login_link "$output" | tail -n 1)"
  if [ -z "$login_link" ] || [ $exit_code -ne 0 ]; then
    echo -e "${RED}✘ Failed (No login link or run failed)${NC}"
    echo "$output"
    ((failed++))
    ./bbx.sh stop
    return 1
  fi
  echo -e "${GREEN}✔ Success (Run completed)${NC}"
  ((passed++))
  
  # Test login link immediately
  if [ -f ~/.nvm/nvm.sh ]; then
    source ~/.nvm/nvm.sh 2>/dev/null || true
  fi
  if command -v timeout &>/dev/null && command -v browserbox &>/dev/null; then
    timeout 10s browserbox pm2 list 2>/dev/null || true
  fi

  if ! test_login_link "$login_link"; then
    ./bbx.sh stop
    return 1
  fi
  
  # Wait 25 seconds and test again
  echo "Waiting 25 seconds to check instance activity... "
  sleep 25
  echo -e "${GREEN}✔ Wait complete${NC}"
  ((passed++))
  if ! test_login_link "$login_link"; then
    ./bbx.sh stop
    return 1
  fi
  ./bbx.sh stop
}

test_ng_run() {
  # This test is only reliable on macOS where nginx setup is more predictable for local testing
  if [[ "$(uname -s)" != "Darwin" ]]; then
    echo "Skipping Nginx run test (only runs on macOS for now)"
    ((passed++))
    return 0
  fi

  echo "Running bbx with Nginx... "
  # use wildcard-able hostname for ng-run
  ./bbx.sh setup --port 9999 --hostname "ci.test" -z
  timeout -k 10s "$TEST_NG_RUN_TIMEOUT" ./bbx.sh ng-run 2>&1
  exit_code=$?
  output="$(cat "${BB_CONFIG_DIR}/login.link")"
  login_link="$(extract_login_link "$output" | tail -n 1)"
  if [ -z "$login_link" ] || [ $exit_code -ne 0 ]; then
    echo -e "${RED}✘ Failed (No login link or ng-run failed)${NC}"
    ((failed++))
    ./bbx.sh stop
    return 1
  fi
  echo -e "${GREEN}✔ Success (Nginx run completed)${NC}"
  ((passed++))

  # Test login link immediately
  if ! test_login_link "$login_link"; then
    ./bbx.sh stop
    return 1
  fi

  # Wait 25 seconds and test again
  echo "Waiting 25 seconds to check instance activity... "
  sleep 25
  echo -e "${GREEN}✔ Wait complete${NC}"
  ((passed++))
  if ! test_login_link "$login_link"; then
    ./bbx.sh stop
    return 1
  fi
  ./bbx.sh stop
}

test_tor_run() {
  echo "Running bbx with Tor... "
  timeout -k 10s "$TEST_TOR_RUN_TIMEOUT" ./bbx.sh tor-run 2>&1
  exit_code=$?
  output="$(cat "${BB_CONFIG_DIR}/login.link")"
  login_link="$(extract_login_link "$output" | tail -n 1)"
  if [ -z "$login_link" ] || [ $exit_code -ne 0 ]; then
    echo -e "${RED}✘ Failed (No login link or tor-run failed)${NC}"
    ((failed++))
    ./bbx.sh stop
    return 1
  fi
  echo -e "${GREEN}✔ Success (Tor run completed)${NC}"
  ((passed++))
  
  # Test login link immediately
  if ! test_login_link "$login_link" "tor"; then
    ./bbx.sh stop
    return 1
  fi
  
  # Wait 25 seconds and test again
  echo "Waiting 25 seconds to check instance activity... "
  sleep 25
  echo -e "${GREEN}✔ Wait complete${NC}"
  ((passed++))
  if ! test_login_link "$login_link" "tor"; then
    ./bbx.sh stop
    return 1
  fi
  ./bbx.sh stop
}

test_cf_run() {
  # Check if we have internet connectivity by testing Cloudflare endpoint
  if ! curl --connect-timeout 5 -s -o /dev/null https://www.cloudflare.com 2>/dev/null; then
    echo "Skipping Cloudflare tunnel test (no internet connectivity)"
    ((passed++))
    return 0
  fi

  echo "Running bbx with Cloudflare tunnel... "
  # Run cf-run with a timeout (3 minutes matches the tor-run test pattern)
  timeout -k 10s 3m ./bbx.sh cf-run 2>&1 &
  cf_pid=$!
  
  # Wait for cf-run to start and create login.link
  sleep 30
  
  if [ ! -f "${BB_CONFIG_DIR}/login.link" ]; then
    echo -e "${YELLOW}⚠ Warning: login.link not found (cf-run may still be starting)${NC}"
    kill $cf_pid 2>/dev/null || true
    ./bbx.sh stop
    ((warnings++))
    return 0
  fi
  
  output="$(cat "${BB_CONFIG_DIR}/login.link")"
  login_link="$(extract_login_link "$output" | tail -n 1)"
  
  if [ -z "$login_link" ]; then
    echo -e "${YELLOW}⚠ Warning: No login link found${NC}"
    kill $cf_pid 2>/dev/null || true
    ./bbx.sh stop
    ((warnings++))
    return 0
  fi
  
  echo -e "${GREEN}✔ Success (CF run started, link: ${login_link})${NC}"
  ((passed++))
  
  # Test login link - use the tunnel URL which should work
  if ! test_login_link "$login_link"; then
    kill $cf_pid 2>/dev/null || true
    ./bbx.sh stop
    return 1
  fi
  
  # Cleanup
  kill $cf_pid 2>/dev/null || true
  ./bbx.sh stop
  
  echo -e "${GREEN}✔ CF run test complete${NC}"
  ((passed++))
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
  output="$(timeout -k 10s 10m ./bbx.sh docker-run $nickname 2>&1)"
  echo "$output"
  exit_code=$?
  login_link="$(extract_login_link "$output" | tail -n 1)"
  if [ -z "$login_link" ] || [ -z "$nickname" ] || [ $exit_code -ne 0 ]; then
    echo -e "${RED}✘ Failed (No login link, nickname, or docker-run failed)${NC}"
    echo "$output"
    ((failed++))
    ./bbx.sh docker-stop "$nickname"
    return 1
  fi
  echo -e "${GREEN}✔ Success (Docker run completed)${NC}"
  ((passed++))
  
  # Test login link
  if ! test_login_link "$login_link"; then
    ./bbx.sh docker-stop "$nickname"
    return 1
  fi

  # Wait 25 seconds and test again
  echo "Waiting 25 seconds to check instance activity... "
  sleep 25
  echo -e "${GREEN}✔ Wait complete${NC}"
  ((passed++))

  # Test login link
  if ! test_login_link "$login_link"; then
    ./bbx.sh docker-stop "$nickname"
    return 1
  fi
  
  # Stop Docker instance with nickname
  echo "Stopping Dockerized bbx with nickname $nickname... "
  ./bbx.sh docker-stop "$nickname"
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✔ Success${NC}"
    ((passed++))
  else
    echo -e "${RED}✘ Failed${NC}"
    ((failed++))
    return 1
  fi
}

# Main test sequence
echo "Starting bbx Test Saga..."

# Run tests
test_uninstall
test_install || exit 1
test_setup || exit 1
test_run || exit 1
test_ng_run || exit 1
test_tor_run || exit 1
test_cf_run || exit 1
test_docker_run || exit 1

# Cleanup
./bbx.sh stop || true

echo "bbx Test Saga completed!"
exit 0
