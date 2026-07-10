# certify.ps1

[CmdletBinding()]
param (
    [Parameter(Mandatory = $false, HelpMessage = "Show help.")]
    [switch]$Help,
    [Parameter(Mandatory = $false, HelpMessage = "Force server validation of the current ticket")]
    [switch]$ForceTicket,
    [Parameter(Mandatory = $false, HelpMessage = "Force license check without overwriting a valid ticket")]
    [switch]$ForceLicense,
    [Parameter(Mandatory = $false, HelpMessage = "Skip seat reservation step")]
    [switch]$NoReservation,
    [Parameter(Mandatory = $false, HelpMessage = "License key to certify")]
    [string]$LicenseKey
)

if ($Help -or $args -contains '-help') {
    Write-Host "bbx certify" -ForegroundColor Green
    Write-Host "Certify your BrowserBox license" -ForegroundColor Yellow
    Write-Host "Usage: bbx certify [-ForceTicket] [-ForceLicense] [-NoReservation] [-LicenseKey <key>]" -ForegroundColor Cyan
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host " -ForceTicket  Validate the current ticket with the server (issue a new one if invalid)" -ForegroundColor White
    Write-Host " -ForceLicense Force license check without overwriting valid ticket" -ForegroundColor White
    Write-Host " -NoReservation Skip seat reservation step" -ForegroundColor White
    Write-Host " -LicenseKey Specify the license key to certify" -ForegroundColor White
    Write-Host "Environment:" -ForegroundColor Cyan
    Write-Host " BBX_LICENSE_SERVER_URL Override API server (default: https://master.dosaygo.com)" -ForegroundColor White
    $global:LASTEXITCODE = 0
    return
}

# Configuration
$ConfigDir = "${env:USERPROFILE}\.config\dosaygo\bbpro"
$TestEnvFile = "${ConfigDir}\test.env"
$TicketDir = "${ConfigDir}\tickets"
$TicketFile = "${TicketDir}\ticket.json"
$ReservationFile = "${TicketDir}\reservation.json"
$CertMetaFile = "${TicketDir}\cert.meta.env"
$ApiVersion = "v1"
$ApiServer = if ($env:BBX_LICENSE_SERVER_URL) { $env:BBX_LICENSE_SERVER_URL } else { "https://master.dosaygo.com" }
$ApiBase = "$ApiServer/$ApiVersion"
$VacantSeatEndpoint = "$ApiBase/vacant-seat?reserve=0"
$IssueTicketEndpoint = "$ApiBase/tickets"
$RegisterCertEndpoint = "$ApiBase/register-certificates"
$ReserveSeatEndpoint = "$ApiBase/reserve-seat"
$ValidateTicketEndpoint = "$ApiServer/tickets/validate"
$TicketValidityPeriod = 24 * 60 * 60 # 24 hours in seconds

# Ensure config directory exists
if (-not (Test-Path $ConfigDir)) {
    New-Item -Path $ConfigDir -ItemType Directory -Force | Out-Null
}

# Ensure ticket directory exists
if (-not (Test-Path $TicketDir)) {
    New-Item -Path $TicketDir -ItemType Directory -Force | Out-Null
}

# Load existing config from test.env if it exists
$Config = @{}
if (Test-Path $TestEnvFile) {
    Get-Content $TestEnvFile | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            $Config[$Matches[1]] = $Matches[2]
        }
    }
}

# BrowserBox CLI helpers ------------------------------------------------------
$script:BrowserBoxBinary = $null
function Resolve-BrowserBoxBinary {
    if ($env:BBX_BINARY_PATH -and (Test-Path $env:BBX_BINARY_PATH)) { return $env:BBX_BINARY_PATH }
    $default = Join-Path "$env:LOCALAPPDATA\browserbox\bin" "browserbox.exe"
    if (Test-Path $default) { return $default }
    $cmd = Get-Command browserbox.exe -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Path) { return $cmd.Path }
    $cmd = Get-Command browserbox -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Path) { return $cmd.Path }
    return $null
}

function Require-BrowserBoxBinary {
    if (-not $script:BrowserBoxBinary -or -not (Test-Path $script:BrowserBoxBinary)) {
        $script:BrowserBoxBinary = Resolve-BrowserBoxBinary
    }
    if (-not $script:BrowserBoxBinary) {
        throw "BrowserBox binary not found. Run 'bbx install' to install it, or set BBX_BINARY_PATH."
    }
}

