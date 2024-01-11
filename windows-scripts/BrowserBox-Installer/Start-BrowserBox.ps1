. $PSScriptRoot\Utils.ps1

function Is-RdpSession {
  try {
    $sessions = Get-CimInstance Win32_LogonSession | Where-Object { $_.LogonType -eq 10 }
    if ($sessions) {
      Write-Host "Connected via RDP."
      return $true
    } else {
      Write-Host "Not connected via RDP."
      return $false
    }
  }
  catch {
    Write-Host "Error checking RDP session: $_"
    return $false
  }
}

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
  #if (-not $NoBranch -and ($os.ProductType -eq 2 -or $os.ProductType -eq 3)) {
  if (-not $NoBranch -and (Is-RdpSession)) {
    Write-Host "Detected RDP Session. Running BrowserBox Thunderbird SoundBridge for RDP..."
    . $PSScriptRoot\Start-BrowserBox-In-Windows-Server.ps1
    Start-BrowserBox-In-Windows-Server
    return
  } else {
    npm test
  }

  Set-Location $env:USERPROFILE
}



