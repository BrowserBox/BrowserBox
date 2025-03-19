# bbx.ps1
[CmdletBinding()]
param (
    [Parameter(Position=0)]
    [string]$Command,
    [Parameter(ValueFromRemainingArguments)]
    [string[]]$Args
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$installDir = "C:\Program Files\browserbox"
$commands = @{
    "install"   = "install.ps1"
    "uninstall" = "uninstall.ps1"
    # "prepare"   = "prepare.ps1"  # New! - but no need to include in CLI as called internally by install
    "setup"     = "setup.ps1"
    "run"       = "start.ps1"
    "stop"      = "stop.ps1"
}

function Show-Help {
    Write-Host "bbx CLI (Windows)" -ForegroundColor Green
    Write-Host "Usage: bbx <command> [args]" -ForegroundColor Yellow
    Write-Host "Commands:" -ForegroundColor Cyan
    $commands.Keys | Sort-Object | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
    Write-Host "Run 'bbx <command> --help' for command-specific options." -ForegroundColor Gray
}

if (-not $Command -or $Command -eq "--help") {
    Show-Help
    exit 0
}

if ($commands.ContainsKey($Command)) {
    $scriptPath = Join-Path $scriptDir $commands[$Command]
    if (Test-Path $scriptPath) {
        Write-Host "Running bbx $Command..." -ForegroundColor Cyan
        if ($Args) { & $scriptPath @Args } else { & $scriptPath }
    } else {
        Write-Error "Script for '$Command' not found at $scriptPath"
        if ($Command -eq "install") { Write-Host "Try running 'irm raw.githubusercontent.com/BrowserBox/BrowserBox/refs/heads/win/windows-scripts/install.ps1 | iex' first." -ForegroundColor Yellow }
        Show-Help
        exit 1
    }
} else {
    Write-Error "Unknown command: $Command"
    Show-Help
    exit 1
}
