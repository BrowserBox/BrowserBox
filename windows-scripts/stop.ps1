# stop.ps1
# Located at C:\Program Files\browserbox\windows-scripts\stop.ps1
[CmdletBinding()]
param ()

# Define paths
$configDir = "$env:USERPROFILE\.config\dosyago\bbpro"
$logDir = "$configDir\logs"

# Define PID files
$mainPidFile = "$logDir\browserbox-main.pid"
$devtoolsPidFile = "$logDir\browserbox-devtools.pid"

# Function to kill process by PID file
function Stop-ProcessByPidFile {
    param ([string]$PidFile, [string]$ServiceName)
    if (Test-Path $PidFile) {
        $pid = Get-Content $PidFile -ErrorAction SilentlyContinue
        if ($pid -and (Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped $ServiceName service (PID: $pid)." -ForegroundColor Cyan
            Remove-Item $PidFile -Force  # Clean up PID file
        } else {
            Write-Host "$ServiceName service not running (PID: $pid)." -ForegroundColor Yellow
            Remove-Item $PidFile -Force  # Clean up stale PID file
        }
    } else {
        Write-Host "No PID file found for $ServiceName service." -ForegroundColor Yellow
    }
}

# Stop services by PID
Stop-ProcessByPidFile -PidFile $mainPidFile -ServiceName "main"
Stop-ProcessByPidFile -PidFile $devtoolsPidFile -ServiceName "devtools"

# Backup: Kill any remaining node processes (just in case)
$nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*server.js*" -or $_.CommandLine -like "*index.js*"
}
if ($nodeProcs) {
    $nodeProcs | Stop-Process -Force
    Write-Host "Stopped additional Node.js BrowserBox processes." -ForegroundColor Cyan
}

Write-Host "BrowserBox services stopped successfully." -ForegroundColor Green
