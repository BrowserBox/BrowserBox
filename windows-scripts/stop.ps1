[CmdletBinding()]
param (
    [string]$Hostname,
    [string]$Email,
    [int]$Port,
    [string]$Token,
    [int]$GraceSeconds = 5  # Default wait time for graceful shutdown
)

# Define paths
$configDir = "$env:USERPROFILE\.config\dosyago\bbpro"
$logDir = "$configDir\logs"
$mainPidFile = "$logDir\browserbox-main.pid"
$devtoolsPidFile = "$logDir\browserbox-devtools.pid"
$chromeBaseDir = "$configDir"  # Base directory for Chrome PID files

# Function to kill process by PID file with graceful shutdown
function Stop-ProcessByPidFile {
    param ([string]$PidFile, [string]$ServiceName)
    if (Test-Path $PidFile) {
        $processId = Get-Content $PidFile -ErrorAction SilentlyContinue
        if ($processId -and (Get-Process -Id $processId -ErrorAction SilentlyContinue)) {
            # Step 1: Attempt graceful shutdown with SIGINT
            Write-Host "Attempting graceful shutdown of $ServiceName service (PID: $processId)..." -ForegroundColor Cyan

            node -e "process.kill($processId, 'SIGINT')" 

            Start-Sleep -Seconds $GraceSeconds # Wait for specified grace period

            # Step 2: Check if process is still running, force stop if needed
            if (Get-Process -Id $processId -ErrorAction SilentlyContinue) {
                Write-Host "$ServiceName service did not exit gracefully, forcing shutdown..." -ForegroundColor Yellow
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                Write-Host "Forced stop of $ServiceName service (PID: $processId)." -ForegroundColor Cyan
            } else {
                Write-Host "$ServiceName service shut down gracefully (PID: $processId)." -ForegroundColor Cyan
            }
            Remove-Item $PidFile -Force  # Clean up PID file
        } else {
            Write-Host "$ServiceName service not running (PID: $processId)." -ForegroundColor Yellow
            Remove-Item $PidFile -Force  # Clean up stale PID file
        }
    } else {
        Write-Host "No PID file found for $ServiceName service." -ForegroundColor Yellow
    }
}

# Function to stop all Chrome processes by enumerating chrome-* subdirectories
function Stop-Chrome {
    # Enumerate all chrome-* subdirectories and stop processes
    $chromeDirs = Get-ChildItem -Path $chromeBaseDir -Directory | Where-Object { $_.Name -like "chrome-*" }
    foreach ($chromeDir in $chromeDirs) {
        $chromePidFile = "$chromeDir\pid"
        if (Test-Path $chromePidFile) {
            $chromePid = Get-Content $chromePidFile -ErrorAction SilentlyContinue
            if ($chromePid -and (Get-Process -Id $chromePid -ErrorAction SilentlyContinue)) {
                Write-Host "Attempting graceful shutdown of Chrome (PID: $chromePid)..." -ForegroundColor Cyan
                node -e "process.kill($chromePid, 'SIGINT')"  # Graceful shutdown via SIGINT

                Start-Sleep -Seconds $GraceSeconds # Wait for specified grace period

                # Check and force kill if still running
                $remainingChromeProcs = Get-Process -Id $chromePid -ErrorAction SilentlyContinue
                if ($remainingChromeProcs) {
                    Stop-Process -Id $chromePid -Force
                    Write-Host "Forced stop of Chrome process (PID: $chromePid)." -ForegroundColor Cyan
                } else {
                    Write-Host "Chrome process shut down gracefully (PID: $chromePid)." -ForegroundColor Cyan
                }

                Remove-Item $chromePidFile -Force  # Clean up PID file
            } else {
                Write-Host "Chrome process not running (PID: $chromePid)." -ForegroundColor Yellow
                Remove-Item $chromePidFile -Force  # Clean up stale PID file
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
    Start-Sleep -Seconds $GraceSeconds # Wait for specified grace period

    # Check and force kill any remaining processes
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

