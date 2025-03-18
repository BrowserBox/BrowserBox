# install-bbx.ps1
# Hosted at dosaygo.com/browserbox
$ProgressPreference = 'SilentlyContinue'

# Ensure admin privileges
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Relaunching as Administrator..."
    Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

# Paths and URLs
$bbxUrl = "https://github.com/BrowserBox/BrowserBox/releases/latest/download/browserbox-win.zip"
$tempZip = "$env:TEMP\browserbox-win.zip"
$installDir = "C:\Program Files\browserbox"

# winget
$wingetPath = (Get-Command winget -ErrorAction SilentlyContinue).Path
if (-not $wingetPath) {
    Write-Host "Installing winget..."
    irm asheroto.com/winget | iex
}

# PowerShell 7
$pwshPath = (Get-Command pwsh -ErrorAction SilentlyContinue).Path
if (-not $pwshPath) {
    Write-Host "Installing PowerShell 7..."
    winget install --id Microsoft.PowerShell --silent --accept-source-agreements --accept-package-agreements
    $env:Path += ";$env:ProgramFiles\PowerShell\7"
}

Write-Host "Installing Node.js latest..."
winget install --id OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements
# Update PATH for this session (winget adds to system PATH, but not always current session)
$env:Path += ";$env:ProgramFiles\nodejs"

# Verify Node.js and npm
$nodeVersion = & node --version
$npmVersion = & npm --version
if ($nodeVersion -and $npmVersion) {
    Write-Host "Node.js $nodeVersion and npm $npmVersion installed successfully."
} else {
    Write-Error "Node.js or npm installation failed!"
    exit 1
}

# mkcert
Write-Host "Installing mkcert..."
winget install --id FiloSottile.mkcert --silent --accept-source-agreements --accept-package-agreements

# Certbot
Write-Host "Installing Certbot..."
winget install --id EFF.Certbot --silent --accept-source-agreements --accept-package-agreements

# BrowserBox
Write-Host "Downloading BrowserBox..."
Invoke-WebRequest -Uri $bbxUrl -OutFile $tempZip
Write-Host "Installing to $installDir..."
Expand-Archive -Path $tempZip -DestinationPath $installDir -Force
Remove-Item $tempZip

# PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($currentPath -notlike "*$installDir*") {
    Write-Host "Adding to PATH..."
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installDir", "Machine")
    $env:Path += ";$installDir"
}

# Verify
Write-Host "BrowserBox installed! Run 'bbx --help'." -ForegroundColor Green
& pwsh -Command "$installDir\bbx.ps1 --help"
