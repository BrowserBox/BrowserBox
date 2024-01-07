function ImportTools {
  . $PSScriptRoot\Config-BrowserBox.ps1
  . $PSScriptRoot\Install-BrowserBox.ps1
  . $PSScriptRoot\Start-BrowserBox.ps1
  . $PSScriptRoot\Stop-BrowserBox.ps1
}

function SayHello {
  Write-Output "Hello"
}

