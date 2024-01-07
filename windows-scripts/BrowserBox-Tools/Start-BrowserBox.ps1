. $PSScriptRoot\Utils.ps1

function Start-BrowserBox {
  param (
    [switch]$NoBranch
  )

  Write-Information "Your login link:"
  $loginLinkFile = "$env:USERPROFILE\.config\dosyago\bbpro\login.link"
  $loginLink = Get-Content $loginLinkFile
  Write-Output $loginLink

  Write-Information "Starting BrowserBox..."
  $browserboxGlobalDirectory = Get-DestinationDirectory
  Set-Location $browserboxGlobalDirectory

  if (-not $NoBranch -and (Get-WmiObject -Class Win32_OperatingSystem).ProductType -eq 2) {
    Write-Information "Detected Windows Server. Running BrowserBox for Windows Server..."
    . $PSScriptRoot\Start-BrowserBox-In-Windows-Server.ps1
    return
  } else {
    npm test
  }
}

