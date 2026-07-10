[CmdletBinding()]
param (
    [Parameter(Mandatory = $false, HelpMessage = "Show help.")]
    [switch]$Help,
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

if ($Help -or $args -contains '-help') {
    Write-Host "bbx stop" -ForegroundColor Green
    Write-Host "Stop BrowserBox services" -ForegroundColor Yellow
    Write-Host "Usage: bbx stop [-GraceSeconds <seconds>]" -ForegroundColor Cyan
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -GraceSeconds  Wait time in seconds for graceful shutdown (default: 7)" -ForegroundColor White
    Write-Host "Note: --Hostname, --Email, --Port, -Token are accepted but unused" -ForegroundColor Gray
    $global:LASTEXITCODE = 0
    return
}

# Normalize native exit code so external tools (curl.exe) can't poison the step
$global:LASTEXITCODE = 0

# Paths
$configDir       = "$env:USERPROFILE\.config\dosaygo\bbpro"
$testEnvPath     = "$configDir\test.env"
$legacyLogDir    = "$configDir\logs"
$mainPidFile     = "$legacyLogDir\browserbox-main.pid"
$devtoolsPidFile = "$legacyLogDir\browserbox-devtools.pid"
$pm2StateFile    = "$configDir\pm2\pm2-state.json"

Write-Host "BrowserBox Shutdown Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# --- Helper Functions ---
function Resolve-BrowserBoxBinary {
    $candidates = @()

    if ($env:BBX_BINARY_PATH) { $candidates += $env:BBX_BINARY_PATH }

    foreach ($name in @("browserbox.exe", "browserbox")) {
        try {
            $cmd = Get-Command $name -ErrorAction SilentlyContinue
            if ($cmd -and $cmd.Path) { $candidates += $cmd.Path }
        } catch { }
    }

    if ($env:ProgramFiles) { $candidates += (Join-Path $env:ProgramFiles "browserbox\\browserbox.exe") }
    if ($env:ProgramFilesx86) { $candidates += (Join-Path ${env:ProgramFiles(x86)} "browserbox\\browserbox.exe") }

    foreach ($p in ($candidates | Where-Object { $_ } | Select-Object -Unique)) {
        if (Test-Path $p) {
            try { return (Resolve-Path $p).Path } catch { return $p }
        }
    }
    return $null
}

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
        $processId = 0
        if ([int]::TryParse($raw, [ref]$processId)) { Write-Verbose "Read PID $processId from $PidFile"; return $processId } else { Write-Warning "Could not parse PID from $PidFile"; return $null }
    } catch { Write-Warning "Error reading PID file ${PidFile}: $_"; return $null }
}

function Read-Pm2State {
    param([string]$StatePath)
    if (-not (Test-Path $StatePath)) { return @{} }
    try {
        $raw = Get-Content $StatePath -Raw -ErrorAction Stop
        $json = $raw | ConvertFrom-Json -ErrorAction Stop
        if ($null -eq $json) { return @{} }
        return $json
    } catch {
        Write-Verbose "Failed to read pm2 state file ${StatePath}: $_"
        return @{}
    }
}

