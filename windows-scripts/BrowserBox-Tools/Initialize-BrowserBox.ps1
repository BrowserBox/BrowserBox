function Initialize-BrowserBox {
  param(
    [Parameter(Mandatory=$true)]
    [string]$Port,
    [string]$Token
  )

  . $PSScriptRoot\Utils.ps1
  $browserboxGlobalDirectory = Get-DestinationDirectory
  $originalDirectory = Get-Location
  Set-Location "${browserboxGlobalDirectory}\BrowserBox"

  if (![string]::IsNullOrEmpty($Token)) {
    # If Token is provided, include it in the command
    $loginLink = & ./deploy-scripts/_setup_bbpro.ps1 --port $Port --token $Token
  } else {
    # If Token is not provided, exclude it from the command
    $loginLink = & ./deploy-scripts/_setup_bbpro.ps1 --port $Port
  }
  Write-Host "Please note: we will open the required ports in Windows Firewall, but if you're cloud or hosting provider uses an external firewall ensure you have opened firewall ports $($Port-2)-$($Port+2) in your machine's control panel"
  Write-Host "Next steps: Start-BrowserBox"
  Write-Output $loginLink
  Set-Location $originalDirectory
}
