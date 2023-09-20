
# Core Functions

# Get-InstallDir Function
function Get-InstallDir {
  $installPath = Get-ChildItem -Path $env:USERPROFILE -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq ".bbpro_install_dir" } | Select-Object -First 1
  if ($installPath -ne $null) {
    $installDir = Split-Path $installPath.FullName -Parent
    return $installDir
  }
  else {
    Write-Host "Could not find .bbpro_install_dir"
    return $null
  }
}

# Get-OSType Function
function Get-OSType {
  switch ($env:OS) {
    "Windows_NT" { return "Windows" }
    default      { return "Unknown" }
  }
}

# Install-NVM Function
function Install-NVM {
  # Check if nvm is installed
  if (-Not (Get-Command nvm -ErrorAction SilentlyContinue)) {
    Write-Host "Installing nvm..."
    # Download and install nvm
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/coreybutler/nvm-windows/master/nvm-setup.zip" -OutFile "nvm-setup.zip"
    Expand-Archive -Path "nvm-setup.zip" -DestinationPath "$env:TEMP\nvm-setup"
    Start-Process -Wait -FilePath "$env:TEMP\nvm-setup\nvm-setup.exe"
    # Reload environment variables
    Update-Environment
    # Install LTS version of Node.js
    nvm install --lts
  } else {
    Write-Host "nvm is already installed."
  }
}

# Update environment variables without restarting the shell
function Update-Environment {
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# Main Script

# Install Guards

# Check and install Git
if (-Not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host "Git is not installed. Installing now..."
  winget install Git.Git
} else {
  Write-Host "Git is already installed."
}

# Check and install Winget (Windows Package Manager)
# Note: Winget is typically pre-installed on Windows 10 versions 2004 and later
if (-Not (Get-Command winget -ErrorAction SilentlyContinue)) {
  Write-Host "Winget is not installed. Please install Winget manually."
} else {
  Write-Host "Winget is already installed."
}
# TODO: Add install guards here

# Determine OS Type
$osType = Get-OSType
Write-Host "Operating System Type: $osType"

# Get Installation Directory
$installDir = Get-InstallDir
Write-Host "Installation Directory: $installDir"

# Install NVM and Node.js LTS
Install-NVM

# Copy Scripts to PATH (Placeholder)
# TODO: Add logic to copy _setup_bbpro and _bbpro to PATH

# Additional Setup and Configuration (Placeholder)
# TODO: Add any additional setup or configuration tasks here
