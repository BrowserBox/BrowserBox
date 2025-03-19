# start.ps1
# Located at C:\Program Files\browserbox\windows-scripts\start.ps1
[CmdletBinding()]
param ()

# Define paths
$installDir = "C:\Program Files\browserbox"
$configDir = "$env:USERPROFILE\.config\dosyago\bbpro"
$envFile = "$configDir\test.env"
$logDir = "$configDir\logs"

# Check if configuration file exists
if (-not (Test-Path $envFile)) {
    Write-Error "Configuration file not found at $envFile. Please run 'bbx setup' first."
    exit 1
}

# Create logs directory
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

# Define log and PID files
$mainOutLog = "$logDir\browserbox-main-out.log"
$mainErrLog = "$logDir\browserbox-main-err.log"
$mainPidFile = "$logDir\browserbox-main.pid"
$devtoolsOutLog = "$logDir\browserbox-devtools-out.log"
$devtoolsErrLog = "$logDir\browserbox-devtools-err.log"
$devtoolsPidFile = "$logDir\browserbox-devtools.pid"

# Load environment variables from test.env
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^([^=]+)=(.*)$") {
        $value = $matches[2].Trim('"')  # Remove surrounding quotes if present
        Set-Item -Path "env:$($matches[1])" -Value $value
    }
}

# Validate required variables
$requiredVars = @("APP_PORT", "COOKIE_VALUE", "LOGIN_TOKEN", "DEVTOOLS_PORT")
foreach ($var in $requiredVars) {
    if (-not (Get-Item "env:$var" -ErrorAction SilentlyContinue)) {
        Write-Error "Required environment variable $var not found in $envFile."
        exit 1
    }
}

# Start main service (server.js)
$mainScript = Join-Path $installDir "src\server.js"
$chromePort = [int]$env:APP_PORT - 3000
$mainArgs = @(
    "`"$mainScript`""  # Quote the path
    $chromePort
    $env:APP_PORT
    $env:COOKIE_VALUE
    $env:USER
    $env:LOGIN_TOKEN
)
if ($env:NODE_ARGS) {
    $nodeArgs = $env:NODE_ARGS -split ' '
    $mainArgs = $nodeArgs + $mainArgs
}
Write-Host "Starting main service. stdout: $mainOutLog, stderr: $mainErrLog, PID file: $mainPidFile" -ForegroundColor Cyan
$mainProcess = Start-Process -FilePath "node" -ArgumentList $mainArgs -NoNewWindow -RedirectStandardOutput $mainOutLog -RedirectStandardError $mainErrLog -PassThru
$mainProcess.Id | Out-File $mainPidFile -Force

# Start devtools service (index.js)
$devtoolsScript = Join-Path $installDir "src\services\pool\crdp-secure-proxy-server\index.js"
$devtoolsArgs = @(
    "`"$devtoolsScript`""  # Quote the path
    $env:DEVTOOLS_PORT
    $env:COOKIE_VALUE
    $env:LOGIN_TOKEN
)
Write-Host "Starting devtools service. stdout: $devtoolsOutLog, stderr: $devtoolsErrLog, PID file: $devtoolsPidFile" -ForegroundColor Cyan
$devtoolsProcess = Start-Process -FilePath "node" -ArgumentList $devtoolsArgs -NoNewWindow -RedirectStandardOutput $devtoolsOutLog -RedirectStandardError $devtoolsErrLog -PassThru
$devtoolsProcess.Id | Out-File $devtoolsPidFile -Force

Write-Host "BrowserBox services started successfully." -ForegroundColor Green
