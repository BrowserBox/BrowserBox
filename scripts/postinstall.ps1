
# Postinstall Script for BrowserBox

# Import Core Functions
# Get-InstallDir Function
function Get-InstallDir {
function Get-OSType {
function Install-NVM {
function Update-Environment {
$installDir = Get-InstallDir

# Get Installation Directory
$installDir = Get-InstallDir
Write-Host "Installation Directory: $installDir"

# Tasks
# Optionally run setup_machine script
$runSetupMachine = Read-Host "Would you like to run setup_machine script? (y/n)"
if ($runSetupMachine -eq "y") {
  .\setup_machine.ps1
}
# Create necessary directories
New-Item -Path "$installDir\some-directory" -ItemType Directory -Force
New-Item -Path "$installDir\another-directory" -ItemType Directory -Force
# Loop through service directories to install npm packages and run npm audit fix
$serviceDirs = @("src/zombie-lord", "../public/voodoo", "../../endbacker", "../../zombie-lord/custom-launcher", "../../", "services/instance/parec-server", "../", "pptr-console-server", "websocket_chat_app", "../", "../", "../pool/crdp-secure-proxy-server", "../chai", "../../../../")
foreach ($dir in $serviceDirs) {
  $fullDir = Join-Path $installDir $dir
  Set-Location -Path $fullDir
  npm install
  npm audit fix
}
# Install additional utilities
if (-Not (Get-Command jq -ErrorAction SilentlyContinue)) {
  winget install jq
}

if (-Not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
  npm install pm2 -g
}
# Install esbuild
npm install esbuild

# Additional Setup and Configuration (Placeholder)
# TODO: Add any additional setup or configuration tasks here

# Additional Tasks
# Run setup script for secure document viewer
.\deploy\scripts\setup.ps1
# Check for USE_FLASH and install ruffle if needed
$useFlash = node .\src\show_useflash.js
if ($useFlash -ne "false") {
  if (-Not (Get-Command jq -ErrorAction SilentlyContinue)) {
    winget install jq
  }
  .\scripts\download_ruffle.ps1
}
