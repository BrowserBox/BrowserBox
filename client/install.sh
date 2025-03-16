#!/bin/bash

# Script: install_surya.sh
# Purpose: Install Surya OCR and dependencies in a virtual environment

# Exit on error
set -e

# Variables
MIN_PYTHON_VERSION="3.10"
VENV_DIR="$HOME/surya_venv"
SURYA_VERSION="0.13.0" # Latest as of recent data, adjust if needed

# Check for Python 3.10+
if ! command -v python3 &> /dev/null; then
  echo "Error: Python 3 is not installed. Please install Python $MIN_PYTHON_VERSION or higher."
  exit 1
fi

# Get Python version
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
PYTHON_MAJOR_MINOR=$(echo "$PYTHON_VERSION" | cut -d'.' -f1,2)
if ! echo "$PYTHON_MAJOR_MINOR" | grep -qE "^[3]\.[1][0-9]$|^[3]\.[2-9]$"; then
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

# Install Pillow (PIL)
echo "Installing Pillow..."
pip install Pillow

# Install Surya OCR
echo "Installing Surya OCR version $SURYA_VERSION..."
pip install surya-ocr==$SURYA_VERSION

# Verify installation
echo "Verifying Surya installation..."
python -c "import surya; print('Surya OCR installed successfully:', surya.__version__)"
python -c "import PIL; print('Pillow installed successfully:', PIL.__version__)"

# Deactivate virtual environment
deactivate

echo "Installation complete! Activate the environment with: source $VENV_DIR/bin/activate"
