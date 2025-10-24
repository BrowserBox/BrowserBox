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

# Normalize native exit code so external tools (curl.exe) can't poison the step
$global:LASTEXITCODE = 0

# Paths
$configDir       = "$env:USERPROFILE\.config\dosyago\bbpro"
$testEnvPath     = "$configDir\test.env"
$logDir          = "$configDir\logs"
$mainPidFile     = "$logDir\browserbox-main.pid"
$devtoolsPidFile = "$logDir\browserbox-devtools.pid"
$chromeBaseDir   = "$configDir"

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

function Remove-PidFileIfGone {
    param([string]$PidFile, [int]$Pid)
    if (Test-Path $PidFile) {
        $alive = if ($Pid) { Get-Process -Id $Pid -ErrorAction SilentlyContinue } else { $null }
        if (-not $alive) { Remove-Item $PidFile -Force -ErrorAction SilentlyContinue }
    }
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
    # Final check after loop
    return -not (Get-Process -Id $Pid -ErrorAction SilentlyContinue)
}

function Ensure-Stopped {
    param(
        [Parameter(Mandatory=$true)][int]$Pid,
        [Parameter(Mandatory=$true)][string]$Label,
        [Parameter(Mandatory=$true)][int]$GraceSeconds
    )
    $p = Get-Process -Id $Pid -ErrorAction SilentlyContinue
    if (-not $p) {
        Write-Host "$Label (PID: $Pid) is not running." -ForegroundColor Gray
        return $true
    }

    # Give it up to GraceSeconds to exit gracefully (if a prior API shutdown was sent)
    $exited = Wait-ForProcessExit -Pid $Pid -TimeoutSeconds $GraceSeconds
    if ($exited) {
        Write-Host "$Label (PID: $Pid) shut down gracefully." -ForegroundColor Green
        return $true
    }

    # Force kill, then 1s wait and verify
    Write-Host "$Label (PID: $Pid) did not exit in $GraceSeconds s. Forcing shutdown..." -ForegroundColor Yellow
    Stop-Process -Id $Pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1

    $alive = Get-Process -Id $Pid -ErrorAction SilentlyContinue
    if ($alive) {
        Write-Error "$Label (PID: $Pid) still running after force kill + 1s wait."
        return $false
    } else {
        Write-Host "$Label (PID: $Pid) forcefully stopped." -ForegroundColor Cyan
        return $true
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

# Read env for API auth
$envVars = Read-EnvFile -FilePath $testEnvPath
$appPort    = $envVars['APP_PORT']
$loginToken = $envVars['LOGIN_TOKEN']

# Read tracked PIDs
$mainPid = Read-Pid -PidFile $mainPidFile
$devPid  = Read-Pid -PidFile $devtoolsPidFile

# 1) Try API shutdown (if we have env + main PID)
$apiOK = $false
if ($appPort -and $loginToken -and $mainPid) {
    Write-Host "Main process PID: $mainPid" -ForegroundColor Gray
    $code = Invoke-StopApi -AppPort $appPort -LoginToken $loginToken
    if ($code -eq 200) {
        Write-Host "Shutdown request accepted (200). Waiting up to $GraceSeconds seconds..." -ForegroundColor Green
        # The Ensure-Stopped call itself will do the wait and, if needed, force kill + 1s verify
        $apiOK = Ensure-Stopped -Pid $mainPid -Label "Main service" -GraceSeconds $GraceSeconds
        Remove-PidFileIfGone -PidFile $mainPidFile -Pid $mainPid
    } else {
        Write-Host "API returned non-200: $code. Proceeding to direct termination." -ForegroundColor Yellow
    }
}

# 2) If API path not used or failed, still ensure main is down
$overallOk = $true
if (-not $apiOK -and $mainPid) {
    if (-not (Ensure-Stopped -Pid $mainPid -Label "Main service" -GraceSeconds $GraceSeconds)) { $overallOk = $false }
    Remove-PidFileIfGone -PidFile $mainPidFile -Pid $mainPid
}

# 3) Always stop devtools if tracked
if ($devPid) {
    if (-not (Ensure-Stopped -Pid $devPid -Label "Devtools service" -GraceSeconds 2)) { $overallOk = $false }
    Remove-PidFileIfGone -PidFile $devtoolsPidFile -Pid $devPid
}

# 4) Always stop Chrome PIDs discovered by pid files
$chromeDirs = Get-ChildItem -Path $chromeBaseDir -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "chrome-*" }
foreach ($chromeDir in $chromeDirs) {
    $chromePidFile = Join-Path $chromeDir.FullName "pid"
    $chromePid = Read-Pid -PidFile $chromePidFile
    if ($chromePid) {
        if (-not (Ensure-Stopped -Pid $chromePid -Label "Chrome ($($chromeDir.Name))" -GraceSeconds 2)) { $overallOk = $false }
    }
    if (Test-Path $chromePidFile) { Remove-Item $chromePidFile -Force -ErrorAction SilentlyContinue }
}

# Final exit code policy:
# - Exit 0 unless a tracked PID survived a force kill + 1s wait
if ($overallOk) {
    Write-Host "BrowserBox services stopped successfully." -ForegroundColor Green
    $global:LASTEXITCODE = 0
    exit 0
} else {
    Write-Error "Some tracked processes could not be stopped after force kill."
    $global:LASTEXITCODE = 1
    exit 1
}
