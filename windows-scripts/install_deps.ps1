# install_deps.ps1
# Install external dependencies for BrowserBox binary distribution
# This script only installs system dependencies and does NOT download BrowserBox source code
[CmdletBinding()]
param ()

$ProgressPreference = 'SilentlyContinue'
$ForceAll = $false
$ForceChrome = $false
if ($null -ne $env:BBX_FORCE_CHROME_INSTALL -and $env:BBX_FORCE_CHROME_INSTALL -ne "") {
    try {
        $ForceChrome = [System.Convert]::ToBoolean($env:BBX_FORCE_CHROME_INSTALL)
    } catch {
        $ForceChrome = ($env:BBX_FORCE_CHROME_INSTALL.ToLowerInvariant() -in @("1", "true", "yes", "y", "on"))
    }
}
# Allow callers to enable NodeJS install if explicitly enabled; default is skip
$InstallNode = $false
if ($env:BBX_INSTALL_NODEJS -eq "true") {
    $InstallNode = $true
}

function Is-Admin {
    try {
        return ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    } catch {
        return $false
    }
}

$IsAdmin = Is-Admin

function Try-ElevateAndRerun {
    param(
        [int]$TimeoutSeconds = 180
    )

    if ($env:BBX_INSTALL_DEPS_ELEVATED_ATTEMPT -eq "1") {
        return $false
    }

    # Avoid hanging in clearly non-interactive CI contexts.
    if ($env:BBX_SKIP_UAC -and $env:BBX_SKIP_UAC -ne "" -and $env:BBX_SKIP_UAC -ne "0" -and $env:BBX_SKIP_UAC -ne "false") {
        return $false
    }

    Write-Host "Attempting to elevate to Administrator for system-wide installs..." -ForegroundColor Yellow
    $exe = "powershell"
    try {
        if (Get-Command pwsh -ErrorAction SilentlyContinue) { $exe = "pwsh" }
    } catch { }

    $scriptPath = $MyInvocation.MyCommand.Path
    $escapedScriptPath = $scriptPath.Replace("'", "''")
    $childCmd = "`$env:BBX_INSTALL_DEPS_ELEVATED_ATTEMPT='1'; & '$escapedScriptPath'"
    $args = @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-Command", $childCmd
    )

    try {
        $p = Start-Process -FilePath $exe -Verb RunAs -ArgumentList $args -PassThru
    } catch {
        Write-Warning "Elevation attempt failed to start: $_"
        return $false
    }

    try {
        $p | Wait-Process -Timeout $TimeoutSeconds -ErrorAction Stop
    } catch {
        Write-Warning "Elevation attempt did not complete within ${TimeoutSeconds}s; falling back to per-user installs."
        try { $p | Stop-Process -Force -ErrorAction SilentlyContinue } catch { }
        return $false
    }

    if ($p.ExitCode -eq 0) {
        Write-Host "Elevated install succeeded." -ForegroundColor Green
        return $true
    }

    Write-Warning "Elevated install exited with code $($p.ExitCode); falling back to per-user installs."
    return $false
}

if (-not $IsAdmin) {
    if (Try-ElevateAndRerun) { exit 0 }
    Write-Host "Not running as Administrator; using per-user installs where possible." -ForegroundColor Yellow
}

Write-Host "Installing BrowserBox system dependencies..." -ForegroundColor Green

# winget
$wingetPath = (Get-Command winget -ErrorAction SilentlyContinue).Path
function Invoke-WingetInstall {
    param([string[]]$Args)
    & winget install @Args
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        Write-Warning "winget install failed with exit code $exitCode; continuing."
        $global:LASTEXITCODE = 0
    }
}
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

# Git for Windows (needed for unzip and other utilities)
$unzipPath = "C:\Program Files\Git\usr\bin\unzip.exe"
if (-not (Test-Path $unzipPath) -or $ForceAll) {
    Write-Host "Installing Git for Windows..." -ForegroundColor Cyan
    Invoke-WingetInstall -Args @("--id", "Git.Git", "--accept-source-agreements", "--accept-package-agreements", "--force", "--silent")
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
    if (Test-Path $unzipPath) {
        Write-Host "Git for Windows installed successfully." -ForegroundColor Green
    } else {
        Write-Warning "Git for Windows installation may have failed. Continuing anyway."
    }
} else {
    Write-Host "Git for Windows already installed -- skipping." -ForegroundColor Cyan
}

