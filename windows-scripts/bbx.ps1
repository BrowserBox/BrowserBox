# bbx.ps1
[CmdletBinding()]
param (
    [Parameter(Position=0, Mandatory=$true)]
    [string]$Command,
    [Parameter(ValueFromRemainingArguments)]
    [string[]]$Args
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$installDir = "C:\Program Files\browserbox"
$commands = @{
    "install"   = "install.ps1"
    "uninstall" = "uninstall.ps1"
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

if ($Command -eq "--help") {
    Show-Help
    exit 0
}

if ($commands.ContainsKey($Command)) {
    $scriptPath = Join-Path $scriptDir $commands[$Command]
    if (Test-Path $scriptPath) {
        Write-Host "Running bbx $Command..." -ForegroundColor Cyan
        if ($Args) {
            # Parse arguments into a hashtable
            $params = @{}
            for ($i = 0; $i -lt $Args.Length; $i++) {
                if ($Args[$i] -match '^-(.+)$') {
                    $paramName = $matches[1]
                    if ($i + 1 -lt $Args.Length -and $Args[$i + 1] -notmatch '^-.+') {
                        $params[$paramName] = $Args[$i + 1]
                        $i++
                    } else {
                        $params[$paramName] = $true  # Treat as a flag if no value follows
                    }
                }
            }
            # Invoke the script with splatted parameters
            & $scriptPath @params
        } else {
            # Invoke the script without arguments
            & $scriptPath
        }
    } else {
        Write-Error "Script for '$Command' not found at $scriptPath"
        if ($Command -eq "install") { 
            Write-Host "Try running 'irm bbx.dosaygo.com | iex' first." -ForegroundColor Yellow 
        }
        Show-Help
        exit 1
    }
} else {
    Write-Error "Unknown command: $Command"
    Show-Help
    exit 1
}
