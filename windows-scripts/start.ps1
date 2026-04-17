# start.ps1

[CmdletBinding(SupportsShouldProcess=$true)]
param (
    [Parameter(Mandatory = $false, HelpMessage = "Show help.")]
    [switch]$Help,
    [Parameter(Mandatory = $false, HelpMessage = "Specify the hostname for BrowserBox.")]
    [Alias("Host")]
    [string]$Hostname,
    [Parameter(Mandatory = $false, HelpMessage = "Provide an email address (unused).")]
    [string]$Email,
    [Parameter(Mandatory = $false, HelpMessage = "Specify the main port for BrowserBox.")]
    [int]$Port,
    [Parameter(Mandatory = $false, HelpMessage = "Provide a specific login token.")]
    [string]$Token
)

if ($Help -or $args -contains '-help') {
    Write-Host "bbx run" -ForegroundColor Green
    Write-Host "Run BrowserBox services (pm2-managed)" -ForegroundColor Yellow
    Write-Host "Usage: bbx run [-Hostname <hostname>] [-Port <port>] [-Token <token>] [-Email <email>]" -ForegroundColor Cyan
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host " -Hostname Specify the hostname (loaded from test.env if not provided)" -ForegroundColor White
    Write-Host " -Port Main port (loaded from test.env if not provided)" -ForegroundColor White
    Write-Host " -Token Specific login token (loaded from test.env if not provided)" -ForegroundColor White
    Write-Host " -Email Email address (unused)" -ForegroundColor White
    Write-Host "Logs are written to %USERPROFILE%\\.config\\dosaygo\\bbpro\\service_logs" -ForegroundColor Gray
    $global:LASTEXITCODE = 0
    return
}

# Define paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$certifyScriptPath = Join-Path $scriptDir "certify.ps1"
$installDir = "C:\Program Files\browserbox"
$configDir = "$env:USERPROFILE\.config\dosaygo\bbpro"
$envFile = "$configDir\test.env"
$pm2LogDir = "$configDir\service_logs"

Write-Verbose "installDir: $installDir"
Write-Verbose "configDir: $configDir"
Write-Verbose "envFile: $envFile"
Write-Verbose "pm2LogDir: $pm2LogDir"

# Check if configuration file exists
if (-not (Test-Path $envFile)) {
    Write-Error "Configuration file not found at $envFile. Please run 'bbx setup' first."
    throw "SETUP Error"
}

Write-Verbose "envFile exists"

# Configuration

$ConfigDir = "$env:USERPROFILE\.config\dosaygo\bbpro"
$TestEnvFile = "$ConfigDir\test.env"

function Get-TestEnvConfig {
    $cfg = @{}
    if (Test-Path $TestEnvFile) {
        Get-Content $TestEnvFile | ForEach-Object {
            if ($_ -match "^([^=]+)=(.*)$") {
                $cfg[$Matches[1]] = $Matches[2]
            }
        }
    }
    return $cfg
}

$Config = Get-TestEnvConfig

function Resolve-BrowserBoxBinary {
    $candidates = @()

    if ($env:BBX_BINARY_PATH) { $candidates += $env:BBX_BINARY_PATH }

    foreach ($name in @("browserbox.exe", "browserbox")) {
        try {
            $cmd = Get-Command $name -ErrorAction SilentlyContinue
            if ($cmd -and $cmd.Path) { $candidates += $cmd.Path }
        } catch { }
    }

    $preferredDirs = @(
        [System.IO.Path]::Combine($env:USERPROFILE, "bin"),
        [System.IO.Path]::Combine($env:USERPROFILE, "Scripts"),
        [System.IO.Path]::Combine($env:LOCALAPPDATA, "Microsoft\WindowsApps")
    )
    foreach ($dir in $preferredDirs) {
        if ($dir) { $candidates += (Join-Path $dir "browserbox.exe") }
    }

    $candidates += (Join-Path $installDir "browserbox.exe")
    if ($env:ProgramFiles) { $candidates += (Join-Path $env:ProgramFiles "browserbox\\browserbox.exe") }
    if ($env:ProgramFilesx86) { $candidates += (Join-Path ${env:ProgramFiles(x86)} "browserbox\\browserbox.exe") }

    foreach ($p in ($candidates | Where-Object { $_ } | Select-Object -Unique)) {
        if (Test-Path $p) {
            try { return (Resolve-Path $p).Path } catch { return $p }
        }
    }
    return $null
}

# If missing, run certify to obtain/persist the key, then re-read config and re-check.
if (-not $env:LICENSE_KEY -and -not $Config["LICENSE_KEY"]) {
    Write-Host "LICENSE_KEY not found in environment or config; invoking bbx certify..." -ForegroundColor Yellow
    & $certifyScriptPath
    $Config = Get-TestEnvConfig
}

