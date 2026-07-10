[CmdletBinding()]
param(
    [Parameter(Mandatory = $false, HelpMessage = "Show help.")]
    [switch]$Help
)

if ($Help -or $args -contains '-help') {
    Write-Host "bbx update" -ForegroundColor Green
    Write-Host "Update BrowserBox (binary distribution)" -ForegroundColor Yellow
    Write-Host "Usage: bbx update" -ForegroundColor Cyan
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -Help    Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Environment overrides:" -ForegroundColor Cyan
    Write-Host "  BBX_RELEASE_REPO, BBX_RELEASE_TAG, GH_TOKEN/GITHUB_TOKEN, BBX_NO_UPDATE" -ForegroundColor White
    $global:LASTEXITCODE = 0
    return
}

if (-not (Get-Command Download-Binary -ErrorAction SilentlyContinue)) {
    throw "update.ps1 must be invoked via bbx.ps1 (expects Download-Binary/Get-LatestRelease to be in scope)."
}

$tag = if ($env:BBX_RELEASE_TAG) { $env:BBX_RELEASE_TAG } else { Get-LatestRelease -Repo $ReleaseRepo }
if (-not $tag) {
    Write-Error "Could not determine release tag."
    exit 1
}

Download-Binary -Tag $tag

# Update PATH-installed binary if wrappers are installed.
$env:BBX_BINARY_SOURCE_PATH = $BinaryPath
$copyScript = Join-Path $PSScriptRoot "cp_commands_only.ps1"
if (Test-Path $copyScript) {
    & $copyScript | Out-Null
}

Write-Host "BrowserBox updated to $tag" -ForegroundColor Green
exit 0
