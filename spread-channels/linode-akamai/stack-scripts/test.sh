#!/usr/bin/env bash

# Default values for testing (mimic StackScript UDF defaults)
USEREMAIL="${1:-testuser@fake.com}"                    # Arg 1 or default
HOSTNAME="${2:-test.local}"                            # Arg 2 or default
TOKEN="${3:-}"                                         # Arg 3 or blank (auto-gen in script)
INSTALL_DOC_VIEWER="${INSTALL_DOC_VIEWER:-false}"      # Env var or false
UNDERSTANDING="${UNDERSTANDING:-true}"                 # Env var or true
LICENSE_KEY_PASSWORD="${4:-testkey123}"                # Arg 4 or default
USE_DOCKER="${USE_DOCKER:-false}"                      # Env var or false

# Export for StackScript compatibility
export USEREMAIL HOSTNAME TOKEN INSTALL_DOC_VIEWER UNDERSTANDING LICENSE_KEY_PASSWORD USE_DOCKER

# Echo for verification
echo "=== Test Environment Variables ==="
echo "USEREMAIL=$USEREMAIL"
echo "HOSTNAME=$HOSTNAME"
echo "TOKEN=$TOKEN"
echo "INSTALL_DOC_VIEWER=$INSTALL_DOC_VIEWER"
echo "UNDERSTANDING=$UNDERSTANDING"
echo "LICENSE_KEY_PASSWORD=$LICENSE_KEY_PASSWORD"
echo "USE_DOCKER=$USE_DOCKER"
echo "==============================="
