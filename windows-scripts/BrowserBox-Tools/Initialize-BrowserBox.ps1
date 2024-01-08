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
  Write-Output $loginLink
  Set-Location $originalDirectory
}
