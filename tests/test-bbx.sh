#!/bin/bash

# Test script for bbx CLI in BrowserBox repository
# Displays output directly in terminal

if [[ -z "$STATUS_MODE" ]]; then
  echo "Set status mode env" >&2
  exit 1
fi

export STATUS_MODE="${STATUS_MODE}"

if [[ -z "$LICENSE_KEY" ]]; then
  echo "Set license key env" >&2
  exit 1
fi
export LICENSE_KEY="${LICENSE_KEY}"

rm $(bbcertify)

  # ANSI colors
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  NC='\033[0m'

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

  # Environment variables
  export bbx_HOSTNAME="${bbx_HOSTNAME:-localhost}"
  export EMAIL="${EMAIL:-test@example.com}"
  export LICENSE_KEY="${LICENSE_KEY:-TEST-KEY-1234-5678-90AB-CDEF-GHIJ-KLMN-OPQR}"
  export bbx_TEST_AGREEMENT="${bbx_TEST_AGREEMENT:-true}"

  # Function to extract login link from bbx output (cross-platform)
    extract_login_link() {
      local output="$1"
      echo "$output" | grep -E -o 'https?://[^ ]+'
    }

  # Function to extract nickname from docker-run output (cross-platform)
    extract_nickname() {
      local output="$1"
      echo "$output" | sed -n 's/.*Nickname: \([^\s]*\).*/\1/p' | head -n 1
    }

  # Function to test login link with curl
    test_login_link() {
      local link="$1"                # The URL to test
      local use_tor="$2"             # Optional: "tor" to use Tor SOCKS proxy
      local start_time=$(date +%s)   # Record the start time in seconds
      local max_time=30             # Maximum wait time in seconds
      local interval=2               # Time between retries in seconds
      local timeout=5
      local success=0                # Flag to track success
      local http_code=""             # Variable to store the HTTP status code
      local curl_opts="-s -k -L -w %{http_code} --max-time $timeout --head --fail --output /dev/null"

      # Add Tor SOCKS proxy if specified
      if [ "$use_tor" = "tor" ]; then
        curl_opts="$curl_opts --proxy socks5h://127.0.0.1:9050"
        interval=5
        timeout=25
        max_time=120
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
        ((passed++))  # Increment passed counter (assumes it’s defined elsewhere)
        return 0      # Success
      else
        echo -e "${RED}✘ Failed after $max_time seconds${NC}"
        ((failed++))  # Increment failed counter (assumes it’s defined elsewhere)
        return 1      # Failure
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
      yes yes | ./bbx.sh install
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
      output="$(./bbx.sh run 2>&1)" # Corrected path to ./bbx.sh
      exit_code=$?
      login_link="$(extract_login_link "$output")"
      if [ -z "$login_link" ] || [ $exit_code -ne 0 ]; then
        echo -e "${RED}✘ Failed (No login link or run failed)${NC}"
        echo $output
        ((failed++))
        ./bbx.sh stop
        return 1
      fi
      echo -e "${GREEN}✔ Success (Run completed)${NC}"
      ((passed++))
      
      # Test login link immediately
      if ! test_login_link "$login_link"; then
        ./bbx.sh stop; 
        return 1
      fi
      
      # Wait 25 seconds and test again
      echo "Waiting 25 seconds to check instance activity... "
      sleep 25 
      echo -e "${GREEN}✔ Wait complete${NC}"
      ((passed++))
      if ! test_login_link "$login_link"; then
        ./bbx.sh stop; 
        return 1
      fi
      ./bbx.sh stop
    }

    test_tor_run() {
      echo "Running bbx with Tor... "
      output="$(./bbx.sh tor-run 2>&1)"  # Corrected path to ./bbx.sh
      echo $output
      exit_code=$?
      login_link="$(extract_login_link "$output" | tail -n 1)"
      if [ -z "$login_link" ] || [ $exit_code -ne 0 ]; then
        echo -e "${RED}✘ Failed (No login link or tor-run failed)${NC}"
        echo $output
        ((failed++))
        ./bbx.sh stop;
        return 1
      fi
      echo -e "${GREEN}✔ Success (Tor run completed)${NC}"
      ((passed++))
      
      # Test login link immediately
      if ! test_login_link "$login_link" "tor"; then
        ./bbx.sh stop; 
        return 1
      fi
      
      # Wait 25 seconds and test again
      echo "Waiting 25 seconds to check instance activity... "
      sleep 25
      echo -e "${GREEN}✔ Wait complete${NC}"
      ((passed++))
      if ! test_login_link "$login_link" "tor"; then
        ./bbx.sh stop; 
        return 1
      fi
      ./bbx.sh stop
    }

    test_docker_run() {
      echo "Running Dockerized bbx... "
      nickname="test-docker"
      output="$(./bbx.sh docker-run $nickname 2>&1)"  # Corrected path to ./bbx.sh
      echo "$output"
      exit_code=$?
      login_link="$(extract_login_link "$output")"
      if [ -z "$login_link" ] || [ -z "$nickname" ] || [ $exit_code -ne 0 ]; then
        echo -e "${RED}✘ Failed (No login link, nickname, or docker-run failed)${NC}"
        echo $output
        ((failed++))
        ./bbx.sh docker-stop $nickname
        return 1
      fi
      echo -e "${GREEN}✔ Success (Docker run completed)${NC}"
      ((passed++))
      
      # Test login link
      if test_login_link "$login_link"; then 
        ./bbx.sh docker-stop $nickname ;
        return 1
      fi

      # Wait 25 seconds and test again
      echo "Waiting 25 seconds to check instance activity... "
      sleep 25
      echo -e "${GREEN}✔ Wait complete${NC}"
      ((passed++))

      # Test login link
      if test_login_link "$login_link"; then 
        ./bbx.sh docker-stop $nickname ;
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
  test_tor_run || exit 1
  test_docker_run || exit 1

  # Cleanup
  ./bbx.sh stop || true

  echo "bbx Test Saga completed!"
  exit 0
