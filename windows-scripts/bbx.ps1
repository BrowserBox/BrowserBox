# bbx.ps1
# PowerShell wrapper for BrowserBox CLI on Windows
[CmdletBinding()]
param (
    [Parameter(Position=0, Mandatory=$false)]
    [string]$Command,
    [Parameter(ValueFromRemainingArguments)]
    [string[]]$Args
)

# Set script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Define available commands and their scripts
$commands = @{
    "setup"     = "setup.ps1"
    "start"     = "start.ps1"
    "stop"      = "stop.ps1"
    "uninstall" = "uninstall.ps1"
    # Add more as needed, e.g., "docker-start" = "docker-start.ps1"
}

# Help function
function Show-Help {
    Write-Host "bbx CLI (Windows)" -ForegroundColor Green
    Write-Host "Usage: bbx <command> [args]" -ForegroundColor Yellow
    Write-Host "Commands:" -ForegroundColor Cyan
    $commands.Keys | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
    Write-Host "Run 'bbx <command> --help' for command-specific options." -ForegroundColor Gray
}

# Main logic
if (-not $Command -or $Command -eq "--help") {
    Show-Help
    exit 0
}

if ($commands.ContainsKey($Command)) {
    $scriptPath = Join-Path $scriptDir $commands[$Command]
    if (Test-Path $scriptPath) {
        Write-Host "Running bbx $Command..." -ForegroundColor Cyan
        try {
            & $scriptPath @Args
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Command '$Command' failed with exit code $LASTEXITCODE"
                exit $LASTEXITCODE
            }
        } catch {
            Write-Error "Error running '$Command': $_"
            exit 1
        }
    } else {
        Write-Error "Script for '$Command' not found at $scriptPath"
        exit 1
    }
} else {
    Write-Error "Unknown command: $Command"
    Show-Help
    exit 1
}
