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

# Define paths
$configDir = "$env:USERPROFILE\.config\dosyago\bbpro"
$testEnvPath = "$configDir\test.env"
$logDir = "$configDir\logs"
$mainPidFile = "$logDir\browserbox-main.pid"
$devtoolsPidFile = "$logDir\browserbox-devtools.pid"
$chromeBaseDir = "$configDir"

# Function to read environment variables from test.env
function Read-EnvFile {
    param ([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "Error: test.env file not found at $FilePath" -ForegroundColor Red
        Write-Host "Please ensure BrowserBox is properly configured and started at least once." -ForegroundColor Yellow
        return $null
    }
    
    $envVars = @{}
    Get-Content $FilePath | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            $envVars[$key] = $value
        }
    }
    return $envVars
}

# Function to gracefully shutdown BrowserBox via API
function Stop-BrowserBoxViaAPI {
    param (
        [string]$AppPort,
        [string]$LoginToken,
        [int]$GraceSeconds
    )
    
    if (-not $AppPort -or -not $LoginToken) {
        Write-Host "Error: APP_PORT or LOGIN_TOKEN not found in test.env" -ForegroundColor Red
        return $false
    }
    
    # Read the main process PID from the PID file
    if (-not (Test-Path $mainPidFile)) {
        Write-Host "Warning: Main PID file not found at $mainPidFile" -ForegroundColor Yellow
        Write-Host "Process may not be running or was not started properly." -ForegroundColor Yellow
        return $false
    }
    
    $mainPid = Get-Content $mainPidFile -ErrorAction SilentlyContinue
    if (-not $mainPid) {
        Write-Host "Warning: Could not read PID from $mainPidFile" -ForegroundColor Yellow
        return $false
    }
    
    # Check if the process exists
    $process = Get-Process -Id $mainPid -ErrorAction SilentlyContinue
    if (-not $process) {
        Write-Host "Process with PID $mainPid is not running." -ForegroundColor Green
        Remove-Item $mainPidFile -Force -ErrorAction SilentlyContinue
        return $true
    }
    
    Write-Host "Initiating graceful shutdown via API..." -ForegroundColor Cyan
    Write-Host "Port: $AppPort, Token: [REDACTED]" -ForegroundColor Gray
    Write-Host "Main process PID: $mainPid" -ForegroundColor Gray
    
    # Try HTTPS first (for GO_SECURE=true case), then fallback to HTTP
    $statusCode = $null
    $urlHttps = "https://localhost:${AppPort}/api/v1/stop_app?session_token=${LoginToken}"
    $urlHttp = "http://localhost:${AppPort}/api/v1/stop_app?session_token=${LoginToken}"
    
    try {
        Write-Host "Attempting HTTPS connection..." -ForegroundColor Gray
        # Use curl.exe with -k to accept self-signed certificates
        $curlOutput = curl.exe -k -sS -o NUL -w "%{http_code}" -X POST $urlHttps 2>&1
        if ($curlOutput -match "^\d{3}$") {
            $statusCode = $curlOutput
        }
        
        # If HTTPS fails or returns 000, try HTTP
        if (-not $statusCode -or $statusCode -eq "000") {
            Write-Host "HTTPS failed or returned 000, trying HTTP..." -ForegroundColor Gray
            $curlOutput = curl.exe -sS -o NUL -w "%{http_code}" -X POST $urlHttp 2>&1
            if ($curlOutput -match "^\d{3}$") {
                $statusCode = $curlOutput
            }
        }
        
        if ($statusCode -eq "200") {
            Write-Host "Shutdown request sent successfully. Waiting up to $GraceSeconds seconds for graceful exit..." -ForegroundColor Green
            
            # Properly wait for process to exit
            $waitSucceeded = $false
            try {
                Wait-Process -Id $mainPid -Timeout $GraceSeconds -ErrorAction Stop
                $waitSucceeded = $true
            } catch {
                # Timeout or process already exited
            }
            
            # Verify process actually exited
            $processStillRunning = Get-Process -Id $mainPid -ErrorAction SilentlyContinue
            if (-not $processStillRunning) {
                Write-Host "Main service shut down gracefully." -ForegroundColor Green
                Remove-Item $mainPidFile -Force -ErrorAction SilentlyContinue
                return $true
            } else {
                Write-Host "Warning: Process did not exit within $GraceSeconds seconds. Forcing shutdown..." -ForegroundColor Yellow
                Stop-Process -Id $mainPid -Force -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 1
                
                # Final verification
                $processStillRunning = Get-Process -Id $mainPid -ErrorAction SilentlyContinue
                if ($processStillRunning) {
                    Write-Host "Error: Process still running after forced kill!" -ForegroundColor Red
                    return $false
                } else {
                    Write-Host "Process terminated after forced kill." -ForegroundColor Green
                    Remove-Item $mainPidFile -Force -ErrorAction SilentlyContinue
                    return $true
                }
            }
        } else {
            Write-Host "Warning: API returned non-200 status code: $statusCode" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host "Error making API request with curl: $_" -ForegroundColor Red
        Write-Host "Falling back to direct process termination..." -ForegroundColor Yellow
        return $false
    }
}

# Function to force stop processes if API method fails
function Force-StopProcesses {
    param (
        [int]$GraceSeconds
    )
    
    Write-Host "Performing fallback shutdown..." -ForegroundColor Yellow
    
    $allStopped = $true
    
    # Stop main service
    if (Test-Path $mainPidFile) {
        $mainPid = Get-Content $mainPidFile -ErrorAction SilentlyContinue
        if ($mainPid -and (Get-Process -Id $mainPid -ErrorAction SilentlyContinue)) {
            Write-Host "Terminating main service (PID: $mainPid)..." -ForegroundColor Cyan
            Stop-Process -Id $mainPid -Force -ErrorAction SilentlyContinue
            
            # Wait for process to exit
            $waitSucceeded = $false
            try {
                Wait-Process -Id $mainPid -Timeout $GraceSeconds -ErrorAction Stop
                $waitSucceeded = $true
            } catch {
                # Timeout or process already exited
            }
            
            # Verify process actually exited
            Start-Sleep -Milliseconds 500
            $processStillRunning = Get-Process -Id $mainPid -ErrorAction SilentlyContinue
            if ($processStillRunning) {
                Write-Host "Error: Main process (PID: $mainPid) still running after forced kill!" -ForegroundColor Red
                $allStopped = $false
            } else {
                Write-Host "Main service stopped." -ForegroundColor Green
            }
            Remove-Item $mainPidFile -Force -ErrorAction SilentlyContinue
        }
    }
    
    # Stop devtools service
    if (Test-Path $devtoolsPidFile) {
        $devtoolsPid = Get-Content $devtoolsPidFile -ErrorAction SilentlyContinue
        if ($devtoolsPid -and (Get-Process -Id $devtoolsPid -ErrorAction SilentlyContinue)) {
            Write-Host "Terminating devtools service (PID: $devtoolsPid)..." -ForegroundColor Cyan
            Stop-Process -Id $devtoolsPid -Force -ErrorAction SilentlyContinue
            
            # Wait for process to exit
            try {
                Wait-Process -Id $devtoolsPid -Timeout $GraceSeconds -ErrorAction Stop
            } catch {
                # Timeout or process already exited
            }
            
            # Verify process actually exited
            Start-Sleep -Milliseconds 500
            $processStillRunning = Get-Process -Id $devtoolsPid -ErrorAction SilentlyContinue
            if ($processStillRunning) {
                Write-Host "Error: Devtools process (PID: $devtoolsPid) still running after forced kill!" -ForegroundColor Red
                $allStopped = $false
            } else {
                Write-Host "Devtools service stopped." -ForegroundColor Green
            }
            Remove-Item $devtoolsPidFile -Force -ErrorAction SilentlyContinue
        }
    }
    
    # Stop Chrome processes
    $chromeDirs = Get-ChildItem -Path $chromeBaseDir -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "chrome-*" }
    foreach ($chromeDir in $chromeDirs) {
        $chromePidFile = "$chromeDir\pid"
        if (Test-Path $chromePidFile) {
            $chromePid = Get-Content $chromePidFile -ErrorAction SilentlyContinue
            if ($chromePid -and (Get-Process -Id $chromePid -ErrorAction SilentlyContinue)) {
                Write-Host "Terminating Chrome (PID: $chromePid)..." -ForegroundColor Cyan
                Stop-Process -Id $chromePid -Force -ErrorAction SilentlyContinue
                Remove-Item $chromePidFile -Force -ErrorAction SilentlyContinue
            }
        }
    }
    
    return $allStopped
}

# Main shutdown logic
Write-Host "BrowserBox Shutdown Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Read configuration from test.env
$envVars = Read-EnvFile -FilePath $testEnvPath

$shutdownSuccess = $false

if ($envVars) {
    $appPort = $envVars['APP_PORT']
    $loginToken = $envVars['LOGIN_TOKEN']
    
    # Try graceful shutdown via API first
    $success = Stop-BrowserBoxViaAPI -AppPort $appPort -LoginToken $loginToken -GraceSeconds $GraceSeconds
    
    if (-not $success) {
        Write-Host "API shutdown failed, using fallback method..." -ForegroundColor Yellow
        $shutdownSuccess = Force-StopProcesses -GraceSeconds $GraceSeconds
    } else {
        $shutdownSuccess = $true
    }
} else {
    Write-Host "Could not read test.env, using fallback method..." -ForegroundColor Yellow
    $shutdownSuccess = Force-StopProcesses -GraceSeconds $GraceSeconds
}

if ($shutdownSuccess) {
    Write-Host "BrowserBox services stopped successfully." -ForegroundColor Green
    $global:LASTEXITCODE = 0
} else {
    Write-Host "Error: Some processes could not be stopped." -ForegroundColor Red
    $global:LASTEXITCODE = 1
}
