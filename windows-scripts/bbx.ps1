# bbx.ps1 - BrowserBox Binary Installer & Wrapper for Windows
# This script downloads and runs pre-compiled BrowserBox binaries
# from the public BrowserBox/BrowserBox repository.

[CmdletBinding()]
param (
  [Parameter(Position=0)]
  [string]$Command,
  [Parameter(ValueFromRemainingArguments)]
  [string[]]$Args
)

$ErrorActionPreference = "Stop"

# Configuration
$PublicRepo = "BrowserBox/BrowserBox"
$BinaryDir = "$env:LOCALAPPDATA\browserbox\bin"
$BinaryName = "browserbox.exe"
$BinaryPath = Join-Path $BinaryDir $BinaryName

# Function to ensure binary directory exists
function Ensure-BinaryDir {
    if (-not (Test-Path $BinaryDir)) {
        New-Item -ItemType Directory -Path $BinaryDir -Force | Out-Null
    }
}

# Function to get the latest release tag from GitHub
function Get-LatestRelease {
    param([string]$Repo)
    
    $apiUrl = "https://api.github.com/repos/$Repo/releases/latest"
    
    try {
        $response = Invoke-RestMethod -Uri $apiUrl -TimeoutSec 10 -ErrorAction Stop
        return $response.tag_name
    }
    catch {
        Write-Error "Failed to fetch latest release from $Repo : $_"
        exit 1
    }
}

# Function to download the binary
function Download-Binary {
    param(
        [string]$Tag
    )
    
    Ensure-BinaryDir
    
    $assetName = "browserbox.exe"
    $downloadUrl = "https://github.com/$PublicRepo/releases/download/$Tag/$assetName"
    $tempFile = "$BinaryPath.tmp"
    
    Write-Host "Downloading BrowserBox $Tag for Windows..." -ForegroundColor Cyan
    
    try {
        # Use .NET WebClient for progress bar
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($downloadUrl, $tempFile)
        $webClient.Dispose()
        
        # Move to final location
        if (Test-Path $BinaryPath) {
            Remove-Item $BinaryPath -Force
        }
        Move-Item $tempFile $BinaryPath -Force
        
        Write-Host "Successfully downloaded and installed BrowserBox binary" -ForegroundColor Green
    }
    catch {
        Write-Error "Failed to download binary from $downloadUrl : $_"
        if (Test-Path $tempFile) {
            Remove-Item $tempFile -Force
        }
        exit 1
    }
}

# Function to check if binary exists
function Test-BinaryExists {
    Test-Path $BinaryPath
}

# Function to ensure binary is installed
function Ensure-Binary {
    if (-not (Test-BinaryExists)) {
        Write-Host "BrowserBox binary not found. Installing..." -ForegroundColor Yellow
        Ensure-BinaryDir
        $tag = Get-LatestRelease -Repo $PublicRepo
        Download-Binary -Tag $tag
    }
}

function Get-SemverFromText {
    param([string]$Text)
    $regex = '(?im)(v?\d+\.\d+(?:\.\d+)?(?:-[0-9A-Za-z\.-]+)?)'
    $match = [regex]::Match($Text, $regex)
    if ($match.Success) { return $match.Groups[1].Value }
    return $null
}

# Function to get binary version
function Get-BinaryVersion {
    if (Test-BinaryExists) {
        try {
            $output = & $BinaryPath "--version" 2>$null | Out-String
            $semver = Get-SemverFromText -Text $output
            if ($semver) { return $semver } else { return "unknown" }
        }
        catch {
            return "unknown"
        }
    }
    return "not_installed"
}

# Function to check for updates
function Check-Update {
    if (Test-BinaryExists) {
        $currentVersion = Get-BinaryVersion
        
        if ($currentVersion -eq "unknown" -or $currentVersion -eq "not_installed") {
            return
        }
        
        try {
            $latestTag = Get-LatestRelease -Repo $PublicRepo
            $latestNorm = $latestTag -replace '^[vV]'
            $currentNorm = $currentVersion -replace '^[vV]'
            if ($latestNorm -and $currentNorm -and $latestNorm -ne $currentNorm) {
                Write-Host "Note: A new version of BrowserBox is available: $latestTag" -ForegroundColor Yellow
                Write-Host "      Run 'bbx install' to update."
            }
        }
        catch {
            # Silently ignore update check failures
        }
    }
}

# Function to show help
function Show-Help {
    Write-Host "bbx CLI (Windows Binary Distribution)" -ForegroundColor Green
    Write-Host "Usage: bbx <command> [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Core Commands:" -ForegroundColor Cyan
    Write-Host "  install         Install BrowserBox binary and CLI" -ForegroundColor White
    Write-Host "  update          Update BrowserBox to the latest version" -ForegroundColor White
    Write-Host "  --version, -v   Show version information" -ForegroundColor White
    Write-Host "  --help, -h      Show this help message" -ForegroundColor White
    Write-Host "  revalidate      Clear ticket and revalidate license" -ForegroundColor White
    Write-Host ""
    Write-Host "All other commands are passed through to the browserbox binary." -ForegroundColor Gray
    Write-Host "Run 'browserbox --help' after installation for full command list." -ForegroundColor Gray
}

# Function to handle revalidate command
function Invoke-Revalidate {
    $ticketPath = Join-Path $env:USERPROFILE ".config\dosyago\bbpro\tickets\ticket.json"
    
    if (-not (Test-Path (Split-Path $ticketPath))) {
        Write-Warning "Ticket directory does not exist at $(Split-Path $ticketPath)"
        return
    }
    
    if (Test-Path $ticketPath) {
        Write-Host "Removing ticket.json..." -ForegroundColor Cyan
        Remove-Item $ticketPath -Force
        Write-Host "ticket.json removed. License will be revalidated on next use." -ForegroundColor Green
    }
    else {
        Write-Host "No ticket found at $ticketPath" -ForegroundColor Yellow
    }
}

# Main execution logic
if ($Command -eq "install" -or $Command -eq "update") {
    # Install/update command explicitly downloads/updates the binary
    $tag = Get-LatestRelease -Repo $PublicRepo
    Download-Binary -Tag $tag
    
    if ($Command -eq "install") {
        # Run the binary with --install flag
        $installArgs = @("--install") + $Args
        & $BinaryPath $installArgs
        exit $LASTEXITCODE
    }
    else {
        # For update, just report success
        Write-Host "BrowserBox updated to $tag" -ForegroundColor Green
        exit 0
    }
}
elseif ($Command -eq "--version" -or $Command -eq "-v") {
    Ensure-Binary
    & $BinaryPath "--version"
    exit $LASTEXITCODE
}
elseif (-not $Command -or $Command -eq "-help" -or $Command -eq "--help" -or $Command -eq "-h") {
    Show-Help
    exit 0
}
elseif ($Command -eq "revalidate") {
    Invoke-Revalidate
    exit 0
}
else {
    # For all other commands, ensure binary exists and pass through
    Ensure-Binary
    
    # Add binary directory to PATH for this session if not already there
    if ($env:PATH -notlike "*$BinaryDir*") {
        $env:PATH = "$BinaryDir;$env:PATH"
    }
    
    # Optional: Check for updates (non-blocking)
    if (-not $env:BBX_NO_UPDATE) {
        try {
            Check-Update
        }
        catch {
            # Silently ignore
        }
    }
    
    # Pass all arguments through to the binary
    $allArgs = @($Command) + $Args
    & $BinaryPath $allArgs
    exit $LASTEXITCODE
}
