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
    CHROMIUM_PACKAGE="chromium"
  elif command -v dnf >/dev/null; then
    PM_UPDATE="dnf check-update"
    PM_INSTALL="dnf install -y"
    PM_FIX=""
    CHROME_PACKAGE="google-chrome-stable_current_$(uname -m).rpm"
    CHROME_INSTALL="dnf install -y"
    CHROMIUM_PACKAGE="chromium"
  else
    echo "No supported package manager found."
    exit 1
  fi
}

# Function to check if running inside a Docker container
is_docker() {
  if [ -f /.dockerenv ]; then
    return 0
  elif [[ -n "$IS_DOCKER_BUILD" ]]; then
    return 0
  else
    return 1
  fi
}

is_arm() {
  uname -a | grep -q arm64;
}

is_macos() { [[ "$(uname -s)" == "Darwin" ]]; }

# Function to install Chromium instead of Google Chrome if in Docker
install_browser() {
  if is_arm && ! is_macos; then
    echo "Running inside Docker or ARM. Installing Chromium instead of Google Chrome."
    $sudo $PM_UPDATE
    $sudo $PM_INSTALL $CHROMIUM_PACKAGE
  else
    install_chrome
  fi
}

# Function to install Google Chrome
install_chrome() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # Check if Google Chrome is already installed
    if [ ! -d "$CHROME_CHECK" ]; then
      # Run Homebrew update and install Google Chrome
      if ! eval "$PM_UPDATE"; then return 1; fi
      if ! eval "$CHROME_INSTALL $CHROME_PACKAGE"; then return 1; fi
    else
      echo "Google Chrome is already installed."
      return 0
    fi
  else
    # Download Google Chrome for Linux
    rm -f "$CHROME_PACKAGE"
    if ! wget "https://dl.google.com/linux/direct/$CHROME_PACKAGE" -O "$CHROME_PACKAGE"; then
      echo "Failed to download Google Chrome."
      return 1
    fi
    
    # Install Google Chrome
    if [[ -f "$CHROME_PACKAGE" ]]; then
      if [[ $CHROME_INSTALL == "dpkg -i" ]]; then
        if ! $sudo $CHROME_INSTALL "$CHROME_PACKAGE"; then
          $sudo $PM_FIX
        fi
      else
        if ! $sudo $PM_INSTALL "$CHROME_PACKAGE"; then return 1; fi
      fi
      rm -f "$CHROME_PACKAGE"
    else
      echo "The Chrome package was not found after download."
      return 1
    fi
  fi
}

# Detect package manager
determine_package_manager

# Attempt installation with retries
RETRIES=0
until install_browser; do
  ((RETRIES++))
  echo "Attempt $RETRIES failed! Trying again in $RETRY_DELAY seconds..."
  if [ "$RETRIES" -ge "$MAX_RETRIES" ]; then
    echo "Maximum number of retries reached. Installation failed."
    exit 1
  fi
  sleep $RETRY_DELAY
done

# Verify the installation was successful
if [ "$?" -eq 0 ]; then
  echo "Browser installed successfully."
else
  echo "Browser installation failed."
fi

