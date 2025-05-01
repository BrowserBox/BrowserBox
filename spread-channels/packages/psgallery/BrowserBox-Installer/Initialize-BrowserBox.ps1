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

  # Assuming $Port is a string, convert it to an integer
  $portNumber = [int]$Port

  # Perform arithmetic operations
  $lowerPort = $portNumber - 2
  $upperPort = $portNumber + 2

  # Output the message with the calculated port numbers
  Write-Host "Please note: we will open the required ports in Windows Firewall, but if your cloud or hosting provider uses an external firewall then ensure you have opened firewall ports $lowerPort-$upperPort in your provider's networking control panel."

  Write-Host "Next steps: Start-BrowserBox"
  Write-Output $loginLink
  Set-Location $originalDirectory
}
