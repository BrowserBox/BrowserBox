# ib.ps1
# Hosted at dosaygo.com/browserbox (or raw.githubusercontent.com/BrowserBox/BrowserBox/refs/heads/win/ib.ps1)
$ProgressPreference = 'SilentlyContinue'

# Set the branch here
$branch = 'win'  # Change to 'main' or any branch as needed

# Ensure admin privileges
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Relaunching as Administrator..."
    Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

# Paths and URLs
$bbxUrl = "https://github.com/BrowserBox/BrowserBox/archive/refs/heads/$branch.zip"
$tempZip = "$env:TEMP\browserbox-$branch.zip"  # Include branch in temp file name for clarity
$installDir = "C:\Program Files\browserbox"

# winget
$wingetPath = (Get-Command winget -ErrorAction SilentlyContinue).Path
if (-not $wingetPath) {
    Write-Host "Installing winget..."
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"&([ScriptBlock]::Create((irm asheroto.com/winget))) -Force`"" -Wait -NoNewWindow
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
    $wingetPath = (Get-Command winget -ErrorAction SilentlyContinue).Path
    if (-not $wingetPath) {
        Write-Error "winget installation failed or not found in PATH!"
        exit 1
    }
    Write-Host "winget installed successfully."
}

Write-Host "Installing Node.js LTS..."
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
Write-Host "Downloading BrowserBox from branch '$branch'..."
(New-Object System.Net.WebClient).DownloadFile($bbxUrl, $tempZip)
Write-Host "Installing to $installDir..."
Expand-Archive -Path $tempZip -DestinationPath "$installDir" -Force
# Adjust for ZIP structure (e.g., BrowserBox-win or BrowserBox-main)
$extractedDir = "$installDir\BrowserBox-$branch"
if (Test-Path $extractedDir) {
    Get-ChildItem -Path $extractedDir | Move-Item -Destination $installDir -Force
    Remove-Item $extractedDir -Recurse -Force
}
Remove-Item "$tempZip"

# PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($currentPath -notlike "*$installDir*") {
    Write-Host "Adding to PATH..."
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installDir", "Machine")
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
}

# Verify
Write-Host "BrowserBox installed! Running 'bbx --help'..." -ForegroundColor Green
$bbxPath = "$installDir\windows-scripts\bbx.ps1"  # Assuming windows-scripts subfolder
if (Test-Path $bbxPath) {
    & powershell -NoProfile -ExecutionPolicy Bypass -Command "& '$bbxPath' --help"
} else {
    Write-Error "bbx.ps1 not found at $bbxPath! Check ZIP structure for branch '$branch'."
    exit 1
}
