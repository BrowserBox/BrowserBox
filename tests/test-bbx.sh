#!/bin/bash

# Test script for BBX CLI in BrowserBox repository
# Displays output directly in terminal

set -x

# ANSI colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

# Counters for summary
passed=0
failed=0
warnings=0

# Exit trap for summary
trap 'echo -e "\n${NC}Test Summary:"; \
      echo -e "${GREEN}Passed: $passed${NC}"; \
      echo -e "${RED}Failed: $failed${NC}"; \
      echo -e "${YELLOW}Warnings: $warnings${NC}"' EXIT

# Environment variables
export BBX_HOSTNAME="${BBX_HOSTNAME:-localhost}"
export EMAIL="${EMAIL:-test@example.com}"
export LICENSE_KEY="${LICENSE_KEY:-TEST-KEY-1234-5678-90AB-CDEF-GHIJ-KLMN-OPQR}"
export BBX_TEST_AGREEMENT="${BBX_TEST_AGREEMENT:-true}"

# Function to extract login link from bbx output (cross-platform)
extract_login_link() {
  local output="$1"
  echo "$output" | sed -n 's/.*Login Link: \(https\?:\/\/[^\s]*\).*/\1/p' | head -n 1
}

# Function to extract nickname from docker-run output (cross-platform)
extract_nickname() {
  local output="$1"
  echo "$output" | sed -n 's/.*Nickname: \([^\s]*\).*/\1/p' | head -n 1
}

# Function to test login link with curl
test_login_link() {
  local link="$1"
  echo "Testing login link $link... "
  # Use -k to bypass cert errors if needed, -L to follow redirects
  if curl -k -L -s -o /dev/null -w "%{http_code}" "$link" | grep -q "^2"; then
    echo -e "${GREEN}✔ Success (HTTP 2xx)${NC}"
    ((passed++))
    return 0
  else
    echo -e "${RED}✘ Failed${NC}"
    ((failed++))
    return 1
  fi
}

# Function to test Tor login link with curl via SOCKS
test_tor_login_link() {
  local link="$1"
  echo "Testing Tor login link $link... "
  # Assume Tor is running on localhost:9050 (default SOCKS port, managed by bbx)
  if curl -k -L -s --socks5-hostname localhost:9050 -o /dev/null -w "%{http_code}" "$link" | grep -q "^2"; then
    echo -e "${GREEN}✔ Success (HTTP 2xx via Tor)${NC}"
    ((passed++))
    return 0
  else
    echo -e "${RED}✘ Failed${NC}"
    ((failed++))
    return 1
  fi
}

# Test functions
test_uninstall() {
  echo "Uninstalling BBX... "
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
  echo "Installing BBX... "
  ./bbx.sh install
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✔ Success${NC}"
    ((passed++))
  else
    echo -e "${RED}✘ Failed${NC}"
    ((failed++))
    exit 1
  fi
}

test_setup() {
  echo "Setting up BBX... "
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
  echo "Running BBX... "
  output=$(./bbx.sh run 2>&1)  # Corrected path to ./bbx.sh
  echo $output
  exit_code=$?
  login_link=$(extract_login_link "$output")
  if [ -z "$login_link" ] || [ $exit_code -ne 0 ]; then
    echo -e "${RED}✘ Failed (No login link or run failed)${NC}"
    ((failed++))
    return 1
  fi
  echo -e "${GREEN}✔ Success (Run completed)${NC}"
  ((passed++))
  
  # Test login link immediately
  test_login_link "$login_link" || return 1
  
  # Wait 150 seconds and test again
  echo "Waiting 150 seconds to check instance activity... "
  sleep 150
  echo -e "${GREEN}✔ Wait complete${NC}"
  ((passed++))
  test_login_link "$login_link" || return 1
}

test_tor_run() {
  echo "Running BBX with Tor... "
  output=$(./bbx.sh tor-run)  # Corrected path to ./bbx.sh
  exit_code=$?
  login_link=$(extract_login_link "$output")
  if [ -z "$login_link" ] || [ $exit_code -ne 0 ]; then
    echo -e "${RED}✘ Failed (No login link or tor-run failed)${NC}"
    ((failed++))
    return 1
  fi
  echo -e "${GREEN}✔ Success (Tor run completed)${NC}"
  ((passed++))
  
  # Test Tor login link (bbx handles Tor, we just use SOCKS)
  test_tor_login_link "$login_link" || return 1
}

test_docker_run() {
  echo "Running Dockerized BBX... "
  output=$(./bbx.sh docker-run)  # Corrected path to ./bbx.sh
  exit_code=$?
  login_link=$(extract_login_link "$output")
  nickname=$(extract_nickname "$output")
  if [ -z "$login_link" ] || [ -z "$nickname" ] || [ $exit_code -ne 0 ]; then
    echo -e "${RED}✘ Failed (No login link, nickname, or docker-run failed)${NC}"
    ((failed++))
    return 1
  fi
  echo -e "${GREEN}✔ Success (Docker run completed)${NC}"
  ((passed++))
  
  # Test login link
  test_login_link "$login_link" || return 1
  
  # Stop Docker instance with nickname
  echo "Stopping Dockerized BBX with nickname $nickname... "
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
echo "Starting BBX Test Saga..."

# Run tests
test_uninstall
test_install || exit 1
test_setup || exit 1
test_run || exit 1
test_tor_run || exit 1
test_docker_run || exit 1

# Cleanup
./bbx.sh stop || true
rm -f $HOME/BBPRO.INTEGRITY || true

echo "BBX Test Saga completed!"
exit 0
