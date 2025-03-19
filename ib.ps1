# ib.ps1

# Hosted at dosaygo.com/browserbox (or raw.githubusercontent.com/BrowserBox/BrowserBox/refs/heads/win/ib.ps1)
$ProgressPreference = 'SilentlyContinue'

# Set the branch here
$branch = 'win'  # Change to 'main' or any branch as needed

# Force all installs (set to $true for production, $false for dev speed)
$ForceAll = $false

# Ensure admin privileges
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Relaunching as Administrator..."
    Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    exit
}

# Paths and URLs
$bbxUrl = "https://github.com/BrowserBox/BrowserBox/archive/refs/heads/$branch.zip"
$tempZip = "$env:TEMP\browserbox-$branch.zip"
$installDir = "C:\Program Files\browserbox"
$bbxDir = "$installDir\windows-scripts"  # Where bbx.ps1 should live
$tempExtractDir = "$env:TEMP\browserbox-extract-$branch"  # Temp staging folder

# winget
$wingetPath = (Get-Command winget -ErrorAction SilentlyContinue).Path
if (-not $wingetPath -or $ForceAll) {
    Write-Host "Installing winget..."
    # Backport: Use a single string for -ArgumentList, avoid array parsing issues in 5.1
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"& { IEX ((New-Object Net.WebClient).DownloadString('https://asheroto.com/winget')) } -Force`"" -Wait -NoNewWindow
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
    $wingetPath = (Get-Command winget -ErrorAction SilentlyContinue).Path
    if (-not $wingetPath) {
        Write-Warning "winget installation failed or not found in PATH—continuing anyway."
    } else {
        Write-Host "winget installed successfully."
    }
} else {
    Write-Host "winget already installed—skipping."
}

# Node.js
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Path
if (-not $nodePath -or $ForceAll) {
    Write-Host "Installing Node.js LTS..."
    winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    $env:Path = "$env:Path;$env:ProgramFiles\nodejs"
} else {
    Write-Host "Node.js already installed at $nodePath—skipping."
}

# Verify Node.js and npm
$nodeVersion = & node --version 2>$null
$npmVersion = & npm --version 2>$null
if ($nodeVersion -and $npmVersion) {
    Write-Host "Node.js $nodeVersion and npm $npmVersion installed successfully."
} else {
    Write-Warning "Node.js or npm not found—continuing anyway."
}

# mkcert
$mkcertPath = (Get-Command mkcert -ErrorAction SilentlyContinue).Path
if (-not $mkcertPath -or $ForceAll) {
    Write-Host "Installing mkcert..."
    winget install --id FiloSottile.mkcert --accept-source-agreements --accept-package-agreements --Location "$env:ProgramFiles\mkcert"
    $env:Path = "$env:Path;$env:ProgramFiles\mkcert"
} else {
    Write-Host "mkcert already installed at $mkcertPath—skipping."
}

# Certbot
$certbotPath = (Get-Command certbot -ErrorAction SilentlyContinue).Path
if (-not $certbotPath -or $ForceAll) {
    Write-Host "Installing Certbot..."
    winget install --id EFF.Certbot --accept-source-agreements --accept-package-agreements
    $env:Path = "$env:Path;$env:ProgramFiles\Certbot\bin"
} else {
    Write-Host "Certbot already installed at $certbotPath—skipping."
}

# Google Chrome
$chromePath = Get-ItemProperty -Path "HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" -ErrorAction SilentlyContinue
if (-not $chromePath -or $ForceAll) {
    Write-Host "Installing Google Chrome..."
    winget install --id Google.Chrome.EXE --accept-source-agreements --accept-package-agreements --force
} else {
    Write-Host "Google Chrome already installed—skipping."
}

# BrowserBox
Write-Host "Downloading BrowserBox from branch '$branch'..."
(New-Object Net.WebClient).DownloadFile($bbxUrl, $tempZip)
Read-Host "Downloaded ZIP to $tempZip. Press Enter to continue..."

Write-Host "Cleaning existing install at $installDir..."
if (Test-Path $installDir) {
    Remove-Item $installDir -Recurse -Force
}
Read-Host "Cleaned $installDir (if it existed). Press Enter to continue..."

Write-Host "Extracting to temporary directory $tempExtractDir..."
if (Test-Path $tempExtractDir) {
    Remove-Item $tempExtractDir -Recurse -Force
}
Expand-Archive -Path $tempZip -DestinationPath "$tempExtractDir" -Force
Read-Host "Extracted ZIP to $tempExtractDir. Press Enter to continue..."

Write-Host "Moving to $installDir..."
$extractedRoot = "$tempExtractDir\BrowserBox-$branch"
if (Test-Path $extractedRoot) {
    Get-ChildItem -Path $extractedRoot | Move-Item -Destination $installDir -Force
    Remove-Item $tempExtractDir -Recurse -Force
} else {
    Write-Warning "Expected $extractedRoot not found after extraction!"
}
Remove-Item "$tempZip"
Read-Host "Moved contents to $installDir and cleaned up temp files. Press Enter to continue..."

# Debug: Show extracted contents
Write-Host "Checking install directory contents..."
Get-ChildItem $installDir -Recurse | ForEach-Object { Write-Host "Found: $($_.FullName)" }
Read-Host "Listed contents of $installDir. Press Enter to continue..."

# PATH (add bbx.ps1 directory)
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($currentPath -notlike "*$bbxDir*") {
    Write-Host "Adding '$bbxDir' to PATH..."
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$bbxDir", "Machine")
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
}
Read-Host "Updated PATH with $bbxDir (if needed). Press Enter to continue..."

# Verify
Write-Host "BrowserBox installed! Running 'bbx --help'..." -ForegroundColor Green
$bbxPath = "$bbxDir\bbx.ps1"
if (Test-Path $bbxPath) {
    & powershell -NoProfile -ExecutionPolicy Bypass -File "$bbxPath" --help
} else {
    Write-Warning "bbx.ps1 not found at $bbxPath! Searching for it..."
    $foundBbx = Get-ChildItem -Path $installDir -Filter "bbx.ps1" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($foundBbx) {
        Write-Host "Found bbx.ps1 at $($foundBbx.FullName), running it..."
        & powershell -NoProfile -ExecutionPolicy Bypass -File "$($foundBbx.FullName)" --help
    } else {
        Write-Error "bbx.ps1 not found anywhere in $installDir! Check ZIP structure for branch '$branch'."
    }
}

Read-Host "Ran 'bbx --help' (or tried to). Press Enter to finish..."
