# certify.ps1

[CmdletBinding()]
param (
    [Parameter(Mandatory = $false, HelpMessage = "Force license check without overwriting a valid ticket")]
    [switch]$ForceLicense,
    [Parameter(Mandatory = $false, HelpMessage = "Skip seat reservation step")]
    [switch]$NoReservation,
    [Parameter(Mandatory = $false, HelpMessage = "License key to certify")]
    [string]$LicenseKey
)

if ($PSBoundParameters.ContainsKey('Help') -or $args -contains '-help') {
    Write-Host "bbx certify" -ForegroundColor Green
    Write-Host "Certify your BrowserBox license" -ForegroundColor Yellow
    Write-Host "Usage: bbx certify [-ForceLicense] [-NoReservation] [-LicenseKey <key>]" -ForegroundColor Cyan
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host " -ForceLicense Force license check without overwriting valid ticket" -ForegroundColor White
    Write-Host " -NoReservation Skip seat reservation step" -ForegroundColor White
    Write-Host " -LicenseKey Specify the license key to certify" -ForegroundColor White
    return
}

# Configuration
$ConfigDir = "${env:USERPROFILE}\.config\dosyago\bbpro"
$TestEnvFile = "${ConfigDir}\test.env"
$TicketDir = "${ConfigDir}\tickets"
$TicketFile = "${TicketDir}\ticket.json"
$ReservationFile = "${TicketDir}\reservation.json"
$CertMetaFile = "${TicketDir}\cert.meta.env"
$ApiVersion = "v1"
$ApiServer = "https://master.dosaygo.com"
$ApiBase = "$ApiServer/$ApiVersion"
$VacantSeatEndpoint = "$ApiBase/vacant-seat"
$IssueTicketEndpoint = "$ApiBase/tickets"
$RegisterCertEndpoint = "$ApiBase/register-certificates"
$ReserveSeatEndpoint = "$ApiBase/reserve-seat"
$ValidateTicketEndpoint = "$ApiServer/tickets/validate"
$TicketValidityPeriod = 10 * 60 * 60 # 10 hours in seconds

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
    if (-not $timeSlot) {
        Write-Warning "Invalid or missing timeSlot in $TicketFile. Ticket JSON: $($ticketJson | ConvertTo-Json -Depth 10 -Compress)"
        return $false
    }
    $currentTime = [int](Get-Date -UFormat %s)
    $expirationTime = [int]$timeSlot + $TicketValidityPeriod
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

# Helper function: Sign data with Ed25519 using Node.js and @noble/ed25519
function Sign-Ed25519WithNode {
    param (
        [string]$Data,
        [string]$PrivateKeyBase64url
    )
    
    $nodeScript = @"
const ed = require('@noble/ed25519');
const data = process.argv[1];
const privateKeyBase64url = process.argv[2];

(async () => {
  try {
    const privateKey = Buffer.from(privateKeyBase64url, 'base64url');
    const signature = await ed.signAsync(Buffer.from(data, 'utf8'), privateKey);
    console.log(Buffer.from(signature).toString('hex'));
  } catch (err) {
    console.error('Error signing with Ed25519:', err.message);
    process.exit(1);
  }
})();
"@
    
    $result = node -e $nodeScript $Data $PrivateKeyBase64url 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to sign with Ed25519: $result"
    }
    return $result.Trim()
}

