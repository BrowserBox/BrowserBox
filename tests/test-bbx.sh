#!/bin/bash

# Test script for bbx CLI tool
# Purpose: Test the full lifecycle of bbx from uninstall to specialized runs

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Counters for summary
passed=0
failed=0
warnings=0

# Exit trap for summary
trap 'echo -e "\n${NC}Test Summary:"; \
      echo -e "${GREEN}Passed: $passed${NC}"; \
      echo -e "${RED}Failed: $failed${NC}"; \
      echo -e "${YELLOW}Warnings: $warnings${NC}"' EXIT

# Set environment variables to avoid interactive prompts
export BBX_HOSTNAME="localhost"
export EMAIL="test@example.com"
export LICENSE_KEY="${1:-TEST-KEY-1234-5678-90AB-CDEF-GHIJ-KLMN-OPQR}"
export BBX_TEST_AGREEMENT="true"

echo "Starting bbx test..."

# 1. Uninstall existing installation
echo -n "Uninstalling existing BrowserBox... "
yes yes | ./bbx.sh uninstall
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✔ Success${NC}"
  ((passed++))
else
  echo -e "${YELLOW}⚠ Warning: Uninstall may have issues${NC}"
  ((warnings++))
fi

# 2. Install BrowserBox
echo -n "Installing BrowserBox... "
./bbx.sh install
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✔ Success${NC}"
  ((passed++))
else
  echo -e "${RED}✘ Failed${NC}"
  ((failed++))
  exit 1
fi

# 3. Setup BrowserBox
echo -n "Setting up BrowserBox... "
./bbx.sh setup --port 4026 --hostname localhost
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✔ Success${NC}"
  ((passed++))
else
  echo -e "${YELLOW}⚠ Warning: Setup may have failed${NC}"
  ((warnings++))
fi

# 4. Certify (mocked)
echo -n "Certifying license... "
./bbx.sh certify
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✔ Success (mocked)${NC}"
  ((passed++))
else
  echo -e "${RED}✘ Failed${NC}"
  ((failed++))
  exit 1
fi

# 5. Run BrowserBox
echo -n "Running BrowserBox... "
./bbx.sh run
sleep 5
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✔ Success${NC}"
  ((passed++))
else
  echo -e "${RED}✘ Failed${NC}"
  ((failed++))
  exit 1
fi

# 6. Check status
echo -n "Checking status... "
./bbx.sh status
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✔ Success${NC}"
  ((passed++))
else
  echo -e "${YELLOW}⚠ Warning: Status check failed${NC}"
  ((warnings++))
fi

# 7. View logs
echo -n "Viewing logs... "
timeout 15s ./bbx.sh logs &
logs_pid=$!
wait $logs_pid 2>/dev/null
if [ $? -eq 124 ]; then
  echo -e "${GREEN}✔ Success (alive after 15s)${NC}"
  ((passed++))
else
  echo -e "${YELLOW}⚠ Warning: Exited early${NC}"
  ((warnings++))
fi

# 8. Stop BrowserBox
echo -n "Stopping BrowserBox... "
./bbx.sh stop
sleep 2
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✔ Success${NC}"
  ((passed++))
else
  echo -e "${YELLOW}⚠ Warning: Stop failed${NC}"
  ((warnings++))
fi

# 9. Update BrowserBox
echo -n "Updating BrowserBox... "
./bbx.sh update
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✔ Success${NC}"
  ((passed++))
else
  echo -e "${YELLOW}⚠ Warning: Update may have failed${NC}"
  ((warnings++))
fi

# 10. Test Docker-run
echo -n "Running Dockerized BrowserBox... "
./bbx.sh docker-run mydockertest --port 4027
sleep 5
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✔ Success${NC}"
  ((passed++))
  # 11. Stop Docker instance
  echo -n "Stopping Dockerized BrowserBox... "
  ./bbx.sh docker-stop mydockertest
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✔ Success${NC}"
    ((passed++))
  else
    echo -e "${YELLOW}⚠ Warning: Stop failed${NC}"
    ((warnings++))
  fi
else
  echo -e "${YELLOW}⚠ Warning: Start failed${NC}"
  ((warnings++))
fi

# 12. Test Tor-run
echo -n "Running BrowserBox with Tor... "
./bbx.sh tor-run
sleep 5
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✔ Success${NC}"
  ((passed++))
  # Stop the service
  echo -n "Stopping Tor BrowserBox... "
  ./bbx.sh stop
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✔ Success${NC}"
    ((passed++))
  else
    echo -e "${YELLOW}⚠ Warning: Stop failed${NC}"
    ((warnings++))
  fi
else
  echo -e "${YELLOW}⚠ Warning: Start failed${NC}"
  ((warnings++))
fi

echo "Test complete."
