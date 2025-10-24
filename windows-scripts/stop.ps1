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
    [Parameter(Mandatory = $false, HelpMessage = "Wait time in seconds for graceful shutdown (default: 7).")]
    [int]$GraceSeconds = 7
)

if ($PSBoundParameters.ContainsKey('Help') -or $args -contains '-help') {
    Write-Host "bbx stop" -ForegroundColor Green
    Write-Host "Stop BrowserBox services" -ForegroundColor Yellow
    Write-Host "Usage: bbx stop [-GraceSeconds <seconds>]" -ForegroundColor Cyan
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -GraceSeconds  Wait time in seconds for graceful shutdown (default: 7)" -ForegroundColor White
    Write-Host "Note: --Hostname, --Email, --Port, -Token are accepted but unused" -ForegroundColor Gray
    return
}

# Normalize native exit code so external tools (curl.exe) can't poison the step
$global:LASTEXITCODE = 0

# Paths
$configDir       = "$env:USERPROFILE\.config\dosyago\bbpro"
$testEnvPath     = "$configDir\test.env"
$logDir          = "$configDir\logs"
$mainPidFile     = "$logDir\browserbox-main.pid"
$devtoolsPidFile = "$logDir\browserbox-devtools.pid"

Write-Host "BrowserBox Shutdown Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

function Read-EnvFile {
    param ([string]$FilePath)
    if (-not (Test-Path $FilePath)) { return $null }
    $envVars = @{}
    Get-Content $FilePath | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            $envVars[$matches[1].Trim()] = $matches[2].Trim().Trim('"')
        }
    }
    return $envVars
}

function Read-Pid {
    param([string]$PidFile)
    if (-not (Test-Path $PidFile)) { return $null }
    try {
        $raw = (Get-Content $PidFile -ErrorAction SilentlyContinue | Out-String).Trim()
        $pid = 0
        if ([int]::TryParse($raw, [ref]$pid)) { return $pid } else { return $null }
    } catch { return $null }
}

function Wait-ForProcessExit {
    param (
        [Parameter(Mandatory=$true)][int]$Pid,
        [Parameter(Mandatory=$true)][int]$TimeoutSeconds
    )
    $start = Get-Date
    while ((New-TimeSpan -Start $start -End (Get-Date)).TotalSeconds -lt $TimeoutSeconds) {
        $p = Get-Process -Id $Pid -ErrorAction SilentlyContinue
        if (-not $p) { return $true }
        try { Wait-Process -Id $Pid -Timeout 1 -ErrorAction SilentlyContinue } catch {}
    }
    return -not (Get-Process -Id $Pid -ErrorAction SilentlyContinue)
}

function Ensure-Stopped {
    param(
        [Parameter(Mandatory=$true)][int]$Pid,
        [Parameter(Mandatory=$true)][string]$Label,
        [Parameter(Mandatory=$true)][int]$PreGraceSeconds  # 0 means skip grace
    )
    if (-not $Pid) { return $true }
    $p = Get-Process -Id $Pid -ErrorAction SilentlyContinue
    if (-not $p) {
        Write-Host "$Label (PID: $Pid) is not running." -ForegroundColor Gray
        return $true
    }

    # Optional grace (only for main, when requested)
    if ($PreGraceSeconds -gt 0) {
        $exited = Wait-ForProcessExit -Pid $Pid -TimeoutSeconds $PreGraceSeconds
        if ($exited) {
            Write-Host "$Label (PID: $Pid) shut down gracefully." -ForegroundColor Green
            return $true
        }
    }

    # Force kill, then 1s wait and verify
    Write-Host "Forcing shutdown of $Label (PID: $Pid)..." -ForegroundColor Yellow
    Stop-Process -Id $Pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1

    $alive = Get-Process -Id $Pid -ErrorAction SilentlyContinue
    if ($alive) {
        Write-Host "Error: $Label (PID: $Pid) still running after force kill + 1s wait." -ForegroundColor Red
        return $false
    } else {
        Write-Host "$Label (PID: $Pid) stopped." -ForegroundColor Green
        return $true
    }
}

function Remove-PidFileIfGone {
    param([string]$PidFile, [int]$Pid)
    if (-not (Test-Path $PidFile)) { return }
    $alive = if ($Pid) { Get-Process -Id $Pid -ErrorAction SilentlyContinue } else { $null }
    if (-not $alive) {
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    }
}

