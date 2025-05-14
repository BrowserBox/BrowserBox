[CmdletBinding()]
param (
    [Parameter(Mandatory = $false, HelpMessage = "Specify the hostname for BrowserBox (defaults to system hostname).")]
    [string]$Hostname,
    [Parameter(Mandatory = $false, HelpMessage = "Provide an email address for certificate registration (optional).")]
    [string]$Email,
    [Parameter(Mandatory = $false, HelpMessage = "Specify the main port for BrowserBox (default: 8080).")]
    [ValidateRange(4024, 65533)]
    [int]$Port = 8080,
    [Parameter(Mandatory = $false, HelpMessage = "Provide a specific login token (optional).")]
    [string]$Token,
    [Parameter(Mandatory = $false, HelpMessage = "Force regeneration of certificates even if they exist.")]
    [switch]$Force
)

if ($PSBoundParameters.ContainsKey('Help') -or $args -contains '-help') {
    Write-Host "bbx setup" -ForegroundColor Green
    Write-Host "Set up BrowserBox" -ForegroundColor Yellow
    Write-Host "Usage: bbx setup [-Hostname <hostname>] [-Email <email>] [-Port <port>] [-Token <token>] [-Force]" -ForegroundColor Cyan
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -Hostname  Specify the hostname (defaults to system hostname)" -ForegroundColor White
    Write-Host "  -Email     Email for certificate registration (optional)" -ForegroundColor White
    Write-Host "  -Port      Main port (default: 8080, range 4024-65533)" -ForegroundColor White
    Write-Host "  -Token     Specific login token (optional, auto-generated if not provided)" -ForegroundColor White
    Write-Host "  -Force     Force regeneration of certificates" -ForegroundColor White
    return
}

# Helper Functions
function Is-LocalHostname {
    param ([string]$Hostname)
    if (-not $Hostname) { return $true }
    if ($Hostname -eq "localhost" -or $Hostname -like "*.local") { return $true }
    try {
        $ipAddresses = [System.Net.Dns]::GetHostAddresses($Hostname)
        foreach ($ip in $ipAddresses) {
            $ipStr = $ip.ToString()
            if ($ipStr -like "127.*" -or $ipStr -like "192.168.*" -or $ipStr -like "10.*" -or 
                $ipStr -like "172.16.*" -or $ipStr -like "172.31.*" -or $ipStr -eq "::1") {
                return $true
            }
        }
    } catch {
        Write-Warning "Failed to resolve hostname: $Hostname. Assuming non-local."
    }
    return $false
}

# Check if OpenSSL is installed, and install it via winget if not
function Ensure-OpenSSL {
    if (-not (Get-Command openssl -ErrorAction SilentlyContinue)) {
        Write-Host "OpenSSL not found. Installing via winget..." -ForegroundColor Cyan
        try {
            winget install --id FireDaemon.OpenSSL --silent --accept-package-agreements --accept-source-agreements
            if ($LASTEXITCODE -eq 0) {
                Write-Host "OpenSSL installed successfully." -ForegroundColor Green
                # Refresh the environment to make openssl available in this session
                $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
            } else {
                Write-Error "Failed to install OpenSSL with winget. Exit code: $LASTEXITCODE"
            }
        } catch {
            Write-Error "Error installing OpenSSL: $_"
        }
    } else {
        Write-Host "OpenSSL is already installed." -ForegroundColor Cyan
    }
}

function Wait-ForDnsResolution {
    param ([string]$Hostname)
    $maxAttempts = 30
    $attempt = 0
    Write-Host "Checking DNS resolution for $Hostname..." -ForegroundColor Cyan
    while ($attempt -lt $maxAttempts) {
        try {
            $ipAddresses = [System.Net.Dns]::GetHostAddresses($Hostname)
            if ($ipAddresses.Length -gt 0) {
                Write-Host "Hostname $Hostname resolved to $($ipAddresses[0])." -ForegroundColor Green
                return $true
            }
        } catch {
            Write-Host "DNS resolution failed for $Hostname (attempt $attempt/$maxAttempts). Ensure DNS records point to this machine's IP." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
            $attempt++
        }
    }
    Write-Error "Hostname $Hostname did not resolve after $maxAttempts attempts. Please set up DNS records and try again."
    throw "DNS Error"
}

