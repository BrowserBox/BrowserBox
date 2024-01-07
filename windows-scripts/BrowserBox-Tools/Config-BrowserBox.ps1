function Config-BrowserBox {
  params(
    [string]$Port,
    [string]$Token,
  )

  . .\Utils.ps1
  $browserBoxGlobalDirectory = Get-DestinationDirectory
  Set-Location $browserboxGlobalDirectory

  $loginLink = ./deploy-scripts/_setup_bbpro.ps1 --port $Port --token $Token
  Write-Output $loginLink
}
