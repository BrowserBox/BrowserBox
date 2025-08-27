# install.ps1
# Located at C:\Program Files\browserbox\windows-scripts\install.ps1
[CmdletBinding()]
param ()
if ($PSBoundParameters.ContainsKey('Help') -or $args -contains '-help') {
    Write-Host "bbx install" -ForegroundColor Green
    Write-Host "Install BrowserBox and bbx CLI" -ForegroundColor Yellow
    Write-Host "Usage: bbx install" -ForegroundColor Cyan
    Write-Host "Options: None" -ForegroundColor Cyan
    return
}
$ProgressPreference = 'SilentlyContinue'
$branch = 'main'
$ForceAll = $false
$Debug = $false
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Not running as Administrator. Relaunching..." -ForegroundColor Yellow
    $arguments = @(
        "-NoProfile"
        "-ExecutionPolicy", "Bypass"
        "-Command", "irm bbx.dosaygo.com | iex"
    )
    Start-Process powershell -Verb RunAs -ArgumentList $arguments
    Start-Sleep -Seconds 2
    return
}
Write-Host "Running as Administrator." -ForegroundColor Green
Start-Sleep -Seconds 2
$bbxUrl = "https://github.com/BrowserBox/BrowserBox/archive/refs/heads/$branch.zip"
$tempZip = "$env:TEMP\browserbox-$branch.zip"
$installDir = "C:\Program Files\browserbox"
$bbxDir = "$installDir\windows-scripts"
$tempExtractDir = "$env:TEMP\browserbox-extract-$branch"
$unzipPath = "C:\Program Files\Git\usr\bin\unzip.exe"
# winget
$wingetPath = (Get-Command winget -ErrorAction SilentlyContinue).Path
if (-not $wingetPath -or $ForceAll) {
    Write-Host "Installing winget..." -ForegroundColor Cyan
    try {
        if ($PSVersionTable.PSVersion.Major -ge 6) {
            # Prefer current PS7+ shell for reliability
            & ([ScriptBlock]::Create((irm asheroto.com/winget))) -Force
        } else {
            # PS5: Set TLS explicitly in subprocess
            Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; & { IEX ((New-Object Net.WebClient).DownloadString('https://asheroto.com/winget')) } -Force`"" -Wait -NoNewWindow
        }
    } catch {
        Write-Host "Primary winget installation method failed. Trying fallback..." -ForegroundColor Yellow
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        & ([ScriptBlock]::Create((irm asheroto.com/winget))) -Force
    }
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
    $wingetPath = (Get-Command winget -ErrorAction SilentlyContinue).Path
    if (-not $wingetPath) {
        Write-Warning "winget installation failed or not found in PATH -- continuing anyway."
    } else {
        Write-Host "winget installed successfully." -ForegroundColor Green
    }
} else {
    Write-Host "winget already installed -- skipping." -ForegroundColor Cyan
}
# Check for unzip (from Git for Windows) and install Git.Git if not found
if (-not (Test-Path $unzipPath) -or $ForceAll) {
    Write-Host "unzip not found at $unzipPath. Installing Git for Windows to get it..." -ForegroundColor Cyan
    winget install --id Git.Git --accept-source-agreements --accept-package-agreements --force --silent
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
    if (Test-Path $unzipPath) {
        Write-Host "unzip installed successfully via Git.Git." -ForegroundColor Green
    } else {
        Write-Error "Failed to find unzip at $unzipPath after installing Git.Git! Check Git installation."
        return
    }
} else {
    Write-Host "unzip already installed at $unzipPath -- skipping." -ForegroundColor Cyan
}
# Node.js
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Path
if ($nodePath) {
    Write-Host "Node.js already installed at $nodePath -- installing LTS anyway..." -ForegroundColor Cyan
}
Write-Host "Installing Node.js LTS..." -ForegroundColor Cyan
winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements --silent
$env:Path = "$env:Path;$env:ProgramFiles\nodejs"
# Verify Node.js and npm
$nodeVersion = & node --version 2>$null
$npmVersion = & npm --version 2>$null
if ($nodeVersion -and $npmVersion) {
    Write-Host "Node.js $nodeVersion and npm $npmVersion installed successfully." -ForegroundColor Green
} else {
    Write-Warning "Node.js or npm not found -- continuing anyway."
}
# mkcert
$mkcertPath = (Get-Command mkcert -ErrorAction SilentlyContinue).Path
if (-not $mkcertPath -or $ForceAll) {
    Write-Host "Installing mkcert..." -ForegroundColor Cyan
    winget install --id FiloSottile.mkcert --accept-source-agreements --accept-package-agreements --Location "$env:ProgramFiles\mkcert" --silent
    $env:Path = "$env:Path;$env:ProgramFiles\mkcert"
} else {
    Write-Host "mkcert already installed at $mkcertPath -- skipping." -ForegroundColor Cyan
}
# Certbot
$certbotPath = (Get-Command certbot -ErrorAction SilentlyContinue).Path
if (-not $certbotPath -or $ForceAll) {
    Write-Host "Installing Certbot..." -ForegroundColor Cyan
    winget install --id EFF.Certbot --accept-source-agreements --accept-package-agreements --silent
    $env:Path = "$env:Path;$env:ProgramFiles\Certbot\bin"
} else {
    Write-Host "Certbot already installed at $certbotPath -- skipping." -ForegroundColor Cyan
}
# Google Chrome
$chromePath = Get-ItemProperty -Path "HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" -ErrorAction SilentlyContinue
if (-not $chromePath -or $ForceAll) {
    Write-Host "Installing Google Chrome..." -ForegroundColor Cyan
    winget install --id Google.Chrome.EXE --accept-source-agreements --accept-package-agreements --force --silent
} else {
    Write-Host "Google Chrome already installed -- skipping." -ForegroundColor Cyan
}
# BrowserBox
Write-Host "Downloading BrowserBox from branch '$branch'..." -ForegroundColor Cyan
(New-Object Net.WebClient).DownloadFile($bbxUrl, $tempZip)
if ($Debug) { Read-Host "Downloaded ZIP to $tempZip. Press Enter to continue..." }
Write-Host "Cleaning existing install at $installDir..." -ForegroundColor Cyan
if (Test-Path $installDir) {
    Remove-Item $installDir -Recurse -Force
}
if ($Debug) { Read-Host "Cleaned $installDir (if it existed). Press Enter to continue..." }
Write-Host "Extracting to temporary directory $tempExtractDir with unzip..." -ForegroundColor Cyan
if (Test-Path $tempExtractDir) {
    Remove-Item $tempExtractDir -Recurse -Force
}
New-Item -Path $tempExtractDir -ItemType Directory -Force | Out-Null
& $unzipPath -q $tempZip -d $tempExtractDir
if ($LASTEXITCODE -eq 0) {
    Write-Host "Extraction completed successfully." -ForegroundColor Green
} else {
    Write-Error "Extraction failed with exit code $LASTEXITCODE!"
    throw "INSTALL Error"
}
if ($Debug) { Read-Host "Extracted ZIP to $tempExtractDir. Press Enter to continue..." }
Write-Host "Mirroring to $installDir using robocopy..." -ForegroundColor Cyan
$extractedRoot = "$tempExtractDir\BrowserBox-$branch"
if (Test-Path $extractedRoot) {
    # Ensure installDir exists
    if (-not (Test-Path $installDir)) {
        New-Item -Path $installDir -ItemType Directory -Force | Out-Null
    }
    # Use robocopy to mirror the directory structure
    robocopy $extractedRoot $installDir /MIR /R:5 /W:5 /MT:8 /SL
    if ($LASTEXITCODE -le 7) { # robocopy exit codes 0-7 indicate success
        Write-Host "Successfully mirrored files to $installDir" -ForegroundColor Green
        Remove-Item $tempExtractDir -Recurse -Force
    } else {
        Write-Error "robocopy failed with exit code $LASTEXITCODE!"
    }
} else {
    Write-Warning "Expected $extractedRoot not found after extraction!"
}
Remove-Item "$tempZip"
if ($Debug) { Read-Host "Mirrored contents to $installDir and cleaned up temp files. Press Enter to continue..." }
# Prepare step
$prepareScript = "$bbxDir\prepare.ps1"
if (Test-Path $prepareScript) {
    & powershell -NoProfile -ExecutionPolicy Bypass -File "$prepareScript"
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Preparation step failed -- continuing anyway."
    }
} else {
    Write-Warning "prepare.ps1 not found at $prepareScript -- skipping preparation."
}
# Debug: Show extracted contents
Write-Host "Checking install directory contents..." -ForegroundColor Cyan
Get-ChildItem $installDir -Recurse | ForEach-Object { if ($Debug) { Write-Host "Found: $($_.FullName)" } }
if ($Debug) { Read-Host "Listed contents of $installDir. Press Enter to continue..." }
# PATH (add bbx.ps1 directory to both Machine and User scopes)
$bbxDir = "$installDir\windows-scripts"
# Machine PATH
$currentMachinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($currentMachinePath -notlike "*$bbxDir*") {
    Write-Host "Adding '$bbxDir' to Machine PATH permanently..." -ForegroundColor Cyan
    $newMachinePath = "$currentMachinePath;$bbxDir"
    [Environment]::SetEnvironmentVariable("Path", $newMachinePath, "Machine")
}
# User PATH
$currentUserPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentUserPath -notlike "*$bbxDir*") {
    Write-Host "Adding '$bbxDir' to User PATH permanently..." -ForegroundColor Cyan
    $newUserPath = "$currentUserPath;$bbxDir"
    [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
}
# Update current session PATH
$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
if ($Debug) { Read-Host "Updated PATH with $bbxDir (Machine and User). Press Enter to continue..." }
# Verify
Write-Host "BrowserBox installed! Running 'bbx -help'..." -ForegroundColor Green
$bbxPath = "$bbxDir\bbx.ps1"
if (Test-Path $bbxPath) {
    & powershell -NoProfile -ExecutionPolicy Bypass -File "$bbxPath" -help
} else {
    Write-Warning "bbx.ps1 not found at $bbxPath! Searching for it..."
    $foundBbx = Get-ChildItem -Path $installDir -Filter "bbx.ps1" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($foundBbx) {
        Write-Host "Found bbx.ps1 at $($foundBbx.FullName), running it..." -ForegroundColor Cyan
        & powershell -NoProfile -ExecutionPolicy Bypass -File "$($foundBbx.FullName)" -help
    } else {
        Write-Error "bbx.ps1 not found anywhere in $installDir! Check ZIP structure for branch '$branch'."
        throw "INSTALL Error"
    }
}
if ($Debug) { Read-Host "Ran 'bbx -help' (or tried to). Press Enter to finish..." }