function Open-FirewallPort {
    param ([int]$Port)
    $ruleName = "BrowserBox-Port-$Port"
    if (-not (Get-NetFirewallRule -Name $ruleName -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule -Name $ruleName -DisplayName "BrowserBox Port $Port" -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow
        Write-Host "Opened firewall port $Port." -ForegroundColor Cyan
    }
}

function Test-PortFree {
    param ([int]$Port)
    if ($Port -lt 4024 -or $Port -gt 65533) {
        Write-Error "Invalid port $Port. Must be between 4024 and 65533."
        throw "PORT Error"
    }
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        $listener.Stop()
        return $true
    } catch {
        Write-Error "Failed to test port ${Port}: $_"
        return $false
    }
}

function Generate-Certificates {
    param (
        [string]$Hostname,
        [string]$Email,
        [switch]$Force = $false  # New parameter to force regeneration
    )
    $sslcerts = "$env:USERPROFILE\sslcerts"
    $certFile = "$sslcerts\fullchain.pem"
    $keyFile = "$sslcerts\privkey.pem"

    # Check if certificates exist and match the hostname
    if (-not $Force -and (Test-Path $certFile) -and (Test-Path $keyFile)) {
        $certText = & openssl x509 -in $certFile -noout -text
        $sans = ($certText | Select-String "Subject Alternative Name" -Context 0,1).Context.PostContext[0].Trim().Split(',') | ForEach-Object { $_.Trim().Replace("DNS:", "") }
        if ($sans -contains $Hostname) {
            Write-Host "Certificates for $Hostname already exist at $sslcerts. Skipping generation." -ForegroundColor Yellow
            return
        }
    }

    # Ensure the directory exists
    New-Item -ItemType Directory -Path $sslcerts -Force | Out-Null

    if (Is-LocalHostname $Hostname) {
        Write-Host "Local hostname detected ($Hostname). Using mkcert..." -ForegroundColor Cyan

        # Remove existing certificates if forcing regeneration
        if ($Force -and (Test-Path $certFile)) { Remove-Item $certFile -Force }
        if ($Force -and (Test-Path $keyFile)) { Remove-Item $keyFile -Force }

        # Run mkcert -install with timeout
        $process = Start-Process -FilePath "mkcert" -ArgumentList "-install" -NoNewWindow -PassThru
        $timeoutSeconds = 8
        $process | Wait-Process -Timeout $timeoutSeconds -ErrorAction SilentlyContinue
        if ($process.HasExited) {
            if ($process.ExitCode -ne 0) {
                Write-Error "mkcert -install failed with exit code $($process.ExitCode)."
            }
            Write-Host "mkcert -install completed successfully." -ForegroundColor Cyan
        } else {
            Write-Warning "mkcert -install timed out after $timeoutSeconds seconds. Terminating..."
            $process | Stop-Process -Force
            Start-Sleep -Seconds 1
            Write-Host "mkcert -install was terminated due to timeout."
        }

        & mkcert -cert-file $certFile -key-file $keyFile $Hostname localhost 127.0.0.1
        if ($LASTEXITCODE -ne 0) {
            Write-Error "mkcert failed to generate certificates for $Hostname."
            throw "CERTIFICATE Error"
        }
    } else {
        if (-not $Email) {
            Write-Host "Non-local hostname ($Hostname) requires an email for Let's Encrypt. Please provide one:" -ForegroundColor Yellow
            $Email = Read-Host "Enter email address"
            if (-not $Email) {
                Write-Error "Email is required for non-local hostnames with certbot."
                throw "EMAIL Error"
            }
        }
        Write-Host "Non-local hostname detected ($Hostname). Waiting for DNS resolution..." -ForegroundColor Cyan
        Wait-ForDnsResolution -Hostname $Hostname
        Write-Host "Using certbot for $Hostname..." -ForegroundColor Cyan
        & certbot certonly --standalone -d $Hostname --agree-tos -m $Email --no-eff-email --non-interactive --cert-name browserbox
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Certbot failed to generate certificates for $Hostname. Ensure DNS is set up and port 80 is free."
            throw "CERTBOT Error"
        }
        $certbotCert = "C:\Certbot\live\browserbox\fullchain.pem"
        $certbotKey = "C:\Certbot\live\browserbox\privkey.pem"
        Copy-Item -Path $certbotCert -Destination $certFile -Force
        Copy-Item -Path $certbotKey -Destination $keyFile -Force
    }

    # Set permissions after generation
    icacls "$certFile" /inheritance:r /grant:r "${env:USERNAME}:RX"
    icacls "$keyFile" /inheritance:r /grant:r "${env:USERNAME}:RX"
    Write-Host "Generated certificates." -ForegroundColor Cyan
}

