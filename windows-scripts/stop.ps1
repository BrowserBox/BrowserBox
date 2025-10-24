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

# --- Helper Functions ---
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
    if (-not (Test-Path $PidFile)) { Write-Verbose "PID file not found: $PidFile"; return $null }
    try {
        $raw = (Get-Content $PidFile -ErrorAction SilentlyContinue | Out-String).Trim()
        $pid = 0
        if ([int]::TryParse($raw, [ref]$pid)) { Write-Verbose "Read PID $pid from $PidFile"; return $pid } else { Write-Warning "Could not parse PID from $PidFile"; return $null }
    } catch { Write-Warning "Error reading PID file $PidFile: $_"; return $null }
}

function Wait-ForProcessExit {
    param (
        [Parameter(Mandatory=$true)][int]$Pid,
        [Parameter(Mandatory=$true)][int]$TimeoutSeconds
    )
    $start = Get-Date
    Write-Host "Waiting up to $TimeoutSeconds seconds for PID $Pid to exit..." -ForegroundColor Gray
    while ((New-TimeSpan -Start $start -End (Get-Date)).TotalSeconds -lt $TimeoutSeconds) {
        if (-not (Get-Process -Id $Pid -ErrorAction SilentlyContinue)) {
            Write-Host "Process PID $Pid exited gracefully." -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds 1
    }
    if (-not (Get-Process -Id $Pid -ErrorAction SilentlyContinue)) {
        Write-Host "Process PID $Pid exited within the timeout." -ForegroundColor Green
        return $true
    } else {
        Write-Host "Process PID $Pid did NOT exit within the timeout." -ForegroundColor Yellow
        return $false
    }
}

function Invoke-StopApi {
    param (
        [Parameter(Mandatory=$true)][string]$AppPort,
        [Parameter(Mandatory=$true)][string]$LoginToken
    )
    $httpsUrl = "https://localhost:${AppPort}/api/v1/stop_app?session_token=${LoginToken}"
    $httpUrl  = "http://localhost:${AppPort}/api/v1/stop_app?session_token=${LoginToken}"

    Write-Host "Attempting graceful shutdown via API on port $AppPort..." -ForegroundColor Cyan
    try {
        $out = & curl.exe -k -sS -o NUL -w "%{http_code}" -X POST "$httpsUrl"
        $code = if ($out -and $out.Length -ge 3) { $out.Substring($out.Length - 3) } else { "000" }
    } catch { $code = "000" } finally { $global:LASTEXITCODE = 0 }
    if ($code -eq "200") { Write-Host "API returned 200 via HTTPS." -ForegroundColor Green; return 200 }

    Write-Host "HTTPS call failed (Code: $code). Trying HTTP..." -ForegroundColor Gray
    try {
        $out2 = & curl.exe -sS -o NUL -w "%{http_code}" -X POST "$httpUrl"
        $code2 = if ($out2 -and $out2.Length -ge 3) { $out2.Substring($out2.Length - 3) } else { "000" }
    } catch { $code2 = "000" } finally { $global:LASTEXITCODE = 0 }
    if ($code2 -eq "200") { Write-Host "API returned 200 via HTTP." -ForegroundColor Green; return 200 }

    Write-Host "HTTP call also failed (Code: $code2)." -ForegroundColor Yellow
    return [int]$code2
}


# --- Main Execution ---

# 1. Get PID files
$mainPid = Read-Pid -PidFile $mainPidFile
$devPid  = Read-Pid -PidFile $devtoolsPidFile

if (-not $mainPid -and -not $devPid) {
    Write-Host "No PID files found. Assuming services are not running." -ForegroundColor Green
    exit 0
}

# 2. Kill devtools immediately
if ($devPid) {
    if (Get-Process -Id $devPid -ErrorAction SilentlyContinue) {
        Write-Host "Immediately stopping Devtools service (PID: $devPid)..." -ForegroundColor Yellow
        Stop-Process -Id $devPid -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "Devtools service (PID: $devPid from file) already stopped." -ForegroundColor Gray
    }
}

# 3. Graceful kill main via API
$envVars = Read-EnvFile -FilePath $testEnvPath
if ($mainPid -and $envVars['APP_PORT'] -and $envVars['LOGIN_TOKEN']) {
    if (Get-Process -Id $mainPid -ErrorAction SilentlyContinue) {
        $code = Invoke-StopApi -AppPort $envVars['APP_PORT'] -LoginToken $envVars['LOGIN_TOKEN']
        if ($code -eq 200) {
            [void](Wait-ForProcessExit -Pid $mainPid -TimeoutSeconds $GraceSeconds)
        } else {
            Write-Host "API shutdown failed or was not reachable. Proceeding to final check." -ForegroundColor Yellow
        }
    } else {
        Write-Host "Main service (PID: $mainPid from file) already stopped." -ForegroundColor Gray
    }
} elseif ($mainPid) {
    Write-Host "Skipping API shutdown for main service: required info (port, token) is missing." -ForegroundColor Gray
}

# 4. Final check and Force Kill
Write-Host "--- Final Check ---" -ForegroundColor Cyan

# Check and force kill main process if it's still running
if ($mainPid -and (Get-Process -Id $mainPid -ErrorAction SilentlyContinue)) {
    Write-Host "Main service (PID: $mainPid) is still running. Forcing shutdown..." -ForegroundColor Yellow
    Stop-Process -Id $mainPid -Force -ErrorAction SilentlyContinue
}

# Check and force kill devtools process if it's still running (it should be gone, but we double-check)
if ($devPid -and (Get-Process -Id $devPid -ErrorAction SilentlyContinue)) {
    Write-Host "Devtools service (PID: $devPid) is still running. Forcing shutdown..." -ForegroundColor Yellow
    Stop-Process -Id $devPid -Force -ErrorAction SilentlyContinue
}

# Wait 1 second for OS to clean up handles
Start-Sleep -Seconds 1

# Final verification
$mainStillRunning = $mainPid -and (Get-Process -Id $mainPid -ErrorAction SilentlyContinue)
$devStillRunning = $devPid -and (Get-Process -Id $devPid -ErrorAction SilentlyContinue)

if ($mainStillRunning) {
    Write-Error "Main service (PID: $mainPid) FAILED to stop."
}
if ($devStillRunning) {
    Write-Error "Devtools service (PID: $devPid) FAILED to stop."
}

if ($mainStillRunning -or $devStillRunning) {
    exit 1
} else {
    Write-Host "All tracked BrowserBox services stopped successfully." -ForegroundColor Green
    # Clean up PID files as a final step
    if (Test-Path $mainPidFile) { Remove-Item $mainPidFile -Force }
    if (Test-Path $devtoolsPidFile) { Remove-Item $devtoolsPidFile -Force }
    exit 0
}
