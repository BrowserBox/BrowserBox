[CmdletBinding()]
param (
    [Parameter(Mandatory = $false, HelpMessage = "Specify the hostname (unused).")]
    [string]$Hostname,
    [Parameter(Mandatory = $false, HelpMessage = "Provide an email address (unused).")]
    [string]$Email,
    [Parameter(Mandatory = $false, HelpMessage = "Specify the main port (unused).")]
    [int]$Port,
    [Parameter(Mandatory = $false, HelpMessage = "Provide a specific login token (unused).")]
    [string]$Token,
    [Parameter(Mandatory = $false, HelpMessage = "Wait time in seconds for graceful shutdown (default: 5).")]
    [int]$GraceSeconds = 5
)

if ($PSBoundParameters.ContainsKey('Help') -or $args -contains '--help') {
    Write-Host "bbx stop" -ForegroundColor Green
    Write-Host "Stop BrowserBox services" -ForegroundColor Yellow
    Write-Host "Usage: bbx stop [--GraceSeconds <seconds>]" -ForegroundColor Cyan
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  --GraceSeconds  Wait time in seconds for graceful shutdown (default: 5)" -ForegroundColor White
    Write-Host "Note: --Hostname, --Email, --Port, --Token are accepted but unused" -ForegroundColor Gray
    return
}

# Define paths
$configDir = "$env:USERPROFILE\.config\dosyago\bbpro"
$logDir = "$configDir\logs"
$mainPidFile = "$logDir\browserbox-main.pid"
$devtoolsPidFile = "$logDir\browserbox-devtools.pid"
$chromeBaseDir = "$configDir"

# Function to kill process by PID file with graceful shutdown
function Stop-ProcessByPidFile {
    param ([string]$PidFile, [string]$ServiceName)
    if (Test-Path $PidFile) {
        $processId = Get-Content $PidFile -ErrorAction SilentlyContinue
        if ($processId -and (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
            Write-Host "Attempting graceful shutdown of $ServiceName service (PID: $processId)..." -ForegroundColor Cyan
            node -e "process.kill($processId, 'SIGINT')"
            Start-Sleep -Seconds $GraceSeconds
            if (Get-Process -Id $processId -ErrorAction SilentlyContinue) {
                Write-Host "$ServiceName service did not exit gracefully, forcing shutdown..." -ForegroundColor Yellow
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                Write-Host "Forced stop of $ServiceName service (PID: $processId)." -ForegroundColor Cyan
            } else {
                Write-Host "$ServiceName service shut down gracefully (PID: $processId)." -ForegroundColor Cyan
            }
            Remove-Item $PidFile -Force
        } else {
            Write-Host "$ServiceName service not running (PID: $processId)." -ForegroundColor Yellow
            Remove-Item $PidFile -Force
        }
    } else {
        Write-Host "No PID file found for $ServiceName service." -ForegroundColor Yellow
    }
}

# Function to stop all Chrome processes by enumerating chrome-* subdirectories
function Stop-Chrome {
    $chromeDirs = Get-ChildItem -Path $chromeBaseDir -Directory | Where-Object { $_.Name -like "chrome-*" }
    foreach ($chromeDir in $chromeDirs) {
        $chromePidFile = "$chromeDir\pid"
        if (Test-Path $chromePidFile) {
            $chromePid = Get-Content $chromePidFile -ErrorAction SilentlyContinue
            if ($chromePid -and (Get-Process -Id $chromePid -ErrorAction SilentlyContinue)) {
                Write-Host "Attempting graceful shutdown of Chrome (PID: $chromePid)..." -ForegroundColor Cyan
                node -e "process.kill($chromePid, 'SIGINT')"
                Start-Sleep -Seconds $GraceSeconds
                $remainingChromeProcs = Get-Process -Id $chromePid -ErrorAction SilentlyContinue
                if ($remainingChromeProcs) {
                    Stop-Process -Id $chromePid -Force
                    Write-Host "Forced stop of Chrome process (PID: $chromePid)." -ForegroundColor Cyan
                } else {
                    Write-Host "Chrome process shut down gracefully (PID: $chromePid)." -ForegroundColor Cyan
                }
                Remove-Item $chromePidFile -Force
            } else {
                Write-Host "Chrome process not running (PID: $chromePid)." -ForegroundColor Yellow
                Remove-Item $chromePidFile -Force
            }
        } else {
            Write-Host "No PID file found for Chrome in $chromeDir." -ForegroundColor Yellow
        }
    }
}

# Stop services by PID
Stop-ProcessByPidFile -PidFile $mainPidFile -ServiceName "main"
Stop-ProcessByPidFile -PidFile $devtoolsPidFile -ServiceName "devtools"

# Stop Chrome by enumerating the directories
Stop-Chrome

# Backup: Kill any lingering node processes with graceful shutdown attempt
$nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*server.js*" -or $_.CommandLine -like "*index.js*"
}
if ($nodeProcs) {
    foreach ($proc in $nodeProcs) {
        Write-Host "Attempting graceful shutdown of additional Node.js process (PID: $($proc.Id))..." -ForegroundColor Cyan
        node -e "process.kill($($proc.Id), 'SIGINT')"
    }
    Start-Sleep -Seconds $GraceSeconds
    $remainingProcs = $nodeProcs | Where-Object { Get-Process -Id $_.Id -ErrorAction SilentlyContinue }
    if ($remainingProcs) {
        $remainingProcs | Stop-Process -Force
        Write-Host "Forced stop of remaining Node.js BrowserBox processes." -ForegroundColor Cyan
    } else {
        Write-Host "All additional Node.js BrowserBox processes shut down gracefully." -ForegroundColor Cyan
    }
} else {
    Write-Host "No additional Node.js BrowserBox processes found." -ForegroundColor Yellow
}

Write-Host "BrowserBox services stopped successfully." -ForegroundColor Green
