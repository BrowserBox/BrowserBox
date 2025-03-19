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
    "install"   = "install.ps1"  # Will point to ib.ps1 logic
    "uninstall" = "uninstall.ps1"
    "setup"     = "setup.ps1"
    "start"     = "start.ps1"
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
        if ($Args) {
            & $scriptPath @Args  # Only splat if $Args has content
        } else {
            & $scriptPath        # No args, just run it
        }
    } else {
        Write-Error "Script for '$Command' not found at $scriptPath"
        Show-Help
        exit 1
    }
} else {
    Write-Error "Unknown command: $Command"
    Show-Help
    exit 1
}
