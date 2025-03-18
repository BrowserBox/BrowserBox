# install-bbx.ps1
# Hosted at dosaygo.com/browserbox
$ProgressPreference = 'SilentlyContinue'

# Define paths and URLs
$bbxUrl = "https://github.com/<your-username>/<repo>/releases/latest/download/browserbox-win.zip"
$tempZip = "$env:TEMP\browserbox-win.zip"
$installDir = "C:\Program Files\browserbox"
$nvmUrl = "https://github.com/coreybutler/nvm-windows/releases/latest/download/nvm-setup.zip"
$nvmZip = "$env:TEMP\nvm-setup.zip"
$mkcertUrl = "https://github.com/FiloSottile/mkcert/releases/latest/download/mkcert-v1.4.4-windows-amd64.exe"

# Check for winget
$wingetPath = (Get-Command winget -ErrorAction SilentlyContinue).Path
if (-not $wingetPath) {
    Write-Host "Installing winget..."
    irm asheroto.com/winget | iex
}

# Check for PowerShell 7
$pwshPath = (Get-Command pwsh -ErrorAction SilentlyContinue).Path
if (-not $pwshPath) {
    Write-Host "Installing PowerShell 7..."
    winget install --id Microsoft.PowerShell --silent
}

# Install nvm-windows
$nvmPath = (Get-Command nvm -ErrorAction SilentlyContinue).Path
if (-not $nvmPath) {
    Write-Host "Installing nvm-windows..."
    Invoke-WebRequest -Uri $nvmUrl -OutFile $nvmZip
    Expand-Archive -Path $nvmZip -DestinationPath "$env:TEMP\nvm-install" -Force
    & "$env:TEMP\nvm-install\nvm-setup.exe" /SILENT
    Remove-Item "$env:TEMP\nvm-install" -Recurse
    Remove-Item $nvmZip
    # Update PATH for this session
    $env:Path += ";$env:ProgramFiles\nvm"
}

# Install Node.js via nvm
Write-Host "Installing Node.js via nvm..."
& nvm install lts
& nvm use lts

# Install mkcert
Write-Host "Installing mkcert..."
Invoke-WebRequest -Uri $mkcertUrl -OutFile "$installDir\mkcert.exe"

# Install letsencrypt (Certbot)
Write-Host "Installing Certbot for letsencrypt..."
winget install --id 9MZ1N2T2CNGH --silent  # Certbot’s winget ID, may need adjustment

# Download and install bbx
Write-Host "Downloading browserbox..."
Invoke-WebRequest -Uri $bbxUrl -OutFile $tempZip

Write-Host "Installing browserbox to $installDir..."
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir | Out-Null
}
Expand-Archive -Path $tempZip -DestinationPath $installDir -Force

# Create bbx.bat for CMD
$batContent = "@echo off`npwsh -File `"%~dp0bbx.ps1`" %*"
Set-Content -Path "$installDir\bbx.bat" -Value $batContent

# Add to PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($currentPath -notlike "*$installDir*") {
    Write-Host "Adding browserbox to PATH..."
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installDir", "Machine")
}

# Cleanup
Remove-Item $tempZip

# Verify
Write-Host "Browserbox installed successfully!" -ForegroundColor Green
& pwsh -Command "$installDir\bbx.ps1 --help"
