. $PSScriptRoot\Utils.ps1

function Start-BrowserBox-In-Windows-Server {
  $userResponse = Read-Host "This will disconnect you from your RDP session. Do you have your BrowserBox login link? (yes/no or y/n)"

  if ($userResponse -eq 'yes' -or $userResponse -eq 'y') {
    $ScriptPath = Join-Path (Get-DestinationDirectory) "BrowserBox" "windows-scripts" "Start.ps1"
    . $PSScriptRoot\Thunderbird.ps1 -scriptPathOrUrl $ScriptPath
  }
  elseif ($userResponse -eq 'no' -or $userResponse -eq 'n') {
    Write-Host "Please copy your BrowserBox login link and then run this command again."
  }
  else {
    Write-Host "Invalid response. Please answer 'yes'/'no' or 'y'/'n'."
  }
}