function Invoke-StopApi {
    param (
        [Parameter(Mandatory=$true)][string]$AppPort,
        [Parameter(Mandatory=$true)][string]$LoginToken
    )
    $httpsUrl = "https://localhost:${AppPort}/api/v1/stop_app?session_token=${LoginToken}"
    $httpUrl  = "http://localhost:${AppPort}/api/v1/stop_app?session_token=${LoginToken}"

    Write-Host "Initiating graceful shutdown via API..." -ForegroundColor Cyan
    Write-Host "Port: $AppPort, Token: [REDACTED]" -ForegroundColor Gray

    try {
        $out = & curl.exe -k -sS -o NUL -w "%{http_code}" -X POST "$httpsUrl"
        $code = if ($out -and $out.Length -ge 3) { $out.Substring($out.Length - 3) } else { "000" }
    } catch { $code = "000" } finally { $global:LASTEXITCODE = 0 }

    if ($code -eq "200") { return 200 }

    try {
        $out2 = & curl.exe -sS -o NUL -w "%{http_code}" -X POST "$httpUrl"
        $code2 = if ($out2 -and $out2.Length -ge 3) { $out2.Substring($out2.Length - 3) } else { "000" }
    } catch { $code2 = "000" } finally { $global:LASTEXITCODE = 0 }

    return [int]$code2
}

# Load env for API auth (if present)
$envVars = Read-EnvFile -FilePath $testEnvPath
$appPort    = $envVars['APP_PORT']
$loginToken = $envVars['LOGIN_TOKEN']

# Read tracked PIDs
$mainPid = Read-Pid -PidFile $mainPidFile
$devPid  = Read-Pid -PidFile $devtoolsPidFile

# 1) Try API shutdown for MAIN only (if we have env + main PID)
$graceWait = 0
if ($appPort -and $loginToken -and $mainPid) {
    Write-Host "Main process PID: $mainPid" -ForegroundColor Gray
    $code = Invoke-StopApi -AppPort $appPort -LoginToken $loginToken
    if ($code -eq 200) {
        Write-Host "Shutdown request accepted (200). Waiting up to $GraceSeconds seconds..." -ForegroundColor Green
        # We provide grace here; the final ensure below will not wait again.
        [void](Wait-ForProcessExit -Pid $mainPid -TimeoutSeconds $GraceSeconds)
        $graceWait = 0
    } else {
        Write-Host "API returned non-200 ($code). Proceeding to direct termination." -ForegroundColor Yellow
        # No grace on ensure (we didn't initiate graceful shutdown)
        $graceWait = 0
    }
}

# 2) ALWAYS ensure every tracked process is stopped
$overallOk = $true

# Main: we've either already waited (on 200) or we go straight to force
if ($mainPid) {
    if (-not (Ensure-Stopped -Pid $mainPid -Label "Main service" -PreGraceSeconds $graceWait)) { $overallOk = $false }
    Remove-PidFileIfGone -PidFile $mainPidFile -Pid $mainPid
}

# Devtools: always ensure (force if needed), no grace
if ($devPid) {
    if (-not (Ensure-Stopped -Pid $devPid -Label "Devtools service" -PreGraceSeconds 0)) { $overallOk = $false }
    Remove-PidFileIfGone -PidFile $devtoolsPidFile -Pid $devPid
}

# Chrome: scan chrome-* dirs for pid files and ensure each is down (force), no grace
$chromeDirs = Get-ChildItem -Path $configDir -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "chrome-*" }
foreach ($chromeDir in $chromeDirs) {
    $chromePidFile = Join-Path $chromeDir.FullName "pid"
    $chromePid = Read-Pid -PidFile $chromePidFile
    if ($chromePid) {
        if (-not (Ensure-Stopped -Pid $chromePid -Label "Chrome ($($chromeDir.Name))" -PreGraceSeconds 0)) { $overallOk = $false }
    }
    if (Test-Path $chromePidFile) { Remove-Item $chromePidFile -Force -ErrorAction SilentlyContinue }
}

# Final exit code policy:
# - Exit 0 unless a tracked PID survived a force kill + 1s verify
if ($overallOk) {
    Write-Host "BrowserBox services stopped successfully." -ForegroundColor Green
    $global:LASTEXITCODE = 0
    exit 0
} else {
    Write-Host "Some tracked processes could not be stopped after force kill." -ForegroundColor Red
    $global:LASTEXITCODE = 1
    exit 1
}