function Invoke-BrowserBoxCommand {
    param([string[]]$Arguments)
    Require-BrowserBoxBinary
    # Capture STDOUT and STDERR separately to avoid mixing them
    $pinfo = New-Object System.Diagnostics.ProcessStartInfo
    $pinfo.FileName = $script:BrowserBoxBinary
    $pinfo.Arguments = $Arguments -join ' '
    $pinfo.RedirectStandardOutput = $true
    $pinfo.RedirectStandardError = $true
    $pinfo.UseShellExecute = $false
    $pinfo.CreateNoWindow = $true
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $pinfo
    $process.Start() | Out-Null
    $stdout = $process.StandardOutput.ReadToEnd()
    $stderr = $process.StandardError.ReadToEnd()
    $process.WaitForExit()
    if ($process.ExitCode -ne 0) {
        $errMsg = if ($stderr) { $stderr } else { $stdout }
        throw "BrowserBox command failed ($($Arguments -join ' ')): $errMsg"
    }
    return $stdout.Trim()
}

function Get-DeviceIdFromBinary {
    return (Invoke-BrowserBoxCommand -Arguments @("device-id")).Trim()
}

function Sign-Ed25519 {
    param (
        [string]$Data,
        [string]$PrivateKeyBase64url
    )
    return (Invoke-BrowserBoxCommand -Arguments @("sign-ed25519", $Data, $PrivateKeyBase64url)).Trim()
}

function Verify-RsaSha256 {
    param (
        [string]$Data,
        [string]$Signature,
        [string]$PublicKey
    )
    $result = Invoke-BrowserBoxCommand -Arguments @("verify-rsa-sha256", $Data, $Signature, $PublicKey)
    return $result.Trim().ToLowerInvariant() -eq "true"
}

# Function to save config to test.env
function Save-Config {
    $Config["LICENSE_KEY"] = $LICENSE_KEY
    $envContent = $Config.GetEnumerator() | Sort-Object Name | ForEach-Object { "$($_.Name)=$($_.Value)" }
    $envContent | Out-File $TestEnvFile -Encoding utf8 -Force
    Write-Verbose "Saved config to $TestEnvFile"
}

# Function to append meta to cert.meta.env
function Meta-Put {
    param (
        [string]$Key,
        [string]$Value
    )
    $existingLines = if (Test-Path $CertMetaFile) { Get-Content $CertMetaFile } else { @() }
    $newLines = $existingLines | Where-Object { $_ -notmatch "^$Key=" }
    $newLines += "$Key=$Value"
    $newLines | Out-File $CertMetaFile -Encoding utf8 -Force
}

# Function to check local ticket validity
function Test-TicketValidity {
    if (-not (Test-Path $TicketFile)) {
        Write-Warning "No existing ticket found at $TicketFile"
        return $false
    }
    $ticketJson = Get-Content $TicketFile -Raw | ConvertFrom-Json
    Write-Verbose "Ticket JSON: $($ticketJson | ConvertTo-Json -Depth 10 -Compress)"
    $ticket = $ticketJson.ticket
    if (-not $ticket) {
        Write-Warning "Invalid ticket structure: 'ticket' property missing in $TicketFile. Ticket JSON: $($ticketJson | ConvertTo-Json -Depth 10 -Compress)"
        return $false
    }
    $timeSlot = $ticket.ticketData.timeSlot
    $expiresAt = $ticket.ticketData.expiresAt
    if (-not $timeSlot -and -not $expiresAt) {
        Write-Warning "Invalid or missing timeSlot/expiresAt in $TicketFile. Ticket JSON: $($ticketJson | ConvertTo-Json -Depth 10 -Compress)"
        return $false
    }
    $currentTime = [int](Get-Date -UFormat %s)
    if ($expiresAt -and $expiresAt -match '^\d+$') {
        $expirationTime = [int]$expiresAt
    } else {
        $expirationTime = [int]$timeSlot + $TicketValidityPeriod
    }
    $remainingSeconds = $expirationTime - $currentTime
    if ($currentTime -lt $expirationTime) {
        $remainingHours = [math]::Floor($remainingSeconds / 3600)
        $remainingMinutes = [math]::Floor(($remainingSeconds % 3600) / 60)
        Write-Host "Existing ticket for seat is valid (expires in ${remainingHours}h ${remainingMinutes}m)" -ForegroundColor Green
        return $true
    } else {
        Write-Warning "Existing ticket has expired"
        Remove-Item $TicketFile -Force
        return $false
    }
}

