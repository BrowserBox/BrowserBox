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
    [Parameter(Mandatory = $false, HelpMessage = "Wait time in seconds for graceful shutdown (default: 30).")]
    [int]$GraceSeconds = 30
)

if ($PSBoundParameters.ContainsKey('Help') -or $args -contains '-help') {
    Write-Host "bbx stop" -ForegroundColor Green
    Write-Host "Stop BrowserBox services" -ForegroundColor Yellow
    Write-Host "Usage: bbx stop [-GraceSeconds <seconds>]" -ForegroundColor Cyan
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -GraceSeconds  Wait time in seconds for graceful shutdown (default: 30)" -ForegroundColor White
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
        [string]$LoginToken
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
    
    # Construct the URL with session_token as query parameter
    $url = "http://localhost:${AppPort}/api/v1/stop_app?session_token=${LoginToken}"
    
    try {
        # Use curl.exe for a more robust request against the self-terminating server
        $curlOutput = curl.exe -s -w "%{http_code}" -X POST $url
        $statusCode = $curlOutput.Substring($curlOutput.Length - 3)
        
        if ($statusCode -eq "200") {
            Write-Host "Shutdown request sent successfully. Waiting up to 10 seconds for graceful exit..." -ForegroundColor Green
            
            $processExited = Wait-Process -Id $mainPid -Timeout 10 -ErrorAction SilentlyContinue
            if ($processExited) {
                Write-Host "Main service shut down gracefully." -ForegroundColor Green
            } else {
                Write-Host "Warning: Process did not exit within the timeout. Forcing shutdown..." -ForegroundColor Yellow
                Stop-Process -Id $mainPid -Force -ErrorAction SilentlyContinue
            }
            Remove-Item $mainPidFile -Force -ErrorAction SilentlyContinue
            return $true
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
    Write-Host "Performing fallback shutdown..." -ForegroundColor Yellow
    
    # Stop main service
    if (Test-Path $mainPidFile) {
        $mainPid = Get-Content $mainPidFile -ErrorAction SilentlyContinue
        if ($mainPid -and (Get-Process -Id $mainPid -ErrorAction SilentlyContinue)) {
            Write-Host "Forcing shutdown of main service (PID: $mainPid)..." -ForegroundColor Cyan
            Stop-Process -Id $mainPid -Force -ErrorAction SilentlyContinue
            Remove-Item $mainPidFile -Force -ErrorAction SilentlyContinue
        }
    }
    
    # Stop devtools service
    if (Test-Path $devtoolsPidFile) {
        $devtoolsPid = Get-Content $devtoolsPidFile -ErrorAction SilentlyContinue
        if ($devtoolsPid -and (Get-Process -Id $devtoolsPid -ErrorAction SilentlyContinue)) {
            Write-Host "Forcing shutdown of devtools service (PID: $devtoolsPid)..." -ForegroundColor Cyan
            Stop-Process -Id $devtoolsPid -Force -ErrorAction SilentlyContinue
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
                Write-Host "Forcing shutdown of Chrome (PID: $chromePid)..." -ForegroundColor Cyan
                Stop-Process -Id $chromePid -Force -ErrorAction SilentlyContinue
                Remove-Item $chromePidFile -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

# Main shutdown logic
Write-Host "BrowserBox Shutdown Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Read configuration from test.env
$envVars = Read-EnvFile -FilePath $testEnvPath

if ($envVars) {
    $appPort = $envVars['APP_PORT']
    $loginToken = $envVars['LOGIN_TOKEN']
    
    # Try graceful shutdown via API first
    $success = Stop-BrowserBoxViaAPI -AppPort $appPort -LoginToken $loginToken
    
    if (-not $success) {
        Write-Host "API shutdown failed, using fallback method..." -ForegroundColor Yellow
        Force-StopProcesses
    }
} else {
    Write-Host "Could not read test.env, using fallback method..." -ForegroundColor Yellow
    Force-StopProcesses
}

Write-Host "BrowserBox services stopped successfully." -ForegroundColor Green
