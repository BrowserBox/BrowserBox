. $PSScriptRoot\Utils.ps1

function Start-BrowserBox-In-Windows-Server {
  $userResponse = Read-Host "This will disconnect you from your RDP session. Do you have your BrowserBox login link? (yes/no or y/n)"

  if ($userResponse -eq 'yes' -or $userResponse -eq 'y') {
    $destinationDirectory = Get-DestinationDirectory
    $scriptPath = Join-Path $destinationDirectory "BrowserBox"
    $scriptPath = Join-Path $scriptPath "windows-scripts"
    $scriptPath = Join-Path $scriptPath "Start.ps1"
    $psPath = ""
    if ($PSVersionTable.PSEdition -eq "Core") {
      # PowerShell Core
      $psPath = "pwsh.exe"
    } else {
      # Windows PowerShell
      $psPath = "powershell.exe"
    }
    Write-Host "Will run start script at: $ScriptPath using $psPath"

    Read-Host "Press enter to continue"
    $StateDirectory = "$env:USERPROFILE\StateDirectory"
    if (Test-Path $StateDirectory) {
      try {
        Remove-Item $StateDirectory -Recurse -Force -ErrorAction SilentlyContinue
      } catch {
        # no need to kick up a fuss, on first run we don't expect this to be here
      }
    }
    & $PSScriptRoot\Thunderbird.ps1 -scriptUrlOrPath $ScriptPath -shell $psPath
  }
  elseif ($userResponse -eq 'no' -or $userResponse -eq 'n') {
    Write-Host "Please copy your BrowserBox login link and then run this command again."
  }
  else {
    Write-Host "Invalid response. Please answer 'yes'/'no' or 'y'/'n' next time."
  }
}