# Node.js (optional - controlled by BBX_INSTALL_NODEJS env var)
# Note: BrowserBox binary distribution uses a SEA (Single Executable Application)
# and does not require Node.js at runtime. Node.js is only needed if you plan to
# use npm packages or run additional Node.js scripts.
if ($InstallNode) {
    Write-Host "Installing Node.js LTS (BBX_INSTALL_NODEJS=true)..." -ForegroundColor Cyan
    Invoke-WingetInstall -Args @("--id", "OpenJS.NodeJS.LTS", "--accept-source-agreements", "--accept-package-agreements", "--silent")
    $env:Path = "$env:Path;$env:ProgramFiles\nodejs"

    # Verify Node.js and npm
    $nodeVersion = & node --version 2>$null
    $npmVersion = & npm --version 2>$null
    if ($nodeVersion -and $npmVersion) {
        Write-Host "Node.js $nodeVersion and npm $npmVersion installed successfully." -ForegroundColor Green
    } else {
        Write-Warning "Node.js or npm not found -- continuing anyway."
    }
} else {
    Write-Host "Skipping Node.js installation (set BBX_INSTALL_NODEJS=true to install)." -ForegroundColor Cyan
}

# mkcert / certbot / chrome pre-checks
$mkcertPath = (Get-Command mkcert -ErrorAction SilentlyContinue).Path
$certbotPath = (Get-Command certbot -ErrorAction SilentlyContinue).Path
$chromePathReg = Get-ItemProperty -Path "HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" -ErrorAction SilentlyContinue

# Install mkcert only if missing or forced
if (-not $mkcertPath -or $ForceAll) {
    Write-Host "Installing mkcert..." -ForegroundColor Cyan
    if ($IsAdmin) {
        Invoke-WingetInstall -Args @("--id", "FiloSottile.mkcert", "--accept-source-agreements", "--accept-package-agreements", "--Location", "$env:ProgramFiles\\mkcert", "--silent")
        $env:Path = "$env:Path;$env:ProgramFiles\\mkcert"
    } else {
        Invoke-WingetInstall -Args @("--id", "FiloSottile.mkcert", "--accept-source-agreements", "--accept-package-agreements", "--scope", "user", "--silent")
        $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
    }
} else {
    Write-Host "mkcert already installed at $mkcertPath -- skipping." -ForegroundColor Cyan
}

# Install certbot only if missing or forced
if (-not $certbotPath -or $ForceAll) {
    Write-Host "Installing Certbot..." -ForegroundColor Cyan
    if ($IsAdmin) {
        Invoke-WingetInstall -Args @("--id", "EFF.Certbot", "--accept-source-agreements", "--accept-package-agreements", "--silent")
        $env:Path = "$env:Path;$env:ProgramFiles\\Certbot\\bin"
    } else {
        Invoke-WingetInstall -Args @("--id", "EFF.Certbot", "--accept-source-agreements", "--accept-package-agreements", "--scope", "user", "--silent")
        $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
    }
} else {
    Write-Host "Certbot already installed at $certbotPath -- skipping." -ForegroundColor Cyan
}

# Install Chrome only if missing or forced
if (-not $chromePathReg -or $ForceAll -or $ForceChrome) {
    Write-Host "Installing Google Chrome..." -ForegroundColor Cyan
    $chromeArgs = @("--id", "Google.Chrome.EXE", "--accept-source-agreements", "--accept-package-agreements", "--silent")
    if ($IsAdmin) {
        $chromeArgs += "--force"
    } else {
        $chromeArgs += @("--scope", "user")
    }
    Invoke-WingetInstall -Args $chromeArgs
} else {
    Write-Host "Google Chrome already installed -- skipping." -ForegroundColor Cyan
}
