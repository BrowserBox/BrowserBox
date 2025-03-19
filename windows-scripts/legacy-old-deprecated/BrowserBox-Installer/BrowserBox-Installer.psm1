. $PSScriptRoot\Initialize-BrowserBox.ps1
. $PSScriptRoot\Install-BrowserBox.ps1
. $PSScriptRoot\Start-BrowserBox.ps1
. $PSScriptRoot\Stop-BrowserBox.ps1
. $PSScriptRoot\Utils.ps1

function AddToBothProfiles {
  param (
    [string]$ModuleName
  )

  # Build the path to Utils.ps1
  $utilsPath = Join-Path -Path $PSScriptRoot -ChildPath "Utils.ps1"

  # Add the module to the current profile
  . $utilsPath
  Add-ModuleToCurrentProfile -ProfilePath $PROFILE -ModuleName $ModuleName

  # Determine the other PowerShell executable
  $otherPowerShell = if ($PSVersionTable.PSEdition -eq "Core") { "powershell" } else { "pwsh" }

  # Check if the other PowerShell version is available
  if (Get-Command $otherPowerShell -ErrorAction SilentlyContinue) {
    # Prepare the command to run in the other PowerShell
    $scriptPath = Join-Path $PSScriptRoot "Auto-Import-BrowserBox.ps1"

    # Execute the command in the other PowerShell
    Start-Process $otherPowerShell -ArgumentList "-File", "`"$scriptPath`""
    Write-Host "Attempting to add module '$ModuleName' to the profile of $otherPowerShell."
  } else {
    Write-Host "$otherPowerShell is not available on this system."
  }
}

if ( $env:BrowserBoxSilentImport ) {
  # don't display every time
} else {
  try {
    Write-Host "If your cloud has an external firewall, ensure you open port 80 in your networking panel before running Install-BrowserBox"
    Write-Host "Available commands: Install-BrowserBox, Initialize-BrowserBox, Start-BrowserBox and Stop-BrowserBox"
    Write-Host "They should be run in that order."
    Write-Host "BrowserBox-Installer is imported."
    #AddToBothProfiles -ModuleName BrowserBox-Installer
    #Write-Host "Added to all PowerShell profiles for current user."
  } catch {
    # No need to do anything
  }
}
