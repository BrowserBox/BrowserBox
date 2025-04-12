#!/usr/bin/env bash

# Cross-platform script to install dependencies for Node.js audio packages
# Installs ALSA (Linux), build tools, and conditionally installs 'speaker' (skips on Windows)

echo "🚀 Let's get those Node.js audio dependencies installed!"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if sudo is available
check_sudo() {
    if ! command_exists sudo; then
        echo "⚠️ Warning: 'sudo' is required for installing packages. Please run as root or install sudo."
        exit 1
    fi
}

# Function to install dependencies based on OS and package manager
install_dependencies() {
    echo "🔍 Detecting your operating system..."

    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "🐧 Looks like you're on Linux!"

        # Detect package manager
        if command_exists apt-get; then
            echo "📦 Using apt (Ubuntu/Debian)"
            check_sudo
            sudo apt-get update
            sudo apt-get install -y libasound2-dev python3 build-essential
        elif command_exists dnf; then
            echo "📦 Using dnf (Fedora)"
            check_sudo
            sudo dnf install -y alsa-lib-devel python3 gcc-c++ make
        elif command_exists pacman; then
            echo "📦 Using pacman (Arch Linux)"
            check_sudo
            sudo pacman -Sy --noconfirm alsa-lib python3 base-devel
        elif command_exists zypper; then
            echo "📦 Using zypper (openSUSE)"
            check_sudo
            sudo zypper install -y alsa-devel python3 gcc-c++ make
        else
            echo "❌ Sorry, I couldn't detect a supported package manager (apt, dnf, pacman, or zypper)."
            echo "Please install 'libasound2-dev' (or equivalent) and build tools (python3, gcc, make) manually."
            exit 1
        fi

    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "🍎 Looks like you're on macOS!"
        echo "ℹ️ ALSA is Linux-specific, so we'll install Node.js build tools only."

        if command_exists brew; then
            echo "📦 Using Homebrew"
            brew install python3
        else
            echo "⚠️ Homebrew not found. Installing it..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            brew install python3
        fi

        echo "ℹ️ For audio on macOS, packages like 'speaker' use CoreAudio."
        echo "Ensure you have Xcode Command Line Tools installed:"
        xcode-select --install || true

    elif [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "win32"* || "$OSTYPE" == "cygwin"* ]]; then
        echo "🪟 Looks like you're on Windows!"
        echo "Not installing anything..."
        exit 0
    else
        echo "❌ Unsupported OS detected: $OSTYPE"
        echo "This script supports Linux (Ubuntu, Fedora, Arch, openSUSE), macOS, and Windows."
        echo "Please install Python3 and build tools manually for your system."
        exit 0
    fi
}

# Function to conditionally install speaker
install_speaker() {
    echo "🎵 Checking if we should install 'speaker'..."

    if [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "win32"* || "$OSTYPE" == "cygwin"* ]]; then
        echo "ℹ️ On Windows, we'll skip installing 'speaker'."
    else
        echo "📦 Installing 'speaker' for audio support..."
        source ~/.nvm/nvm.sh
        npm install speaker
        if [ $? -eq 0 ]; then
            echo "🎉 'speaker' installed successfully!"
        else
            echo "⚠️ Failed to install 'speaker'. You may need to check your setup or try manually."
        fi
    fi
}

# Function to verify installations
verify_installation() {
    echo "✅ Verifying installations..."

    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [[ -f /usr/include/alsa/asoundlib.h || -f /usr/local/include/alsa/asoundlib.h ]]; then
            echo "🎉 ALSA development headers found!"
        else
            echo "⚠️ ALSA headers not found. Installation may have failed."
        fi
    fi

    if command_exists python3 || command_exists python; then
        echo "🐍 Python is installed: $(python3 --version || python --version)"
    else
        echo "⚠️ Python not found. Please install it manually."
    fi

    if [[ "$OSTYPE" != "msys"* && "$OSTYPE" != "win32"* && "$OSTYPE" != "cygwin"* ]]; then
        if command_exists make && command_exists gcc; then
            echo "🛠️ Build tools (make, gcc) are ready!"
        else
            echo "⚠️ Build tools missing. Please install 'build-essential' or equivalent."
        fi
    fi
}

# Main execution
echo "🌟 Starting dependency installation..."

# Check if we're in a supported environment
if ! command_exists bash; then
    echo "❌ This script requires bash. Please run it in a bash-compatible shell."
    exit 1
fi

# Run installation
install_dependencies
install_speaker

# Verify results
verify_installation

echo "🎊 All done! You're ready to run your project."
echo "If you need anything else, we're in this together!"
