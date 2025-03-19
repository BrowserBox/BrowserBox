# setup.ps1
# Located at C:\Program Files\browserbox\windows-scripts\setup.ps1
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
    [string]$Token
)

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
    exit 1
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
        exit 1
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
    param ([string]$Hostname, [string]$Email)
    $sslcerts = "$env:USERPROFILE\sslcerts"
    $certFile = "$sslcerts\fullchain.pem"
    $keyFile = "$sslcerts\privkey.pem"

    if ((Test-Path $certFile) -and (Test-Path $keyFile)) {
        $certText = & openssl x509 -in $certFile -noout -text
        $sans = ($certText | Select-String "Subject Alternative Name" -Context 0,1).Context.PostContext[0].Trim().Split(',') | ForEach-Object { $_.Trim().Replace("DNS:", "") }
        if ($sans -contains $Hostname) {
            Write-Host "Certificates for $Hostname already exist at $sslcerts. Skipping generation." -ForegroundColor Yellow
            return
        }
    }

    New-Item -ItemType Directory -Path $sslcerts -Force | Out-Null
    if (Is-LocalHostname $Hostname) {
        Write-Host "Local hostname detected ($Hostname). Using mkcert..." -ForegroundColor Cyan

        # Run mkcert -install with an 8-second timeout
        $process = Start-Process -FilePath "mkcert" -ArgumentList "-install" -NoNewWindow -PassThru 
        $timeoutSeconds = 8
        $process | Wait-Process -Timeout $timeoutSeconds -ErrorAction SilentlyContinue
        if ($process.HasExited) {
            if ($process.ExitCode -ne 0) {
                Write-Error "mkcert -install failed with exit code $($process.ExitCode)."
            }
            Write-Host "mkcert -install completed successfully." -ForegroundColor Cyan
        } else {
            Write-Warning "mkcert -install timed out after $timeoutSeconds seconds. Terminating process..."
            $process | Stop-Process -Force
            Start-Sleep -Seconds 1  # Give it a moment to terminate
            Write-Host "mkcert -install was terminated due to timeout."
        }

        & mkcert -cert-file $certFile -key-file $keyFile $Hostname localhost 127.0.0.1 
        if ($LASTEXITCODE -ne 0) {
            Write-Error "mkcert failed to generate certificates for $Hostname."
        }
    } else {
        if (-not $Email) {
            Write-Host "Non-local hostname ($Hostname) requires an email for Let's Encrypt. Please provide one:" -ForegroundColor Yellow
            $Email = Read-Host "Enter email address"
            if (-not $Email) {
                Write-Error "Email is required for non-local hostnames with certbot."
                exit 1
            }
        }
        Write-Host "Non-local hostname detected ($Hostname). Waiting for DNS resolution..." -ForegroundColor Cyan
        Wait-ForDnsResolution -Hostname $Hostname
        Write-Host "Using certbot for $Hostname..." -ForegroundColor Cyan
        & certbot certonly --standalone -d $Hostname --agree-tos -m $Email --no-eff-email --non-interactive --cert-name browserbox
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Certbot failed to generate certificates for $Hostname. Ensure DNS is set up and port 80 is free."
            exit 1
        }
        $certbotCert = "C:\Certbot\live\browserbox\fullchain.pem"
        $certbotKey = "C:\Certbot\live\browserbox\privkey.pem"
        Copy-Item -Path $certbotCert -Destination $certFile -Force
        Copy-Item -Path $certbotKey -Destination $keyFile -Force
    }
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
    exit 1
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
    exit 1
}

foreach ($p in $portsToCheck) {
    if (-not (Test-PortFree $p)) {
        Write-Error "Port $p is already in use or invalid."
        exit 1
    }
    Open-FirewallPort $p
}

if (-not $Token) {
    $Token = [System.Guid]::NewGuid().ToString()
    Write-Host "Generated token: $Token" -ForegroundColor Cyan
}

$CONFIG_DIR = "$env:USERPROFILE\.config\dosyago\bbpro"
New-Item -ItemType Directory -Path $CONFIG_DIR -Force | Out-Null
Get-Date | Out-File "$CONFIG_DIR\.bbpro_config_dir" -Encoding utf8
Write-Host "Created config directory at $CONFIG_DIR." -ForegroundColor Cyan

$testEnvPath = "$CONFIG_DIR\test.env"
if (Test-Path $testEnvPath) {
    $existingConfig = Get-Content $testEnvPath | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") { [PSCustomObject]@{ Name = $Matches[1]; Value = $Matches[2] } }
    }
    $existingHostname = ($existingConfig | Where-Object { $_.Name -eq "DOMAIN" }).Value
    if ($existingHostname -eq $Hostname) {
        Write-Host "Setup already completed for $Hostname. Using existing configuration." -ForegroundColor Yellow
    } else {
        Generate-Certificates -Hostname $Hostname -Email $Email
    }
} else {
    Generate-Certificates -Hostname $Hostname -Email $Email
}

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
SSLCERTS_DIR="$env:USERPROFILE\sslcerts"
DOMAIN="$Hostname"
"@
$envContent | Out-File "$CONFIG_DIR\test.env" -Encoding utf8
Write-Host "Updated test.env with configuration." -ForegroundColor Cyan

# Generate and display login link
$loginLink = "https://${Hostname}:${PORT}/login?token=$Token"
Write-Host "Login link for this instance:" -ForegroundColor Green
Write-Host $loginLink
$loginLink | Out-File "$CONFIG_DIR\login.link" -Encoding utf8

Write-Host "Setup complete!" -ForegroundColor Green
