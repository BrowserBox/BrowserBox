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
    [Parameter(Mandatory = $false, HelpMessage = "Max seconds to wait for a process to terminate after kill (default: 7).")]
    [int]$GraceSeconds = 7
)

# Normalize exit code so external tools don't poison our step
$global:LASTEXITCODE = 0

# Paths
$configDir       = "$env:USERPROFILE\.config\dosyago\bbpro"
$logDir          = "$configDir\logs"
$mainPidFile     = "$logDir\browserbox-main.pid"
$devtoolsPidFile = "$logDir\browserbox-devtools.pid"

Write-Host "BrowserBox Shutdown Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

function Read-Pid {
    param([string]$PidFile)
    if (-not (Test-Path $PidFile)) { return $null }
    try {
        $raw = Get-Content $PidFile -ErrorAction SilentlyContinue | Out-String
        $raw = $raw.Trim()
        $pid = 0
        if ([int]::TryParse($raw, [ref]$pid)) { return $pid } else { return $null }
    } catch { return $null }
}

function Ensure-Stopped {
    param(
        [Parameter(Mandatory=$true)][int]$Pid,
        [Parameter(Mandatory=$true)][string]$Label,
        [Parameter(Mandatory=$true)][int]$TimeoutSeconds
    )
    $stillRunning = Get-Process -Id $Pid -ErrorAction SilentlyContinue
    if (-not $stillRunning) {
        Write-Host "$Label (PID: $Pid) is not running." -ForegroundColor Gray
        return $true
    }

    Write-Host "Stopping $Label (PID: $Pid)..." -ForegroundColor Cyan
    # One decisive attempt: force kill
    Stop-Process -Id $Pid -Force -ErrorAction SilentlyContinue

    # Wait up to TimeoutSeconds for it to go away
    try { Wait-Process -Id $Pid -Timeout $TimeoutSeconds -ErrorAction SilentlyContinue } catch {}

    Start-Sleep -Milliseconds 300
    $stillRunning = Get-Process -Id $Pid -ErrorAction SilentlyContinue
    if ($stillRunning) {
        Write-Error "$Label (PID: $Pid) still running after force kill."
        return $false
    } else {
        Write-Host "$Label (PID: $Pid) stopped." -ForegroundColor Green
        return $true
    }
}

function Remove-PidFile {
    param([string]$PidFile, [int]$Pid)
    if (Test-Path $PidFile) {
        $alive = if ($Pid) { Get-Process -Id $Pid -ErrorAction SilentlyContinue } else { $null }
        if (-not $alive) {
            Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
        }
    }
}

# Stop main
$overallOk = $true

$mainPid = Read-Pid -PidFile $mainPidFile
if ($mainPid) {
    if (-not (Ensure-Stopped -Pid $mainPid -Label "Main service" -TimeoutSeconds $GraceSeconds)) {
        $overallOk = $false
    }
    Remove-PidFile -PidFile $mainPidFile -Pid $mainPid
} else {
    if (Test-Path $mainPidFile) { Remove-Item $mainPidFile -Force -ErrorAction SilentlyContinue }
    Write-Host "Main PID file not found or unreadable." -ForegroundColor Yellow
}

# Stop devtools
$devPid = Read-Pid -PidFile $devtoolsPidFile
if ($devPid) {
    if (-not (Ensure-Stopped -Pid $devPid -Label "Devtools service" -TimeoutSeconds $GraceSeconds)) {
        $overallOk = $false
    }
    Remove-PidFile -PidFile $devtoolsPidFile -Pid $devPid
} else {
    if (Test-Path $devtoolsPidFile) { Remove-Item $devtoolsPidFile -Force -ErrorAction SilentlyContinue }
    Write-Host "Devtools PID file not found or unreadable." -ForegroundColor Yellow
}

# Stop Chrome processes (by PID files under chrome-* dirs)
$chromeDirs = Get-ChildItem -Path $configDir -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "chrome-*" }
foreach ($chromeDir in $chromeDirs) {
    $chromePidFile = Join-Path $chromeDir.FullName "pid"
    $chromePid = Read-Pid -PidFile $chromePidFile
    if ($chromePid) {
        if (-not (Ensure-Stopped -Pid $chromePid -Label "Chrome ($($chromeDir.Name))" -TimeoutSeconds $GraceSeconds)) {
            $overallOk = $false
        }
    }
    if (Test-Path $chromePidFile) { Remove-Item $chromePidFile -Force -ErrorAction SilentlyContinue }
}

if ($overallOk) {
    Write-Host "BrowserBox services stopped successfully." -ForegroundColor Green
    $global:LASTEXITCODE = 0
    exit 0
} else {
    # Only fail if a targeted PID survived a force kill
    Write-Error "Some processes could not be stopped after force kill."
    $global:LASTEXITCODE = 1
    exit 1
}
