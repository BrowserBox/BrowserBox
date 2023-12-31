# it's worth noting that while Remote Sound Device from remote desktop works well, 
# there is distortion on some sounds, for instance:
# https://www.youtube.com/watch?v=v0wVRG38IYs

# Main Script Execution
param (
  [string]$password
)

function Trust-RDPCertificate {
  $userHome = [System.Environment]::GetFolderPath('UserProfile')
  $certFolder = Join-Path -Path $userHome -ChildPath "RDP_Certificates"
  $certPath = Join-Path -Path $certFolder -ChildPath "rdp_certificate.cer"

  # Create the certificate folder if it does not exist
  if (-not (Test-Path $certFolder)) {
    New-Item -Path $certFolder -ItemType Directory
  }

  # Export the RDP Certificate
  $rdpCert = Get-ChildItem -Path Cert:\LocalMachine\"Remote Desktop" | Select-Object -First 1
  if ($rdpCert -ne $null) {
    Export-Certificate -Cert $rdpCert -FilePath $certPath
    Write-Host "Certificate exported to $certPath"
  } else {
    Write-Error "RDP Certificate not found."
    return
  }

  # Import the Certificate into the Trusted Store
  if (Test-Path $certPath) {
    try {
      $certStore = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "LocalMachine")
      $certStore.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
      $certStore.Add([System.Security.Cryptography.X509Certificates.X509Certificate2]::CreateFromCertFile($certPath))
      $certStore.Close()
      Write-Host "Certificate added to the Trusted Root Certification Authorities store."
    } catch {
      Write-Error "An error occurred while importing the certificate."
    }
  } else {
    Write-Error "Exported certificate file not found."
  }
}

function EnsureWindowsAudioService {
  $audioService = Get-Service -Name 'Audiosrv'

  # Set service to start automatically
  Set-Service -Name 'Audiosrv' -StartupType Automatic
  Write-Host "Windows Audio service set to start automatically"

  # Start the service if it's not running
  if ($audioService.Status -ne 'Running') {
    Start-Service -Name 'Audiosrv'
    Write-Host "Windows Audio service started"
  } else {
    Write-Host "Windows Audio service is already running"
  }
}

function IsAdmin {
  $currentUser = New-Object Security.Principal.WindowsPrincipal $([Security.Principal.WindowsIdentity]::GetCurrent())
  $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function SetupRDP {
  Param (
    [int]$MaxConnections = 10
  )

  $rdpStatus = Get-ItemProperty 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -Name "fDenyTSConnections"
  if ($rdpStatus.fDenyTSConnections -eq 1) {
    Set-ItemProperty 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -Name "fDenyTSConnections" -Value 0
    Enable-NetFirewallRule -DisplayGroup "Remote Desktop"
    Write-Host "RDP Enabled"
  }

  Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -Name "MaxConnectionAllowed" -Value $MaxConnections
  Set-ItemProperty -Path "HKLM:\System\CurrentControlSet\Control\Terminal Server" -Name "fSingleSessionPerUser" -Value 0
  Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\Terminal Services" -Name "MaxConnectionCount" -Value 999

  Write-Host "Max RDP Connections set to $MaxConnections"

}

function WaitForRDPServiceToBe {
  param (
    [Parameter(Mandatory=$true)]
    [string]$status
  )

  $maxWaitTime = 60 # maximum wait time in seconds
  $waitInterval = 5 # interval to check the service status in seconds

  for ($i = 0; $i -lt $maxWaitTime; $i += $waitInterval) {
    $currentStatus = Get-Service -Name TermService | Select-Object -ExpandProperty Status
    if ($currentStatus -eq $status) {
      Write-Host "Remote Desktop Services is $status."
      return $true
    } else {
      Write-Host "Waiting for Remote Desktop Services to be $status..."
      Start-Sleep -Seconds $waitInterval
    }
  }
  Write-Error "Timeout: Remote Desktop Services did not reach the status '$status' within the expected time."
  return $false
}


function InitiateLocalRDPSession {
  param (
    [string]$password,
    [int]$retryCount = 30,
    [int]$retryInterval = 5
  )

  $username = $env:USERNAME
  $localComputerName = [System.Environment]::MachineName

  cmdkey /generic:TERMSRV/$localComputerName /user:$username /pass:$password
  Write-Host "Credentials Stored for RDP"

  for ($i = 0; $i -lt $retryCount; $i++) {
    mstsc /v:$localComputerName
    Start-Sleep -Seconds 5 # Wait a bit for mstsc to possibly initiate

    # Get the list of sessions, excluding the current one
    $rdpSessions = qwinsta /SERVER:$localComputerName | Where-Object { $_ -notmatch "^>" -and $_ -match "\brdp-tcp\b" } 
    $activeSession = $rdpSessions | Select-String $username

    if ($activeSession) {
      Write-Host "RDP Session initiated successfully."
      return
    } else {
      Write-Host "RDP Session failed to initiate. Retrying in $retryInterval seconds..."
      Start-Sleep -Seconds $retryInterval
    }
  }

  Write-Error "Failed to initiate RDP Session after $retryCount attempts."
}



if (-not (IsAdmin)) {
  Write-Error "This script must be run as an Administrator. Please rerun the script with administrative privileges."
  exit
}

if ([string]::IsNullOrWhiteSpace($password)) {
  Write-Error "A password must be provided."
  exit
}

EnsureWindowsAudioService
Trust-RDPCertificate
SetupRDP -MaxConnections 10
echo "Login Link" | clip
#Stop-Service -Name TermService -Force -PassThru
#WaitForRDPServiceToBe -status "Stopped"
#Start-Service -Name TermService -Force -PassThru
#WaitForRDPServiceToBe -status "Running"
#Restart-Service -Name TermService -Force
#Write-Host "Remote Desktop Services Restarted"
InitiateLocalRDPSession -password $password

Write-Host "Operation Completed."



