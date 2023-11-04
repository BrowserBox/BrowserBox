#!/usr/bin/env bash

sudo=""
if command -v sudo; then
  sudo=$(command -v sudo)
fi

MAX_RETRIES=3
RETRY_DELAY=5 # seconds to wait between retries

# Function to determine the package manager and set appropriate variables
determine_package_manager() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS systems
    PM_UPDATE="brew update"
    PM_INSTALL="brew install --cask"
    PM_FIX=""
    CHROME_PACKAGE="google-chrome"
    CHROME_INSTALL="$PM_INSTALL"
    CHROME_CHECK="/Applications/Google Chrome.app"
  elif command -v apt >/dev/null; then
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

# Function to install Google Chrome
install_chrome() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # Check if Google Chrome is already installed
    if [ ! -d "$CHROME_CHECK" ]; then
      # Run Homebrew update
      eval "$PM_UPDATE" && eval "$CHROME_INSTALL $CHROME_PACKAGE"
    else
      echo "Google Chrome is already installed."
      exit 0
    fi
  else
    # Download Google Chrome for Linux
    wget "https://dl.google.com/linux/direct/$CHROME_PACKAGE" && \
    if [[ -f "$CHROME_PACKAGE" ]]; then
      if [[ $CHROME_INSTALL == "dpkg -i" ]]; then
        $sudo $CHROME_INSTALL "$CHROME_PACKAGE" && $sudo $PM_FIX
      else
        $sudo $PM_INSTALL "$CHROME_PACKAGE"
      fi
      rm -f "$CHROME_PACKAGE"
    else
      echo "Failed to download Google Chrome."
      return 1
    fi
  fi
}

# Detect package manager
determine_package_manager

# Attempt installation with retries
RETRIES=0
until install_chrome; do
  ((RETRIES++))
  echo "Attempt $RETRIES failed! Trying again in $RETRY_DELAY seconds..."
  if [ "$RETRIES" -ge "$MAX_RETRIES" ]; then
    echo "Maximum number of retries reached. Installation failed."
    exit 1
  fi
  sleep $RETRY_DELAY
done
echo "Google Chrome installed successfully."

