#!/usr/bin/env bash

# Cross-platform script to install dependencies for Node.js audio packages (ALSA and node-gyp)
# Detects OS and package manager, installs ALSA libraries (Linux) and build tools

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

        echo "ℹ️ For audio on macOS, packages like 'speaker' may use CoreAudio instead."
        echo "Ensure you have Xcode Command Line Tools installed:"
        xcode-select --install || true

    else
        echo "❌ Unsupported OS detected: $OSTYPE"
        echo "This script supports Linux (Ubuntu, Fedora, Arch, openSUSE) and macOS."
        echo "Please install Python3 and build tools manually for your system."
        exit 1
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

    if command_exists python3; then
        echo "🐍 Python3 is installed: $(python3 --version)"
    else
        echo "⚠️ Python3 not found. Please install it manually."
    fi

    if command_exists make && command_exists gcc; then
        echo "🛠️ Build tools (make, gcc) are ready!"
    else
        echo "⚠️ Build tools missing. Please install 'build-essential' or equivalent."
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

# Verify results
verify_installation

echo "🎊 All done! You're ready to run 'npm install' again."
echo "If you hit any issues, just let me know—we'll sort it out together!"
