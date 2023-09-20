
# _setup_bbpro.ps1 PowerShell Script

# Install Guard for OpenSSL
if (-Not (Get-Command openssl -ErrorAction SilentlyContinue)) {
  Write-Host "OpenSSL is not installed. Installing now..."
  winget install -e --id ShiningLight.OpenSSL
} else {
  Write-Host "OpenSSL is already installed."
}
# Check if the port is available and also the two ports on either side
Function Test-PortRange {
  param([int]$port)
  $portsToCheck = @($port - 2, $port - 1, $port, $port + 1, $port + 2)
  foreach ($p in $portsToCheck) {
    $tcpconnection = Test-NetConnection -ComputerName localhost -Port $p -ErrorAction SilentlyContinue
    if ($tcpconnection.TcpTestSucceeded -eq $true) {
      Write-Host "Error: Port $p is already in use."
      return $false
    }
  }
  return $true
}

# Check if the port and adjacent ports are free
if (-Not (Test-PortRange -port $Port)) {
  Write-Host "Error: One of the ports adjacent to $Port is already in use."
  exit 1
}
# Parse command-line arguments for port, token, cookie, and doc API key
param (
  [int]$Port,
  [string]$Token,
  [string]$Cookie,
  [string]$DocApiKey
)
# Check if port is provided
if ($null -eq $Port) {
  Write-Host "Error: You must provide a port number."
  exit 1
}
# Generate random values if not provided
if ($null -eq $Token) {
  $Token = -join ((65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
}
if ($null -eq $Cookie) {
  $Cookie = -join ((65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
}
if ($null -eq $DocApiKey) {
  $DocApiKey = -join ((65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
}
# Validate the provided or generated values
# Note: This is a placeholder; you'll need to replace it with actual logic
# Create a configuration directory and a test.env file with the parsed options
$ConfigDir = "$env:USERPROFILE\.config\dosyago\bbpro"
if (-Not (Test-Path -Path $ConfigDir)) {
  New-Item -Path $ConfigDir -ItemType Directory -Force
}
# Generate test.env file
$testEnvContent = @"
export APP_PORT=$Port
export LOGIN_TOKEN=$Token
export COOKIE_VALUE=$Cookie
export DOC_API_KEY=$DocApiKey
"@
$testEnvPath = Join-Path $ConfigDir "test.env"
Set-Content -Path $testEnvPath -Value $testEnvContent
# Parse the hostname from the SSL certificate
$sslCertsPath = "$env:USERPROFILE\sslcerts"
$certFile = Join-Path $sslCertsPath "fullchain.pem"
if (Test-Path -Path $certFile) {
  # Use OpenSSL to extract the SANs
  $sans = & openssl x509 -in $certFile -noout -text | Select-String "DNS:" -Context 0,1
  $hostname = ($sans -split ",")[0] -replace "DNS:", ""
  $loginLink = "https://$hostname:$Port/login?token=$Token"
  Write-Host "The login link for this instance will be: $loginLink"
  $loginLinkPath = Join-Path $ConfigDir "login.link"
  Set-Content -Path $loginLinkPath -Value $loginLink
} else {
  Write-Host "Could not find certificate file at $certFile"
}