# Function to validate ticket with server
function Test-TicketWithServer {
    $ticketJson = Get-Content $TicketFile -Raw
    $ticketObject = $ticketJson | ConvertFrom-Json
    Write-Host "Checking ticket validity with server..." -ForegroundColor Yellow
    
    # Extract seatId from ticket
    $seatId = $ticketObject.seatCertificate.seatData.seatId
    if (-not $seatId) {
        Write-Warning "Error: Cannot extract seatId from ticket"
        return $false
    }
    
    # Step 1: Request challenge nonce from server
    Write-Host "Requesting challenge nonce..." -ForegroundColor Yellow
    $challengeEndpoint = "$ApiServer/tickets/challenge"
    try {
        $challengePayload = @{ seatId = $seatId } | ConvertTo-Json -Depth 10 -Compress
        $challengeResponse = Invoke-RestMethod -Uri $challengeEndpoint -Method Post -ContentType "application/json" -Body $challengePayload -ErrorAction Stop
        $nonce = $challengeResponse.nonce
    } catch {
        Write-Warning "Could not get challenge nonce: $_"
        return $false
    }
    
    if (-not $nonce) {
        Write-Warning "Server did not provide a challenge nonce"
        return $false
    }
    
    Write-Host "Received challenge nonce" -ForegroundColor Yellow
    
    # Step 2: Extract ticket's Ed25519 private key and sign the nonce
    $ticketPrivateKey = $ticketObject.ticket.ticketData.jwk.d
    if (-not $ticketPrivateKey) {
        Write-Warning "Error: Cannot extract ticket private key from ticket"
        return $false
    }
    
    Write-Host "Signing challenge nonce with Ed25519..." -ForegroundColor Yellow
    try {
        $nonceSignature = Sign-Ed25519 -Data $nonce -PrivateKeyBase64url $ticketPrivateKey
    } catch {
        Write-Warning "Error: Failed to sign challenge nonce: $_"
        return $false
    }
    
    Write-Host "Challenge nonce signed" -ForegroundColor Yellow

    $instanceId = "DOSAYGO://browserbox/validation-check/$([guid]::NewGuid().ToString())"
    
    # Step 3: Send validation request with challenge response
    $payload = @{
        certificateJson = $ticketJson
        instanceId = $instanceId
        challengeNonce = $nonce
        nonceSignature = $nonceSignature
    } | ConvertTo-Json -Depth 10 -Compress
    
    $response = Invoke-RestMethod -Uri $ValidateTicketEndpoint -Method Post -ContentType "application/json" -Body $payload
    $isValid = $response.isValid -eq $true
    $serverSignature = $response.serverSignature
    
    if (-not $isValid) {
        Write-Warning "Server response: Ticket is invalid. Response: $($response | ConvertTo-Json -Depth 10 -Compress)"
        Remove-Item $TicketFile -Force
        return $false
    }
    
    # Step 4: Verify server signature (mutual authentication)
    if (-not $serverSignature) {
        Write-Warning "Server did not provide a signed validation response"
        return $false
    }

    Write-Host "Verifying server signature for mutual authentication..." -ForegroundColor Yellow
    $stadiumPublicKey = $ticketObject.issuingCertificate.publicKey
    if (-not $stadiumPublicKey) {
        Write-Warning "Cannot extract stadium public key"
        return $false
    }

    try {
        $verificationResult = Verify-RsaSha256 -Data $instanceId -Signature $serverSignature -PublicKey $stadiumPublicKey
        if ($verificationResult) {
            Write-Host "Server signature verified successfully" -ForegroundColor Green
        } else {
            Write-Warning "Server signature verification failed"
            return $false
        }
    } catch {
        Write-Warning "Error verifying server signature: $_"
        return $false
    }
    
    Write-Host "Server confirmed: Ticket is valid" -ForegroundColor Green
    return $true
}

# Function to fetch a vacant seat
function Get-VacantSeat {
    Write-Host "Requesting a vacant seat..." -ForegroundColor Yellow
    $headers = @{ "Authorization" = "Bearer $LICENSE_KEY" }
    $response = Invoke-RestMethod -Uri $VacantSeatEndpoint -Method Get -Headers $headers
    $seat = $response.vacantSeat
    if (-not $seat) {
        Write-Error "No vacant seat available. Response: $($response | ConvertTo-Json -Depth 10 -Compress)"
        throw "SEAT Error"
    }
    Write-Host "Obtained seat: $seat" -ForegroundColor Green
    return $seat
}

