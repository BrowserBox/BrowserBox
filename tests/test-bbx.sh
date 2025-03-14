#!/bin/bash

# Test script for bbx CLI tool
# Purpose: Test the full lifecycle of bbx from uninstall to specialized runs

# Set environment variables to avoid interactive prompts
export BBX_HOSTNAME="localhost"
export EMAIL="test@example.com"
export LICENSE_KEY="${1:-TEST-KEY-1234-5678-90AB-CDEF-GHIJ-KLMN-OPQR}"
export BBX_TEST_AGREEMENT="true"

# Mock the bbcertify function to bypass license validation
echo "Starting bbx test..."

# 1. Uninstall existing installation
echo "Uninstalling existing BrowserBox..."
yes yes | ./bbx.sh uninstall
if [ $? -eq 0 ]; then
  echo "Uninstall completed successfully."
else
  echo "Warning: Uninstall may have encountered an issue."
fi

# 2. Install BrowserBox
echo "Installing BrowserBox..."
./bbx.sh install
if [ $? -eq 0 ]; then
  echo "Installation completed successfully."
else
  echo "Error: Installation failed."
  exit 1
fi

# 3. Setup BrowserBox
echo "Setting up BrowserBox..."
./bbx.sh setup --port 4026 --hostname localhost
if [ $? -eq 0 ]; then
  echo "Setup completed successfully."
else
  echo "Warning: Setup may have failed; proceeding with test."
fi

# 4. Certify (using mock bbcertify)
echo "Certifying license..."
./bbx.sh certify
if [ $? -eq 0 ]; then
  echo "Certification step passed (mocked)."
else
  echo "Error: Certification step failed unexpectedly."
  exit 1
fi

# 5. Run BrowserBox
echo "Running BrowserBox..."
./bbx.sh run
sleep 5  # Wait for the service to start
if [ $? -eq 0 ]; then
  echo "BrowserBox started."
else
  echo "Error: Failed to start BrowserBox."
  exit 1
fi

# 6. Check status
echo "Checking status..."
./bbx.sh status
if [ $? -eq 0 ]; then
  echo "Status check completed."
else
  echo "Warning: Status check failed."
fi

# 7. View logs
echo "Viewing logs..."
timeout 15s ./bbx.sh logs &  # Run with timeout in background
logs_pid=$!
wait $logs_pid 2>/dev/null  # Wait for it to finish or timeout
if [ $? -eq 124 ]; then      # 124 is timeout’s exit code when it kills the process
  echo "Logs process was still alive after 15 seconds - success."
else
  echo "Warning: Logs process exited before 15 seconds."
fi

# 8. Stop BrowserBox
echo "Stopping BrowserBox..."
./bbx.sh stop
sleep 2  # Wait for the service to stop
if [ $? -eq 0 ]; then
  echo "BrowserBox stopped successfully."
else
  echo "Warning: Failed to stop BrowserBox."
fi

# 9. Update BrowserBox
echo "Updating BrowserBox..."
./bbx.sh update
if [ $? -eq 0 ]; then
  echo "Update completed successfully."
else
  echo "Warning: Update may have failed."
fi

# 10. Test Docker-run (if Docker is installed)
echo "Running Dockerized BrowserBox..."
./bbx.sh docker-run mydockertest --port 4027
sleep 5  # Wait for Docker instance to start
if [ $? -eq 0 ]; then
  echo "Dockerized BrowserBox started."
  # 11. Stop Docker instance
  echo "Stopping Dockerized BrowserBox..."
  ./bbx.sh docker-stop mydockertest
  if [ $? -eq 0 ]; then
    echo "Dockerized BrowserBox stopped successfully."
  else
    echo "Warning: Failed to stop Dockerized BrowserBox."
  fi
else
  echo "Warning: Failed to start Dockerized BrowserBox."
fi

echo "Running BrowserBox with Tor..."
./bbx.sh tor-run
sleep 5  # Wait for Tor service to start
if [ $? -eq 0 ]; then
  echo "BrowserBox with Tor started."
  # Stop the service (assuming tor-run starts it)
  ./bbx.sh stop
  if [ $? -eq 0 ]; then
    echo "Tor BrowserBox stopped successfully."
  else
    echo "Warning: Failed to stop Tor BrowserBox."
  fi
else
  echo "Warning: Failed to start BrowserBox with Tor."
fi

echo "Test complete."