# Main Logic
Write-Host "Starting BrowserBox setup on Windows..." -ForegroundColor Cyan

if (-not $Hostname) {
    $Hostname = $env:COMPUTERNAME
    Write-Host "No hostname provided. Using system hostname: $Hostname" -ForegroundColor Yellow
}

# Ensure Port is a valid integer
try {
    [int]$PortInt = [int]::Parse($Port)
    Write-Host "Port: $Port, PortInt: $PortInt" -ForegroundColor Cyan  # Debug output
} catch {
    Write-Error "Failed to convert Port to integer: $_"
    throw "PORT Error"
}

# Check port range and calculate derived ports safely
$minPort = 4024
$maxPort = 65533
$portsToCheck = @()
if (($PortInt - 2) -ge $minPort -and ($PortInt + 1) -le $maxPort) {
    $portsToCheck = @($PortInt, ($PortInt - 2), ($PortInt + 1), ($PortInt - 1))
    Write-Host "Ports to check: $portsToCheck" -ForegroundColor Cyan  # Debug output
} else {
    Write-Error "Port calculations would result in invalid ports outside range $minPort-$maxPort. Adjust the main port ($PortInt)."
    throw "PORT Error"
}

foreach ($p in $portsToCheck) {
    if (-not (Test-PortFree $p)) {
        Write-Error "Port $p is already in use or invalid."
        throw "PORT Error"
    }
    Open-FirewallPort $p
}

if (-not $Token) {
    $Token = [System.Guid]::NewGuid().ToString()
    Write-Host "Generated token: $Token" -ForegroundColor Cyan
}

Ensure-OpenSSL

$CONFIG_DIR = "$env:USERPROFILE\.config\dosyago\bbpro"
New-Item -ItemType Directory -Path $CONFIG_DIR -Force | Out-Null
$TICKET_DIR = "$env:USERPROFILE\.config\dosyago\bbpro\tickets"
New-Item -ItemType Directory -Path $TICKET_DIR -Force | Out-Null
Get-Date | Out-File "$CONFIG_DIR\.bbpro_config_dir" -Encoding utf8
Write-Host "Created config directory at $CONFIG_DIR." -ForegroundColor Cyan

$testEnvPath = "$CONFIG_DIR\test.env"
if (Test-Path $testEnvPath) {
    $existingConfig = Get-Content $testEnvPath | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") { [PSCustomObject]@{ Name = $Matches[1]; Value = $Matches[2] } }
    }
    $existingHostname = ($existingConfig | Where-Object { $_.Name -eq "DOMAIN" }).Value
    if ($existingHostname -eq $Hostname -and -not $Force) {
        Write-Host "Setup already completed for $Hostname. Using existing configuration." -ForegroundColor Yellow
    } else {
        Generate-Certificates -Hostname $Hostname -Email $Email -Force:$Force
    }
} else {
    Generate-Certificates -Hostname $Hostname -Email $Email -Force:$Force
}

Write-Host "Starting BrowserBox setup on Windows..." -ForegroundColor Cyan
# Define port variables
$APP_PORT = $PortInt
$AUDIO_PORT = $PortInt - 2
$DEVTOOLS_PORT = $PortInt + 1
$DOCS_PORT = $PortInt - 1
$COOKIE_VALUE = if ($env:COOKIE_VALUE) { $env:COOKIE_VALUE } else { [System.Guid]::NewGuid().ToString() }

# Create or update test.env file
$envContent = @"
APP_PORT=$APP_PORT
AUDIO_PORT=$AUDIO_PORT
LOGIN_TOKEN=$Token
COOKIE_VALUE=$COOKIE_VALUE
DEVTOOLS_PORT=$DEVTOOLS_PORT
DOCS_PORT=$DOCS_PORT
SSLCERTS_DIR="${env:USERPROFILE}\sslcerts"
DOMAIN="$Hostname"
"@
$envContent | Out-File "${CONFIG_DIR}\test.env" -Encoding utf8
Write-Host "Updated test.env with configuration." -ForegroundColor Cyan

# Generate and display login link
$loginLink = "https://${Hostname}:${PORT}/login?token=$Token"
Write-Host "Login link for this instance:" -ForegroundColor Green
Write-Host $loginLink
$loginLink | Out-File "${CONFIG_DIR}\login.link" -Encoding utf8

Write-Host "Setup complete!" -ForegroundColor Green