# Function to issue a ticket
function New-Ticket {
    param ([string]$SeatId)
    $timeSlot = ([int](Get-Date -UFormat %s)).ToString() # <-- FIX: Cast to string
    try {
        $deviceId = Get-DeviceIdFromBinary
    } catch {
        Write-Error "Unable to compute BrowserBox device ID: $_"
        throw
    }
    Write-Host "Issuing ticket for seat $SeatId..." -ForegroundColor Yellow
    $payload = @{
        seatId = $SeatId
        timeSlot = $timeSlot
        deviceId = $deviceId
        issuer = "master"
    } | ConvertTo-Json -Depth 10 -Compress
    $headers = @{ "Authorization" = "Bearer $LICENSE_KEY"; "Content-Type" = "application/json" }
    $response = Invoke-RestMethod -Uri $IssueTicketEndpoint -Method Post -Headers $headers -Body $payload
    if (-not $response) {
        Write-Error "Error issuing ticket. No response from server."
        throw "SERVER Error"
    }
    $ticket = $response.ticket
    if (-not $ticket) {
        Write-Error "Error issuing ticket. 'ticket' property missing in response: $($response | ConvertTo-Json -Depth 10 -Compress)"
        throw "TICKET Error"
    }
    Write-Host "Ticket issued successfully" -ForegroundColor Green
    return $ticket
}

# Function to register ticket as certificate
function Register-Certificate {
    param ([PSObject]$Ticket)
    Write-Host "Registering ticket as certificate..." -ForegroundColor Yellow
    $payload = @{ certificates = @($Ticket) } | ConvertTo-Json -Depth 10 -Compress
    Write-Verbose "Register payload: $payload"
    $headers = @{ "Authorization" = "Bearer $LICENSE_KEY"; "Content-Type" = "application/json" }
    $response = Invoke-RestMethod -Uri $RegisterCertEndpoint -Method Post -Headers $headers -Body $payload
    if ($response.message -ne "Certificates registered successfully.") {
        Write-Error "Error registering certificate. Response: $($response | ConvertTo-Json -Depth 10 -Compress)"
        throw "REGISTERING Error"
    }
    Write-Host "Certificate registered successfully" -ForegroundColor Green
}

# Function to reserve seat
function Reserve-Seat {
    param ([PSObject]$Ticket)
    Write-Host "Reserving seat..." -ForegroundColor Yellow
    $payload = @{ ticketJson = $Ticket } | ConvertTo-Json -Depth 10 -Compress
    $headers = @{ "Authorization" = "Bearer $LICENSE_KEY"; "Content-Type" = "application/json" }
    $response = Invoke-RestMethod -Uri $ReserveSeatEndpoint -Method Post -Headers $headers -Body $payload
    $reservation = $response.reservationCode
    $newTicket = $response.ticket
    if (-not $reservation) {
        Write-Error "Error reserving seat. Response: $($response | ConvertTo-Json -Depth 10 -Compress)"
        throw "RESERVATION Error"
    }
    Write-Host "Seat reserved successfully" -ForegroundColor Green
    if ($newTicket) {
        $newTicket | ConvertTo-Json -Depth 10 -Compress | Set-Content $TicketFile -Force
        Write-Host "New ticket saved to $TicketFile" -ForegroundColor Green
        Register-Certificate -Ticket $newTicket
        $newTicketId = $newTicket.ticket.ticketData.ticketId
        $newTimeSlot = $newTicket.ticket.ticketData.timeSlot
        if ($newTicketId) { Meta-Put -Key "BBX_TICKET_ID" -Value $newTicketId }
        if ($newTimeSlot) { Meta-Put -Key "BBX_TICKET_SLOT" -Value $newTimeSlot }
    }
    @{ reservationCode = $reservation } | ConvertTo-Json -Depth 10 -Compress | Set-Content $ReservationFile -Force
    Meta-Put -Key "BBX_RESERVATION_CODE" -Value $reservation
}

