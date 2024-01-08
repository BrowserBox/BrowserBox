. $PSScriptRoot\Utils.ps1

function Start-BrowserBox {
  param (
    [switch]$NoBranch = $false
  )

  Write-Host "Your login link:"
  $loginLinkFile = "$env:USERPROFILE\.config\dosyago\bbpro\login.link"
  $loginLink = Get-Content $loginLinkFile
  Write-Output $loginLink

  Write-Host "Starting BrowserBox..."
  $browserboxGlobalDirectory = Get-DestinationDirectory
  Set-Location "${browserboxGlobalDirectory}\BrowserBox"

  $os = Get-CimInstance -ClassName Win32_OperatingSystem
  if (-not $NoBranch -and ($os.ProductType -eq 2 -or $os.ProductType -eq 3)) {
    Write-Host "Detected Windows Server. Running BrowserBox for Windows Server..."
    . $PSScriptRoot\Start-BrowserBox-In-Windows-Server.ps1
    Start-BrowserBox-In-Windows-Server
    return
  } else {
    npm test
  }

  Set-Location $env:USERPROFILE
}

