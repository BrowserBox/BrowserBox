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
$bbxUrl = "https://github.com/BrowserBox/BrowserBox/archive/refs/heads/win.zip"
$tempZip = "$env:TEMP\browserbox-win.zip"
$installDir = "C:\Program Files\browserbox"

# winget
$wingetPath = (Get-Command winget -ErrorAction SilentlyContinue).Path
# if (-not $wingetPath) {
    Write-Host "Installing winget..."
    # Run in a subprocess and wait for completion
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"irm asheroto.com/winget | iex`"" -Wait -NoNewWindow
    # Refresh PATH to find winget
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
    $wingetPath = (Get-Command winget -ErrorAction SilentlyContinue).Path
    if (-not $wingetPath) {
        Write-Error "winget installation failed or not found in PATH!"
        exit 1
    }
    Write-Host "winget installed successfully."
# }

# Rest of the script...
Write-Host "Installing Node.js latest..."
winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
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
winget install --id FiloSottile.mkcert --accept-source-agreements --accept-package-agreements --Location "$env:ProgramFiles\mkcert"
$env:Path += ";$env:ProgramFiles\mkcert"

# Certbot
Write-Host "Installing Certbot..."
winget install --id EFF.Certbot --accept-source-agreements --accept-package-agreements
$env:Path += ";$env:ProgramFiles\Certbot\bin"

Write-Host "Installing Google Chrome..."
winget install --id Google.Chrome.EXE --accept-source-agreements --accept-package-agreements

# BrowserBox
Write-Host "Downloading BrowserBox..."
(New-Object System.Net.WebClient).DownloadFile($bbxUrl, $tempZip)
Write-Host "Installing to $installDir..."
Expand-Archive -Path $tempZip -DestinationPath "$installDir" -Force
Remove-Item "$tempZip"

# PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($currentPath -notlike "*$installDir*") {
    Write-Host "Adding to PATH..."
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installDir", "Machine")
    $env:Path += ";$installDir"
}

# Verify
Write-Host "BrowserBox installed! Run 'bbx --help'." -ForegroundColor Green
& powershell -Command "`"$installDir\bbx.ps1`""
