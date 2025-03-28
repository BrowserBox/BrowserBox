# start.ps1
[CmdletBinding(SupportsShouldProcess=$true)]
param (
    [string]$Hostname,
    [string]$Email,
    [int]$Port,
    [string]$Token
)

# Define paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$certifyScriptPath = Join-Path $scriptDir "certify.ps1"
$installDir = "C:\Program Files\browserbox"
$configDir = "$env:USERPROFILE\.config\dosyago\bbpro"
$envFile = "$configDir\test.env"
$logDir = "$configDir\logs"
Write-Verbose "installDir: $installDir"
Write-Verbose "configDir: $configDir"
Write-Verbose "envFile: $envFile"
Write-Verbose "logDir: $logDir"

# Check if configuration file exists
if (-not (Test-Path $envFile)) {
    Write-Error "Configuration file not found at $envFile. Please run 'bbx setup' first."
    throw "SETUP Error"
}
Write-Verbose "envFile exists"

# Create logs directory
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
Write-Verbose "Created logs dir: $logDir"

# Define log and PID files
$mainOutLog = "$logDir\browserbox-main-out.log"
$mainErrLog = "$logDir\browserbox-main-err.log"
$mainPidFile = "$logDir\browserbox-main.pid"
$devtoolsOutLog = "$logDir\browserbox-devtools-out.log"
$devtoolsErrLog = "$logDir\browserbox-devtools-err.log"
$devtoolsPidFile = "$logDir\browserbox-devtools.pid"
Write-Verbose "mainOutLog: $mainOutLog"
Write-Verbose "mainErrLog: $mainErrLog"
Write-Verbose "mainPidFile: $mainPidFile"
Write-Verbose "devtoolsOutLog: $devtoolsOutLog"
Write-Verbose "devtoolsErrLog: $devtoolsErrLog"
Write-Verbose "devtoolsPidFile: $devtoolsPidFile"

# Run certify to check license
& $certifyScriptPath

# Load environment variables from test.env
Write-Verbose "Loading env vars from $envFile"
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^([^=]+)=(.*)$") {
        $value = $matches[2].Trim('"')
        Write-Verbose "Setting env:$($matches[1]) = $value"
        Set-Item -Path "env:$($matches[1])" -Value $value
    }
}

# Debug environment variables
Write-Host "Debug env vars:" -ForegroundColor Cyan
$requiredVars = @("APP_PORT", "COOKIE_VALUE", "LOGIN_TOKEN", "DEVTOOLS_PORT", "USER", "NODE_ARGS")
foreach ($var in $requiredVars) {
    $value = Get-Item "env:$var" -ErrorAction SilentlyContinue
    Write-Host "$var = $($value.Value)" -ForegroundColor Cyan
}

# Validate required variables (exclude USER, NODE_ARGS)
$requiredVars = @("APP_PORT", "COOKIE_VALUE", "LOGIN_TOKEN", "DEVTOOLS_PORT")
foreach ($var in $requiredVars) {
    if (-not (Get-Item "env:$var" -ErrorAction SilentlyContinue)) {
        Write-Error "Required environment variable $var not found in $envFile."
        throw "SETUP Error"
    }
    Write-Verbose "$var validated"
}

# Start main service (server.js)
$mainScript = Join-Path $installDir "src\server.js"
$chromePort = [int]$env:APP_PORT - 3000
Write-Verbose "mainScript: $mainScript"
Write-Verbose "chromePort: $chromePort"
$mainArgs = @(
    "`"$mainScript`""  # Quote the path
    $chromePort
    $env:APP_PORT
    $env:COOKIE_VALUE
    ($env:USER, "defaultUser" | Where-Object { $_ })[0]
    $env:LOGIN_TOKEN
) | Where-Object { $_ -ne $null -and $_ -ne "" }
Write-Verbose "Initial mainArgs: $($mainArgs -join ', ')"
Write-Host "Final mainArgs: $($mainArgs -join ', ')" -ForegroundColor Cyan
Write-Host "Starting main service. stdout: $mainOutLog, stderr: $mainErrLog, PID file: $mainPidFile" -ForegroundColor Cyan
$mainProcess = Start-Process -FilePath "node" -ArgumentList $mainArgs -NoNewWindow -RedirectStandardOutput $mainOutLog -RedirectStandardError $mainErrLog -PassThru
Write-Verbose "Main process ID: $($mainProcess.Id)"
$mainProcess.Id | Out-File $mainPidFile -Force

# Start devtools service (index.js)
$devtoolsScript = Join-Path $installDir "src\services\pool\crdp-secure-proxy-server\index.js"
Write-Verbose "devtoolsScript: $devtoolsScript"
$devtoolsArgs = @(
    "`"$devtoolsScript`""  # Quote the path
    $env:DEVTOOLS_PORT
    $env:COOKIE_VALUE
    $env:LOGIN_TOKEN
) | Where-Object { $_ -ne $null -and $_ -ne "" }
Write-Host "Devtools args: $($devtoolsArgs -join ', ')" -ForegroundColor Cyan
Write-Host "Starting devtools service. stdout: $devtoolsOutLog, stderr: $devtoolsErrLog, PID file: $devtoolsPidFile" -ForegroundColor Cyan
$devtoolsProcess = Start-Process -FilePath "node" -ArgumentList $devtoolsArgs -NoNewWindow -RedirectStandardOutput $devtoolsOutLog -RedirectStandardError $devtoolsErrLog -PassThru
Write-Verbose "Devtools process ID: $($devtoolsProcess.Id)"
$devtoolsProcess.Id | Out-File $devtoolsPidFile -Force

Write-Host "BrowserBox services started successfully." -ForegroundColor Green
