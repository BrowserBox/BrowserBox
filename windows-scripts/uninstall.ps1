[CmdletBinding()]
param (
    [Parameter(Mandatory = $false, HelpMessage = "Skip confirmation prompts during uninstall")]
    [switch]$Force
)

if ($PSBoundParameters.ContainsKey('Help') -or $args -contains '--help') {
    Write-Host "bbx uninstall" -ForegroundColor Green
    Write-Host "Remove BrowserBox and related files" -ForegroundColor Yellow
    Write-Host "Usage: bbx uninstall [--Force]" -ForegroundColor Cyan
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  --Force  Skip confirmation prompts during uninstall" -ForegroundColor White
    return
}

# Check if running as Administrator
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Not running as Administrator. Relaunching..." -ForegroundColor Yellow
    $arguments = @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-Command", "bbx uninstall"
    )
    if ($Force) { $arguments += "-Force" }
    Start-Process powershell -Verb RunAs -ArgumentList $arguments
    exit
}

Write-Host "Running as Administrator." -ForegroundColor Green

$installDir = "C:\Program Files\browserbox"
$bbxDir = "$installDir\windows-scripts"

Write-Host "Uninstalling BrowserBox..." -ForegroundColor Green

# Function to prompt for confirmation
function Confirm-Action {
    param (
        [string]$Message
    )
    if ($Force) { return $true }
    $response = Read-Host "$Message (Y/N)"
    return $response -eq 'Y' -or $response -eq 'y'
}

# Remove mkcert
$mkcertPath = (Get-Command mkcert -ErrorAction SilentlyContinue).Path
if ($mkcertPath -and (Confirm-Action "Remove mkcert?")) {
    Write-Host "Removing mkcert..." -ForegroundColor Cyan
    winget uninstall --id FiloSottile.mkcert --silent
    if ($?) {
        Write-Host "mkcert removed successfully."
    } else {
        Write-Warning "Failed to remove mkcert -- it may still be installed."
    }
} else {
    Write-Host "Skipping mkcert removal." -ForegroundColor Yellow
}

# Remove certbot
$certbotPath = (Get-Command certbot -ErrorAction SilentlyContinue).Path
if ($certbotPath -and (Confirm-Action "Remove Certbot?")) {
    Write-Host "Removing Certbot..." -ForegroundColor Cyan
    winget uninstall --id EFF.Certbot --silent
    if ($?) {
        Write-Host "Certbot removed successfully."
    } else {
        Write-Warning "Failed to remove Certbot -- it may still be installed."
    }
} else {
    Write-Host "Skipping Certbot removal." -ForegroundColor Yellow
}

# Remove install directory
if ((Test-Path $installDir) -and (Confirm-Action "Remove BrowserBox install directory ($installDir)?")) {
    Remove-Item $installDir -Recurse -Force
    Write-Host "Removed $installDir."
} else {
    Write-Host "Skipping removal of $installDir." -ForegroundColor Yellow
}

# Remove bbxDir from PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($currentPath -like "*$bbxDir*" -and (Confirm-Action "Remove $bbxDir from PATH?")) {
    $newPath = ($currentPath.Split(';') | Where-Object { $_ -ne $bbxDir }) -join ';'
    [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
    Write-Host "Removed $bbxDir from PATH."
} else {
    Write-Host "Skipping PATH cleanup -- $bbxDir remains." -ForegroundColor Yellow
}

Write-Host "BrowserBox uninstall complete!" -ForegroundColor Green
if (-not $Force) { Read-Host "Press Enter to exit..." }
