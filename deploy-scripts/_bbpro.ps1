
# _bbpro.ps1 PowerShell Script

# Finding bbpro installation directory
Write-Host "Finding bbpro installation..."
$installPath1 = Get-ChildItem -Path "C:\Program Files" -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq ".bbpro_install_dir" } | Select-Object -First 1
$installPath2 = Get-ChildItem -Path $env:USERPROFILE -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq ".bbpro_install_dir" } | Select-Object -First 1
$installDir = if ($installPath1) { Split-Path $installPath1.FullName -Parent } else { Split-Path $installPath2.FullName -Parent }
if (-Not $installDir) {
  Write-Host "Could not find bbpro. Purchase a license and run deploy-scripts/global_install.ps1 first"
  exit
}
Write-Host "Found bbpro at: $installDir"
$env:INSTALL_DIR = $installDir
# Check if the user has 'renice' capability (simulating since renice is not applicable in Windows)
# Placeholder for your actual capability check
$hasReniceCap = $true
# Attempt to add 'renice' capability if not present (simulating since renice is not applicable in Windows)
# Placeholder for your actual capability addition logic
if (-Not $hasReniceCap) {
  Write-Host "Adding 'renice' capability..."
  # Your logic here
}
# Run another script 'run-test.ps1'
Invoke-Expression -Command ".\scripts\run-test.ps1"

# Additional Functions
# Mock "renice" function to set process priority to RealTime
function Set-RealTimePriority {
  param (
    [string]$processName
  )
  try {
    $process = Get-Process -Name $processName
    $process.PriorityClass = "RealTime"
    Write-Host "Successfully set the priority of $processName to RealTime."
  }
  catch {
    Write-Host "Could not find process named $processName or failed to set priority."
  }
}

# Example usage to set the priority of a hypothetical audio recording process
# Uncomment the following line to use it
# Set-RealTimePriority -processName "YourAudioRecordingProcess"
