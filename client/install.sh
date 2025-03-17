#!/bin/bash

# Script: install_easyocr.sh
# Purpose: Install EasyOCR and dependencies in a virtual environment

# Exit on error
set -e

# Variables
MIN_PYTHON_VERSION="3.8" # EasyOCR supports Python 3.8+
VENV_DIR="$HOME/easyocr_venv"
EASYOCR_VERSION="1.7.1" # Latest stable version as of recent data

# Check for Python 3.8+
if ! command -v python3 &> /dev/null; then
  echo "Error: Python 3 is not installed. Please install Python $MIN_PYTHON_VERSION or higher."
  exit 1
fi

# Get Python version
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
PYTHON_MAJOR_MINOR=$(echo "$PYTHON_VERSION" | cut -d'.' -f1,2)
if ! echo "$PYTHON_MAJOR_MINOR" | grep -qE "^[3]\.[8-9]$|^[3]\.[1-9][0-9]$|^[4]\.[0-9]$"; then
  echo "Error: Python $MIN_PYTHON_VERSION or higher is required. Found: $PYTHON_VERSION"
  exit 1
fi

echo "Found Python $PYTHON_VERSION, proceeding..."

# Create and activate virtual environment
echo "Creating virtual environment at $VENV_DIR..."
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install PyTorch (CPU version for simplicity; adjust for GPU if needed)
echo "Installing PyTorch (CPU version)..."
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install EasyOCR
echo "Installing EasyOCR version $EASYOCR_VERSION..."
pip install easyocr==$EASYOCR_VERSION

# Install additional dependencies for HTTP and WebSocket
echo "Installing HTTP and WebSocket dependencies..."
pip install requests websocket-client

# Install terminal-kit equivalent (blessed for TUI)
echo "Installing Blessed for terminal UI..."
pip install blessed

# Verify installation
echo "Verifying installations..."
python -c "import easyocr; print('EasyOCR installed successfully:', easyocr.__version__)"
python -c "import torch; print('PyTorch installed successfully:', torch.__version__)"
python -c "import requests; print('Requests installed successfully')"
python -c "import websocket; print('WebSocket installed successfully')"
python -c "import blessed; print('Blessed installed successfully')"

# Deactivate virtual environment
deactivate

echo "Installation complete! Activate the environment with: source $VENV_DIR/bin/activate"