function Wait-ForProcessExit {
    param (
        [Parameter(Mandatory=$true)][int]$ProcessId,
        [Parameter(Mandatory=$true)][int]$TimeoutSeconds
    )
    $start = Get-Date
    Write-Host "Waiting up to $TimeoutSeconds seconds for PID $ProcessId to exit..." -ForegroundColor Gray
    while ((New-TimeSpan -Start $start -End (Get-Date)).TotalSeconds -lt $TimeoutSeconds) {
        if (-not (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)) {
            Write-Host "Process PID $ProcessId exited gracefully." -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds 1
    }
    if (-not (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)) {
        Write-Host "Process PID $ProcessId exited within the timeout." -ForegroundColor Green
        return $true
    } else {
        Write-Host "Process PID $ProcessId did NOT exit within the timeout." -ForegroundColor Yellow
        return $false
    }
}

function Invoke-StopApi {
    param (
        [Parameter(Mandatory=$true)][string]$AppPort,
        [Parameter(Mandatory=$true)][string]$LoginToken
    )
    $httpsUrl = "https://localhost:${AppPort}/api/v15/stop_app?session_token=${LoginToken}"
    $httpUrl  = "http://localhost:${AppPort}/api/v15/stop_app?session_token=${LoginToken}"

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

# 1. Attempt graceful shutdown via API (main service)
$mainPid = Read-Pid -PidFile $mainPidFile
$devPid  = Read-Pid -PidFile $devtoolsPidFile

$envVars = Read-EnvFile -FilePath $testEnvPath
if ($envVars -and $envVars['APP_PORT'] -and $envVars['LOGIN_TOKEN']) {
    $code = Invoke-StopApi -AppPort $envVars['APP_PORT'] -LoginToken $envVars['LOGIN_TOKEN']
    if ($code -eq 200 -and $mainPid -and (Get-Process -Id $mainPid -ErrorAction SilentlyContinue)) {
        [void](Wait-ForProcessExit -ProcessId $mainPid -TimeoutSeconds $GraceSeconds)
    } elseif ($code -ne 200) {
        Write-Host "API shutdown failed or was not reachable. Proceeding to pm2 stop." -ForegroundColor Yellow
    }
} else {
    Write-Host "Skipping API shutdown for main service: required info (port, token) is missing." -ForegroundColor Gray
}

# 2. Stop services via browserbox pm2 shim
$browserboxPath = Resolve-BrowserBoxBinary
if ($browserboxPath) {
    $env:BROWSERBOX_PM2_HOME = $configDir
    Write-Host "Stopping BrowserBox services via browserbox pm2..." -ForegroundColor Cyan
    try { & $browserboxPath pm2 stop bb-devtools } catch { }
    try { & $browserboxPath pm2 stop bb-main } catch { }
    $global:LASTEXITCODE = 0
} else {
    Write-Host "browserbox.exe not found for pm2 stop; falling back to legacy PID files." -ForegroundColor Yellow
}

# 3. Kill devtools immediately (legacy PID file fallback)
if ($devPid) {
    if (Get-Process -Id $devPid -ErrorAction SilentlyContinue) {
        Write-Host "Immediately stopping Devtools service (PID: $devPid)..." -ForegroundColor Yellow
        Stop-Process -Id $devPid -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "Devtools service (PID: $devPid from file) already stopped." -ForegroundColor Gray
    }
}

# 4. Final check and Force Kill (pm2 state + legacy PID file fallback)
Write-Host "--- Final Check ---" -ForegroundColor Cyan

$pm2State = Read-Pm2State -StatePath $pm2StateFile
$pm2MainPid = $null
$pm2DevtoolsPid = $null
$pm2MainGuardianPid = $null
$pm2DevtoolsGuardianPid = $null
if ($pm2State -and $pm2State.'bb-main') {
    $pm2MainPid = $pm2State.'bb-main'.pid
    $pm2MainGuardianPid = $pm2State.'bb-main'.guardianPid
}
if ($pm2State -and $pm2State.'bb-devtools') {
    $pm2DevtoolsPid = $pm2State.'bb-devtools'.pid
    $pm2DevtoolsGuardianPid = $pm2State.'bb-devtools'.guardianPid
}

foreach ($ProcessId in @($pm2MainGuardianPid, $pm2DevtoolsGuardianPid, $pm2MainPid, $pm2DevtoolsPid)) {
    if ($ProcessId -and (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)) {
        Write-Host "Forcing shutdown tree for PID $ProcessId (pm2 state)..." -ForegroundColor Yellow
        & taskkill.exe /F /T /PID $ProcessId | Out-Null
    }
}

# Check and force kill main process if it's still running
if ($mainPid -and (Get-Process -Id $mainPid -ErrorAction SilentlyContinue)) {
    Write-Host "Main service (PID: $mainPid) is still running. Forcing shutdown tree..." -ForegroundColor Yellow
    # Use taskkill to kill the process tree (/T) forcefully (/F)
    & taskkill.exe /F /T /PID $mainPid | Out-Null
}

# Check and force kill devtools process if it's still running (it should be gone, but we double-check)
if ($devPid -and (Get-Process -Id $devPid -ErrorAction SilentlyContinue)) {
    Write-Host "Devtools service (PID: $devPid) is still running. Forcing shutdown tree..." -ForegroundColor Yellow
    & taskkill.exe /F /T /PID $devPid | Out-Null
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

    # Kill global chrome/edge if not suppressed
    if ($env:BBX_DONT_KILL_CHROME_ON_STOP -ne "true") {
        Write-Host "Cleaning up any remaining Chrome/Edge processes..." -ForegroundColor Cyan
        Stop-Process -Name "chrome" -Force -ErrorAction SilentlyContinue
        Stop-Process -Name "msedge" -Force -ErrorAction SilentlyContinue
    }

    exit 0
}
