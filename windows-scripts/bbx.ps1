# bbx.ps1
[CmdletBinding()]
param (
    [Parameter(Position=0)]
    [string]$Command,
    [Parameter(ValueFromRemainingArguments)]
    [string[]]$Args
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$installDir = "C:\Program Files\browserbox"  # Match ib.ps1
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
    if ($Command -eq "install") {
        # Special case: install calls ib.ps1 from installDir
        $installScript = Join-Path $installDir "ib.ps1"
        if (Test-Path $installScript) {
            & powershell -NoProfile -ExecutionPolicy Bypass -File "$installScript" @Args
        } else {
            Write-Error "Install script not found at $installScript. Run 'irm raw.githubusercontent.com/BrowserBox/BrowserBox/refs/heads/win/ib.ps1 | iex' first."
            exit 1
        }
    } elseif (Test-Path $scriptPath) {
        & $scriptPath @Args
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
