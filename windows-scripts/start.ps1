# start.ps1
[CmdletBinding()]
param ()

# Define paths
$installDir = "C:\Program Files\browserbox"
$configDir = "$env:USERPROFILE\.config\dosyago\bbpro"
$envFile = "$configDir\test.env"

# Check if configuration file exists
if (-not (Test-Path $envFile)) {
    Write-Error "Configuration file not found at $envFile. Please run 'bbx setup' first."
    exit 1
}

# Load environment variables from test.env
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^([^=]+)=(.*)$") {
        Set-Item -Path "env:$($matches[1])" -Value $matches[2]
    }
}

# Start main service (server.js)
$mainScript = Join-Path $installDir "src\server.js"
$chromePort = [int]$env:APP_PORT - 3000
$nodeArgs = $env:NODE_ARGS -split ' '  # Split NODE_ARGS into an array if defined
Start-Process -FilePath "node" -ArgumentList ($nodeArgs + @($mainScript, $chromePort, $env:APP_PORT, $env:COOKIE_VALUE, $env:USER, $env:LOGIN_TOKEN)) -NoNewWindow

# Start devtools service (index.js)
$devtoolsScript = Join-Path $installDir "src\services\pool\crdp-secure-proxy-server\index.js"
Start-Process -FilePath "node" -ArgumentList ($devtoolsScript, $env:DEVTOOLS_PORT, $env:COOKIE_VALUE, $env:LOGIN_TOKEN) -NoNewWindow

Write-Host "BrowserBox services started successfully." -ForegroundColor Green