if (-not $env:LICENSE_KEY -and -not $Config["LICENSE_KEY"]) {
    Write-Error "No LICENSE_KEY available after certification. Please acquire a license at http://getbrowserbox.com or contact sales@dosaygo.com."
    throw "LICENSE Error"
}

$LICENSE_KEY = if ($env:LICENSE_KEY) { $env:LICENSE_KEY } else { $Config["LICENSE_KEY"] }


# Create pm2 service logs directory
New-Item -ItemType Directory -Path $pm2LogDir -Force | Out-Null
Write-Verbose "Created pm2 logs dir: $pm2LogDir"

function Protect-PathAcl {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $false)][switch]$IsDirectory
    )

    try {
        $icacls = Get-Command icacls.exe -ErrorAction SilentlyContinue
        if (-not $icacls) { return }

        $userSid = [System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value
        $systemSid = "S-1-5-18"
        $adminsSid = "S-1-5-32-544"

        if ($IsDirectory) {
            & icacls.exe "$Path" /inheritance:r /grant:r "*${userSid}:(OI)(CI)F" /grant:r "*${systemSid}:(OI)(CI)F" /grant:r "*${adminsSid}:(OI)(CI)F" | Out-Null
        } else {
            & icacls.exe "$Path" /inheritance:r /grant:r "*${userSid}:F" /grant:r "*${systemSid}:F" /grant:r "*${adminsSid}:F" | Out-Null
        }
    } catch {
        Write-Verbose "ACL hardening skipped for ${Path}: $_"
    }
}

# Best-effort: restrict config/log dirs to current user + SYSTEM + Administrators.
Protect-PathAcl -Path $configDir -IsDirectory
Protect-PathAcl -Path $pm2LogDir -IsDirectory

# Define pm2 log files (browserbox pm2 shim)
$mainOutLog = "$pm2LogDir\bb-main-out.log"
$mainErrLog = "$pm2LogDir\bb-main-err.log"
$devtoolsOutLog = "$pm2LogDir\bb-devtools-out.log"
$devtoolsErrLog = "$pm2LogDir\bb-devtools-err.log"

Write-Verbose "mainOutLog: $mainOutLog"
Write-Verbose "mainErrLog: $mainErrLog"
Write-Verbose "devtoolsOutLog: $devtoolsOutLog"
Write-Verbose "devtoolsErrLog: $devtoolsErrLog"

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

# Ensure pm2 shim uses the same config root as Windows scripts
$env:BROWSERBOX_PM2_HOME = $configDir

# Start main service via browserbox pm2
$chromePort = [int]$env:APP_PORT - 3000

Write-Verbose "chromePort: $chromePort"

$browserboxPath = Resolve-BrowserBoxBinary
if (-not $browserboxPath) {
    Write-Error "browserbox.exe not found (checked PATH, user bin/Scripts, LocalAppData WindowsApps, and Program Files). Run 'bbx install' to place it on PATH."
    throw "BINARY Missing"
}

Write-Verbose "browserboxPath: $browserboxPath"

$mainArgs = @(
    "main"
    $chromePort
    $env:APP_PORT
    $env:COOKIE_VALUE
    ($env:USER, "defaultUser" | Where-Object { $_ })[0]
    $env:LOGIN_TOKEN
) | Where-Object { $_ -ne $null -and $_ -ne "" }

Write-Verbose "Initial mainArgs: $($mainArgs -join ', ')"
Write-Host "Final mainArgs: $($mainArgs -join ', ')" -ForegroundColor Cyan

Write-Host "Starting main service via browserbox pm2. Logs: $mainOutLog / $mainErrLog" -ForegroundColor Cyan
& $browserboxPath pm2 start $browserboxPath --name "bb-main" --kill-timeout 5000 --restart-delay 5000 -- $mainArgs

# Start devtools service via browserbox pm2
$devtoolsArgs = @(
    "devtools"
    $env:DEVTOOLS_PORT
    $env:COOKIE_VALUE
    $env:LOGIN_TOKEN
) | Where-Object { $_ -ne $null -and $_ -ne "" }

Write-Host "Devtools args: $($devtoolsArgs -join ', ')" -ForegroundColor Cyan
Write-Host "Starting devtools service via browserbox pm2. Logs: $devtoolsOutLog / $devtoolsErrLog" -ForegroundColor Cyan
& $browserboxPath pm2 start $browserboxPath --name "bb-devtools" -- $devtoolsArgs

Write-Host "All BrowserBox services have been started via browserbox pm2." -ForegroundColor Green
& $browserboxPath pm2 list
