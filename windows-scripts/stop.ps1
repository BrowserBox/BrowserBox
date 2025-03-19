# stop.ps1
[CmdletBinding()]
param (
    [string]$Hostname,
    [string]$Email,
    [int]$Port,
    [string]$Token
)

# Define paths
$configDir = "$env:USERPROFILE\.config\dosyago\bbpro"
$logDir = "$configDir\logs"
$mainPidFile = "$logDir\browserbox-main.pid"
$devtoolsPidFile = "$logDir\browserbox-devtools.pid"

# Function to kill process by PID file
function Stop-ProcessByPidFile {
    param ([string]$PidFile, [string]$ServiceName)
    if (Test-Path $PidFile) {
        $processId = Get-Content $PidFile -ErrorAction SilentlyContinue
        if ($processId -and (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped $ServiceName service (PID: $processId)." -ForegroundColor Cyan
            Remove-Item $PidFile -Force  # Clean up PID file
        } else {
            Write-Host "$ServiceName service not running (PID: $processId)." -ForegroundColor Yellow
            Remove-Item $PidFile -Force  # Clean up stale PID file
        }
    } else {
        Write-Host "No PID file found for $ServiceName service." -ForegroundColor Yellow
    }
}

# Stop services by PID
Stop-ProcessByPidFile -PidFile $mainPidFile -ServiceName "main"
Stop-ProcessByPidFile -PidFile $devtoolsPidFile -ServiceName "devtools"

# Backup: Kill any lingering node processes
$nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*server.js*" -or $_.CommandLine -like "*index.js*"
}
if ($nodeProcs) {
    $nodeProcs | Stop-Process -Force
    Write-Host "Stopped additional Node.js BrowserBox processes." -ForegroundColor Cyan
} else {
    Write-Host "No additional Node.js BrowserBox processes found." -ForegroundColor Yellow
}

Write-Host "BrowserBox services stopped successfully." -ForegroundColor Green
