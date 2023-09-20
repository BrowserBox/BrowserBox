
# run-test.ps1 PowerShell Script

# Ensure pm2 is installed
if (-Not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
  npm install -g pm2@latest
}
# Utility function to get the installation directory
function Get-InstallDir {
  $installPath = Get-ChildItem -Path $env:USERPROFILE -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq ".bbpro_install_dir" } | Select-Object -First 1
  $installDir = Split-Path $installPath.FullName -Parent
  return $installDir
}

# Utility function to get the configuration directory
function Get-ConfigDir {
  $configPath = Get-ChildItem -Path $env:USERPROFILE -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq ".bbpro_config_dir" } | Select-Object -First 1
  $configDir = Split-Path $configPath.FullName -Parent
  return $configDir
}
# Kill existing PulseAudio and related processes
# Note: This is a placeholder; you'll need to replace it with actual logic
Stop-Process -Name "pulseaudio" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "pacat" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "parec" -Force -ErrorAction SilentlyContinue
# Run 'run-pm2.ps1' with environment variables
# Note: This is a placeholder; you'll need to replace it with actual logic
Invoke-Expression -Command ".\scripts\control\basic\run-pm2.ps1"