# Helper function: Verify signature with Node.js using crypto
function Verify-WithNode {
    param (
        [string]$Data,
        [string]$Signature,
        [string]$PublicKey
    )
    
    $nodeScript = @"
const crypto = require('crypto');
const data = process.argv[1];
const signature = process.argv[2];
const publicKey = process.argv[3];
const verify = crypto.createVerify('SHA256');
verify.update(data);
verify.end();
const isValid = verify.verify(publicKey, Buffer.from(signature, 'hex'));
console.log(isValid ? 'true' : 'false');
"@
    
    $result = node -e $nodeScript $Data $Signature $PublicKey 2>&1
    return $result.Trim() -eq 'true'
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
        Write-Warning "Could not get challenge nonce, proceeding without challenge-response: $_"
        # Fallback to non-challenge validation
        $payload = @{ certificateJson = $ticketObject } | ConvertTo-Json -Depth 10 -Compress
        $response = Invoke-RestMethod -Uri $ValidateTicketEndpoint -Method Post -ContentType "application/json" -Body $payload
        $isValid = $response.isValid -eq $true
        if ($isValid) {
            Write-Host "Server confirmed: Ticket is valid" -ForegroundColor Green
            return $true
        } else {
            Write-Warning "Server response: Ticket is invalid. Response: $($response | ConvertTo-Json -Depth 10 -Compress)"
            Remove-Item $TicketFile -Force
            return $false
        }
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
        $nonceSignature = Sign-Ed25519WithNode -Data $nonce -PrivateKeyBase64url $ticketPrivateKey
    } catch {
        Write-Warning "Error: Failed to sign challenge nonce: $_"
        return $false
    }
    
    Write-Host "Challenge nonce signed" -ForegroundColor Yellow
    
    # Step 3: Send validation request with challenge response
    $payload = @{
        certificateJson = $ticketObject
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
    if ($serverSignature) {
        Write-Host "Verifying server signature for mutual authentication..." -ForegroundColor Yellow
        $stadiumPublicKey = $ticketObject.issuingCertificate.publicKey
        if (-not $stadiumPublicKey) {
            Write-Warning "Cannot extract stadium public key, skipping server signature verification"
        } else {
            # Generate a pseudo instanceId (in real usage, this should match what was sent to server)
            $instanceId = "DOSAYGO://browserbox/validation-check/$([int](Get-Date -UFormat %s))"
            try {
                $verificationResult = Verify-WithNode -Data $instanceId -Signature $serverSignature -PublicKey $stadiumPublicKey
                if ($verificationResult) {
                    Write-Host "Server signature verified successfully" -ForegroundColor Green
                } else {
                    Write-Warning "Server signature verification failed"
                    # In production, you might want to fail here to prevent MITM attacks
                }
            } catch {
                Write-Warning "Error verifying server signature: $_"
            }
        }
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
    $deviceId = $env:COMPUTERNAME
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
    }
    @{ reservationCode = $reservation } | ConvertTo-Json -Depth 10 -Compress | Set-Content $ReservationFile -Force
    "BBX_RESERVATION_CODE=$reservation" | Out-File $CertMetaFile -Encoding utf8 -Force
}

# Main logic
try {
    Write-Host "Certifying BrowserBox license..." -ForegroundColor Cyan
    $ticketValid = Test-TicketValidity
    # Track whether the key came from config to avoid redundant saves
    $keyFromConfig = $false
    $LICENSE_KEY = $null
    # Select license key (parameter > env var > config > prompt)
    if ($LicenseKey) {
        $LICENSE_KEY = $LicenseKey
    } elseif ($env:LICENSE_KEY) {
        $LICENSE_KEY = $env:LICENSE_KEY
    } elseif ($Config["LICENSE_KEY"]) {
        $LICENSE_KEY = $Config["LICENSE_KEY"]
        $keyFromConfig = $true
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

          # Persist LICENSE_KEY regardless of its source (param/env/config/prompt)
          Save-Config
        } else {
            Write-Host "License is valid, keeping existing valid ticket" -ForegroundColor Green
        }
    } else {
        if ($ticketValid) {
            Write-Host "Using existing valid ticket" -ForegroundColor Green
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

            # Persist LICENSE_KEY regardless of its source (param/env/config/prompt)
            Save-Config
        }
    }
    # Final safety: if we have a LICENSE_KEY in memory, ensure it's persisted to test.env
    if ($LICENSE_KEY) { Save-Config }

    Write-Host "Certification complete." -ForegroundColor Green
} catch {
    Write-Error "An error occurred during certification: $_"
    throw "CERTIFICATION Error"
}