# Main logic
try {
    Write-Host "Certifying BrowserBox license..." -ForegroundColor Cyan
    $ticketValid = Test-TicketValidity
    $existingTicket = $null
    if (Test-Path $TicketFile) {
        try {
            $existingTicket = Get-Content $TicketFile -Raw | ConvertFrom-Json
        } catch {
            Write-Warning "Existing ticket file is unreadable; will request a new ticket."
            $existingTicket = $null
            $ticketValid = $false
        }
    }

    $LICENSE_KEY = $null
    # Select license key (parameter > env var > config > prompt)
    if ($LicenseKey) {
        $LICENSE_KEY = $LicenseKey
    } elseif ($env:LICENSE_KEY) {
        $LICENSE_KEY = $env:LICENSE_KEY
    } elseif ($Config["LICENSE_KEY"]) {
        $LICENSE_KEY = $Config["LICENSE_KEY"]
    }

    # If we still don't have a key, prompt (even if a ticket is already valid) so it gets persisted for other commands.
    if (-not $LICENSE_KEY) {
        Write-Host "No LICENSE_KEY found. Please enter your license key (purchase at http://getbrowserbox.com or email sales@dosaygo.com):" -ForegroundColor Yellow
        $LICENSE_KEY = Read-Host "License Key"
        if (-not $LICENSE_KEY) {
            Write-Error "No license key entered. Run 'bbx certify -LicenseKey <key>' or set LICENSE_KEY environment variable."
            throw "LICENSE Error"
        }
    }

    if ($ForceTicket -and $ForceLicense) {
        Write-Error "Use only -ForceTicket or -ForceLicense, not both."
        throw "FLAG Error"
    }

    $completedWithoutNewTicket = $false
    if ($ForceTicket -and $ticketValid) {
        if (Test-TicketWithServer) {
            Write-Host "Server confirmed ticket is valid; keeping existing ticket." -ForegroundColor Green
            $completedWithoutNewTicket = $true
        } else {
            Write-Warning "Server indicated the ticket is invalid. Requesting a new ticket..."
            $ticketValid = $false
        }
    } elseif (-not $ForceTicket -and -not $ForceLicense -and $ticketValid) {
        if ($NoReservation) {
            Write-Host "Existing ticket is valid (reservation skipped per flag)." -ForegroundColor Green
            $completedWithoutNewTicket = $true
        } elseif ($existingTicket) {
            try {
                Write-Host "Existing ticket is valid. Attempting to reserve seat..." -ForegroundColor Green
                Reserve-Seat -Ticket $existingTicket
                $completedWithoutNewTicket = $true
            } catch {
                Write-Warning "Failed to reserve seat for existing ticket: $_"
                $ticketValid = $false
            }
        } else {
            $ticketValid = $false
        }
    }

    if ($completedWithoutNewTicket) {
        if ($LICENSE_KEY) { Save-Config }
        Write-Host "Certification complete." -ForegroundColor Green
        return
    }

    if ($ForceLicense) {
        Write-Host "Force license mode: Checking license validity without overwriting valid ticket" -ForegroundColor Yellow
        $seatId = Get-VacantSeat
        $fullTicket = New-Ticket -SeatId $seatId
        if (-not $ticketValid) {
            $fullTicket | ConvertTo-Json -Depth 10 -Compress | Set-Content $TicketFile -Force
            Register-Certificate -Ticket $fullTicket
            if (-not $NoReservation) {
                Reserve-Seat -Ticket $fullTicket
            }
            # augment cert.meta.env with ticket basics
            $ticketId = $fullTicket.ticket.ticketData.ticketId
            $timeSlot = $fullTicket.ticket.ticketData.timeSlot
            Meta-Put -Key "BBX_TICKET_ID" -Value $ticketId
            Meta-Put -Key "BBX_TICKET_SLOT" -Value $timeSlot
            Write-Host "New ticket saved to $TicketFile" -ForegroundColor Green
        } else {
            Write-Host "License is valid, keeping existing valid ticket" -ForegroundColor Green
        }
    } else {
        $seatId = Get-VacantSeat
        $fullTicket = New-Ticket -SeatId $seatId
        $fullTicket | ConvertTo-Json -Depth 10 -Compress | Set-Content $TicketFile -Force
        Register-Certificate -Ticket $fullTicket
        if (-not $NoReservation) {
            Reserve-Seat -Ticket $fullTicket
        }
        # augment cert.meta.env with ticket basics
        $ticketId = $fullTicket.ticket.ticketData.ticketId
        $timeSlot = $fullTicket.ticket.ticketData.timeSlot
        Meta-Put -Key "BBX_TICKET_ID" -Value $ticketId
        Meta-Put -Key "BBX_TICKET_SLOT" -Value $timeSlot
        Write-Host "New ticket saved to $TicketFile" -ForegroundColor Green
    }

    # Persist LICENSE_KEY regardless of its source (param/env/config/prompt)
    if ($LICENSE_KEY) { Save-Config }

    Write-Host "Certification complete." -ForegroundColor Green
} catch {
    Write-Error "An error occurred during certification: $_"
    throw "CERTIFICATION Error"
}
