. $PSScriptRoot\Initialize-BrowserBox.ps1
. $PSScriptRoot\Install-BrowserBox.ps1
. $PSScriptRoot\Start-BrowserBox.ps1
. $PSScriptRoot\Stop-BrowserBox.ps1

try {
  Write-Host "BrowserBox-Tools is imported"
  Write-Host "Available commands: Install-BrowserBox, Initialize-BrowserBox, Start-BrowserBox and Stop-BrowserBox"
  Write-Host "They should be run in that order."
} catch {
  # No need to do anything
}
