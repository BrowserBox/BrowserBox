[CmdletBinding()]
param(
    [Parameter(Mandatory = $false, HelpMessage = "Show help.")]
    [switch]$Help
)

if ($Help -or $args -contains '-help') {
    Write-Host "bbx install" -ForegroundColor Green
    Write-Host "Install BrowserBox (binary distribution)" -ForegroundColor Yellow
    Write-Host "Usage: bbx install" -ForegroundColor Cyan
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -Help    Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Environment overrides:" -ForegroundColor Cyan
    Write-Host "  BBX_RELEASE_REPO, BBX_RELEASE_TAG, GH_TOKEN/GITHUB_TOKEN, BBX_NO_UPDATE" -ForegroundColor White
    $global:LASTEXITCODE = 0
    return
}

if (-not (Get-Command Download-Binary -ErrorAction SilentlyContinue)) {
    throw "install.ps1 must be invoked via bbx.ps1 (expects Download-Binary/Get-LatestRelease to be in scope)."
}

$tag = if ($env:BBX_RELEASE_TAG) { $env:BBX_RELEASE_TAG } else { Get-LatestRelease -Repo $ReleaseRepo }
if (-not $tag) {
    Write-Error "Could not determine release tag."
    exit 1
}

Download-Binary -Tag $tag

# Download manifest and signature to global system location (multiuser support)
$manifestUrl = "https://github.com/$ReleaseRepo/releases/download/$tag/release.manifest.json"
$sigUrl = "https://github.com/$ReleaseRepo/releases/download/$tag/release.manifest.json.sig"

# Try global location first (C:\ProgramData), fallback to user dir
$globalDir = Join-Path $env:PROGRAMDATA "dosaygo\bbpro"
$userConfigDir = "$env:USERPROFILE\.config\dosaygo\bbpro"

# Check if we can write to ProgramData (admin privileges)
$useGlobal = $false
try {
    if (-not (Test-Path $globalDir)) { 
        New-Item -ItemType Directory -Path $globalDir -Force -ErrorAction Stop | Out-Null 
    }
    $useGlobal = $true
} catch {
    # No admin access, use user config dir
    if (-not (Test-Path $userConfigDir)) { 
        New-Item -ItemType Directory -Path $userConfigDir -Force | Out-Null 
    }
}

$targetDir = if ($useGlobal) { $globalDir } else { $userConfigDir }
$locationDesc = if ($useGlobal) { "global location" } else { "user config" }

Write-Host "Downloading release manifest to $locationDesc..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $manifestUrl -OutFile (Join-Path $targetDir "release.manifest.json") -ErrorAction SilentlyContinue
    Invoke-WebRequest -Uri $sigUrl -OutFile (Join-Path $targetDir "release.manifest.json.sig") -ErrorAction SilentlyContinue
} catch {
    Write-Warning "Failed to download manifest or signature."
}

# Ensure cp_commands_only.ps1 copies the binary we just downloaded.
$env:BBX_BINARY_SOURCE_PATH = $BinaryPath

$depsScript = Join-Path $PSScriptRoot "install_deps.ps1"
if (Test-Path $depsScript) {
    & $depsScript
    exit $LASTEXITCODE
}

Write-Warning "install_deps.ps1 not found; BrowserBox binary downloaded to $BinaryPath."
exit 0
