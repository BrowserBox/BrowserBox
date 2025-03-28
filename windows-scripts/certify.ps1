# certify.ps1 - Certify a BrowserBox license key on Windows
[CmdletBinding()]
param (
    [Parameter(Mandatory = $false, HelpMessage = "Force license check without overwriting a valid ticket")]
    [switch]$ForceLicense
)

# Configuration
$ConfigDir = "$env:USERPROFILE\.config\dosyago\bbpro"
$TestEnvFile = "$ConfigDir\test.env"
$TicketFile = "$ConfigDir\ticket.json"
$ApiVersion = "v1"
$ApiServer = "https://master.dosaygo.com"
$ApiBase = "$ApiServer/$ApiVersion"
$VacantSeatEndpoint = "$ApiBase/vacant-seat"
$IssueTicketEndpoint = "$ApiBase/tickets"
$RegisterCertEndpoint = "$ApiBase/register-certificates"
$ValidateTicketEndpoint = "$ApiServer/tickets/validate"
$TicketValidityPeriod = 10 * 60 * 60  # 10 hours in seconds

# Ensure config directory exists
if (-not (Test-Path $ConfigDir)) {
    New-Item -Path $ConfigDir -ItemType Directory -Force | Out-Null
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

# Check for required license key (env var takes precedence over config)
if (-not $env:LICENSE_KEY -and -not $Config["LICENSE_KEY"]) {
    Write-Error "LICENSE_KEY environment variable or config value in $TestEnvFile is not set."
    exit 1
}
$LICENSE_KEY = if ($env:LICENSE_KEY) { $env:LICENSE_KEY } else { $Config["LICENSE_KEY"] }

# Function to save config to test.env
function Save-Config {
    # Preserve existing keys and update/add LICENSE_KEY
    $Config["LICENSE_KEY"] = $LICENSE_KEY
    $envContent = $Config.GetEnumerator() | Sort-Object Name | ForEach-Object { "$($_.Name)=$($_.Value)" }
    $envContent | Out-File $TestEnvFile -Encoding utf8 -Force
    Write-Verbose "Saved config to $TestEnvFile"
}

# Function to check local ticket validity
function Test-TicketValidity {
    if (-not (Test-Path $TicketFile)) {
        Write-Warning "No existing ticket found at $TicketFile"
        return $false
    }

    $ticketJson = Get-Content $TicketFile -Raw | ConvertFrom-Json
    Write-Verbose "Ticket JSON: $($ticketJson | ConvertTo-Json -Compress)"

    # Access the ticket portion of the full ticket JSON
    $ticket = $ticketJson.ticket
    if (-not $ticket) {
        Write-Warning "Invalid ticket structure: 'ticket' property missing in $TicketFile. Ticket JSON: $($ticketJson | ConvertTo-Json -Compress)"
        return $false
    }

    $timeSlot = $ticket.ticketData.timeSlot
    if (-not $timeSlot) {
        Write-Warning "Invalid or missing timeSlot in $TicketFile. Ticket JSON: $($ticketJson | ConvertTo-Json -Compress)"
        return $false
    }

    $currentTime = [int](Get-Date -UFormat %s)
    $expirationTime = [int]$timeSlot + $TicketValidityPeriod
    $remainingSeconds = $expirationTime - $currentTime

    if ($currentTime -lt $expirationTime) {
        $remainingHours = [math]::Floor($remainingSeconds / 3600)
        $remainingMinutes = [math]::Floor(($remainingSeconds % 3600) / 60)
        Write-Host "Existing ticket is valid (expires in ${remainingHours}h ${remainingMinutes}m)" -ForegroundColor Green
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
    $payload = @{ certificateJson = $ticketJson } | ConvertTo-Json -Compress
    $response = Invoke-RestMethod -Uri $ValidateTicketEndpoint -Method Post -ContentType "application/json" -Body $payload
    $isValid = $response.isValid -eq $true
    if ($isValid) {
        Write-Host "Server confirmed: Ticket is valid" -ForegroundColor Green
        return $true
    } else {
        Write-Warning "Server response: Ticket is invalid. Response: $($response | ConvertTo-Json -Compress)"
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
        Write-Error "No vacant seat available. Response: $($response | ConvertTo-Json -Compress)"
        exit 1
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
        seatId   = $SeatId
        timeSlot = $timeSlot
        deviceId = $deviceId
        issuer   = "master"
    } | ConvertTo-Json -Compress
    $headers = @{ "Authorization" = "Bearer $LICENSE_KEY"; "Content-Type" = "application/json" }
    $response = Invoke-RestMethod -Uri $IssueTicketEndpoint -Method Post -Headers $headers -Body $payload
    if (-not $response) {
        Write-Error "Error issuing ticket. No response from server."
        exit 1
    }
    Write-Verbose "Full ticket response: $($response | ConvertTo-Json -Compress)"
    $ticket = $response.ticket
    if (-not $ticket) {
        Write-Error "Error issuing ticket. 'ticket' property missing in response: $($response | ConvertTo-Json -Compress)"
        exit 1
    }
    Write-Host "Ticket issued successfully" -ForegroundColor Green
    Write-Verbose "Issued ticket JSON: $($ticket | ConvertTo-Json -Compress)"
    return $ticket  # Return the full response to match ticket.json structure
}

# Function to register ticket as certificate
function Register-Certificate {
    param ([PSObject]$Ticket)
    Write-Host "Registering ticket as certificate..." -ForegroundColor Yellow
    # Use the full ticket JSON as the certificate, unchanged
    # Serialize and deserialize to ensure proper JSON structure
    $ticketJson = $Ticket | ConvertTo-Json -Depth 10 -Compress
    $ticketDeserialized = $ticketJson | ConvertFrom-Json
    $certificate = $ticketDeserialized
    $payload = @{ certificates = @($certificate) } | ConvertTo-Json -Depth 10 -Compress
    Write-Verbose "Register payload: $payload"
    $headers = @{ "Authorization" = "Bearer $LICENSE_KEY"; "Content-Type" = "application/json" }
    $response = Invoke-RestMethod -Uri $RegisterCertEndpoint -Method Post -Headers $headers -Body $payload
    if ($response.message -ne "Certificates registered successfully.") {
        Write-Error "Error registering certificate. Response: $($response | ConvertTo-Json -Depth 10 -Compress)"
        exit 1
    }
    Write-Host "Certificate registered successfully" -ForegroundColor Green
}

# Main logic
try {
    Write-Host "Certifying BrowserBox license..." -ForegroundColor Cyan
    $ticketValid = Test-TicketValidity

    if ($ForceLicense) {
        Write-Host "Force license mode: Checking license validity without overwriting valid ticket" -ForegroundColor Yellow
        $seatId = Get-VacantSeat
        $fullTicket = New-Ticket -SeatId $seatId
        if (-not $ticketValid) {
            # Save the full ticket response to match ticket.json structure
            $fullTicket | ConvertTo-Json -Compress | Set-Content $TicketFile -Force
            Register-Certificate -Ticket $fullTicket
            Write-Host "New ticket saved to $TicketFile" -ForegroundColor Green
        } else {
            Write-Host "License is valid, keeping existing valid ticket" -ForegroundColor Green
        }
    } else {
        if ($ticketValid) {
            Write-Host "Using existing valid ticket" -ForegroundColor Green
        } else {
            $seatId = Get-VacantSeat
            $fullTicket = New-Ticket -SeatId $seatId
            $fullTicket | ConvertTo-Json -Compress | Set-Content $TicketFile -Force
            Register-Certificate -Ticket $fullTicket
            Write-Host "New ticket saved to $TicketFile" -ForegroundColor Green
        }
    }

    # Save the license key to test.env
    Save-Config
    Write-Host "Certification complete." -ForegroundColor Green
} catch {
    Write-Error "An error occurred during certification: $_"
    exit 1
}
