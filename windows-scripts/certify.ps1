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

# Function to validate ticket with server
function Test-TicketWithServer {
    $ticketJson = Get-Content $TicketFile -Raw
    Write-Host "Checking ticket validity with server..." -ForegroundColor Yellow
    $payload = @{ certificateJson = $ticketJson } | ConvertTo-Json -Depth 10 -Compress
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
    $timeSlot = [int](Get-Date -UFormat %s)
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
    } elseif (-not $ticketValid) {
        Write-Host "No LICENSE_KEY provided. Please enter a license key (purchase at http://getbrowserbox.com or email sales@dosaygo.com for help):" -ForegroundColor Yellow
        $LICENSE_KEY = Read-Host "License Key"
        if (-not $LICENSE_KEY) {
            Write-Error "No license key entered. Run 'bbx certify -LicenseKey <key>' or set LICENSE_KEY environment variable."
            throw "LICENSE Error"
        }
    } else {
        Write-Host "Using existing valid ticket without requiring a new license key" -ForegroundColor Green
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
            if (-not $keyFromConfig) {
                Save-Config
            }
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
            if (-not $keyFromConfig) {
                Save-Config
            }
        }
    }
    Write-Host "Certification complete." -ForegroundColor Green
} catch {
    Write-Error "An error occurred during certification: $_"
    throw "CERTIFICATION Error"
}
