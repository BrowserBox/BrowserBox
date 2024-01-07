. .\Utils.ps1
Write-Information "Starting BrowserBox..."
$browserboxGlobalDirectory = Get-DestinationDirectory
Set-Location $browserboxGlobalDirectory

npm test

$loginLinkFile = "$env:USERPROFILE\.config\dosyago\bbpro\login.link"
$loginLink = Get-Content $loginLinkFile
Write-Output $loginLink
