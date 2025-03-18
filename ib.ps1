# install-bbx.ps1
# Hosted at dosaygo.com/browserbox
$ProgressPreference = 'SilentlyContinue'

# Paths and URLs
$bbxUrl = "https://github.com/BrowserBox/BrowserBox/releases/latest/download/browserbox-win.zip"
$tempZip = "$env:TEMP\browserbox-win.zip"
$installDir = "C:\Program Files\browserbox"
$nvmUrl = "https://github.com/coreybutler/nvm-windows/releases/latest/download/nvm-setup.zip"
$nvmZip = "$env:TEMP\nvm-setup.zip"
$mkcertUrl = "https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-v1.4.4-windows-amd64.exe"

# Check/install winget
$wingetPath = (Get-Command winget -ErrorAction SilentlyContinue).Path
if (-not $wingetPath) {
    Write-Host "Installing winget..."
    irm asheroto.com/winget | iex
}

# Check/install PowerShell 7
$pwshPath = (Get-Command pwsh -ErrorAction SilentlyContinue).Path
if (-not $pwshPath) {
    Write-Host "Installing PowerShell 7..."
    winget install --id Microsoft.PowerShell --silent
}

# Install nvm-windows
if (-not (Get-Command nvm -ErrorAction SilentlyContinue)) {
    Write-Host "Installing nvm-windows..."
    Invoke-WebRequest -Uri $nvmUrl -OutFile $nvmZip
    Expand-Archive -Path $nvmZip -DestinationPath "$env:TEMP\nvm-install" -Force
    & "$env:TEMP\nvm-install\nvm-setup.exe" /SILENT
    Remove-Item "$env:TEMP\nvm-install" -Recurse
    Remove-Item $nvmZip
    $env:Path += ";$env:ProgramFiles\nvm"
}

# Install Node.js LTS
Write-Host "Installing Node.js LTS..."
& nvm install lts
& nvm use lts

# Install mkcert
Write-Host "Installing mkcert..."
Invoke-WebRequest -Uri $mkcertUrl -OutFile "$installDir\mkcert.exe"

# Install Certbot
Write-Host "Installing Certbot..."
winget install --id Certbot.Certbot --silent  # Verify ID with 'winget search certbot'

# Download and install BrowserBox
Write-Host "Downloading BrowserBox..."
Invoke-WebRequest -Uri $bbxUrl -OutFile $tempZip
Write-Host "Installing to $installDir..."
if (-not (Test-Path $installDir)) { New-Item -ItemType Directory -Path $installDir | Out-Null }
Expand-Archive -Path $tempZip -DestinationPath $installDir -Force
Remove-Item $tempZip

# Add to PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($currentPath -notlike "*$installDir*") {
    Write-Host "Adding to PATH..."
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installDir", "Machine")
}

# Verify
Write-Host "BrowserBox installed! Run 'bbx --help' in a new session." -ForegroundColor Green
& pwsh -Command "$installDir\bbx.ps1 --help"
