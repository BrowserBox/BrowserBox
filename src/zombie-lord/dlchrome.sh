#!/usr/bin/env bash

# Function to determine the package manager and set appropriate variables
determine_package_manager() {
  if command -v apt >/dev/null; then
    PM_UPDATE="apt update"
    PM_INSTALL="apt install -y"
    PM_FIX="apt --fix-broken install -y"
    CHROME_PACKAGE="google-chrome-stable_current_amd64.deb"
    CHROME_INSTALL="dpkg -i"
  elif command -v dnf >/dev/null; then
    PM_UPDATE="dnf check-update"
    PM_INSTALL="dnf install -y"
    PM_FIX=""
    CHROME_PACKAGE="google-chrome-stable_current_$(uname -m).rpm"
    CHROME_INSTALL="dnf install -y"
  else
    echo "No supported package manager found."
    exit 1
  fi
}

# Detect package manager
determine_package_manager

# Download Google Chrome
wget "https://dl.google.com/linux/direct/$CHROME_PACKAGE"

# Install Google Chrome
if [[ -f "$CHROME_PACKAGE" ]]; then
  if [[ $CHROME_INSTALL == "dpkg -i" ]]; then
    sudo $CHROME_INSTALL "$CHROME_PACKAGE"
    sudo $PM_FIX
  else
    sudo $PM_INSTALL "$CHROME_PACKAGE"
  fi
  rm -f "$CHROME_PACKAGE"
else
  echo "Failed to download Google Chrome."
  exit 1
fi

