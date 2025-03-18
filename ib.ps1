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
    New-Item -ItemType Directory -Path 'C:\NVM'
    Invoke-WebRequest -Uri 'https://github.com/coreybutler/nvm-windows/releases/download/1.1.8/nvm-setup.zip' -OutFile 'C:\NVM\nvm-setup.zip'
    Expand-Archive -Path 'C:\NVM\nvm-setup.zip' -DestinationPath 'C:\NVM'
    Set-Location -Path 'C:\NVM'
    Start-Process -FilePath 'C:\NVM\nvm-setup.exe' -ArgumentList '/quiet' -Wait
    if (Test-Path -Path 'C:\Users\<username>\AppData\Roaming\nvm') { Write-Host 'NVM has been installed successfully.' } else { Write-Host 'NVM installation failed.' }
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
