param (
  [Parameter(Mandatory = $true)]
  [string]$UserPassword
)

  $Main = {
    EstablishRDPLoopback -pword $UserPassword 
  }

  function EnsureWindowsAudioService {
    $audioService = Get-Service -Name 'Audiosrv'

    # Set service to start automatically
    Set-Service -Name 'Audiosrv' -StartupType Automatic
    Write-Output "Windows Audio service set to start automatically"

    # Start the service if it's not running
    if ($audioService.Status -ne 'Running') {
      Start-Service -Name 'Audiosrv'
      Write-Output "Windows Audio service started"
    }
    else {
      Write-Output "Windows Audio service is already running"
    }
  }

  function SetupRDP {
    Param (
      [int]$MaxConnections = 10
    )

    $rdpStatus = Get-ItemProperty 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -Name "fDenyTSConnections"
    if ($rdpStatus.fDenyTSConnections -eq 1) {
      Set-ItemProperty 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -Name "fDenyTSConnections" -Value 0
      Enable-NetFirewallRule -DisplayGroup "Remote Desktop"
      Write-Output "RDP Enabled"
    }

    Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -Name "MaxConnectionAllowed" -Value $MaxConnections
    Set-ItemProperty -Path "HKLM:\System\CurrentControlSet\Control\Terminal Server" -Name "fSingleSessionPerUser" -Value 0
    Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\Terminal Services" -Name "MaxConnectionCount" -Value 999

    Write-Output "Max RDP Connections set to $MaxConnections"
  }

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
      Write-Output "Certificate exported to $certPath"
    }
    else {
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
        Write-Output "Certificate added to the Trusted Root Certification Authorities store."
      }
      catch {
        Write-Error "An error occurred while importing the certificate."
      }
    }
    else {
      Write-Error "Exported certificate file not found."
    }
  }

  function InitiateLocalRDPSession {
    param (
      [string]$Password,
      [int]$retryCount = 30,
      [int]$retryInterval = 5
    )

    $username = $env:USERNAME
    $localComputerName = [System.Environment]::MachineName

    cmdkey /generic:TERMSRV/$localComputerName /user:$username /pass:$Password
    Write-Output "Credentials Stored for RDP. Password: $Password"

    for ($i = 0; $i -lt $retryCount; $i++) {
      mstsc /v:$localComputerName
      Start-Sleep -Seconds 5 # Wait a bit for mstsc to possibly initiate

      # Get the list of sessions, excluding the current one
      $rdpSessions = qwinsta /SERVER:$localComputerName | Where-Object { $_ -notmatch "^>" -and $_ -match "\brdp-tcp\b" }
      $activeSession = $rdpSessions | Select-String $username

      if ($activeSession) {
        Write-Output "RDP Session initiated successfully."
        return
      }
      else {
        Write-Output "RDP Session failed to initiate. Retrying in $retryInterval seconds..."
        Start-Sleep -Seconds $retryInterval
      }
    }

    Write-Error "Failed to initiate RDP Session after $retryCount attempts."
  }

  function EstablishRDPLoopback {
    param (
      [string]$pword
    )
    Write-Output "Establishing RDP Loopback for Windows Audio solution..."
    EnsureWindowsAudioService
    Trust-RDPCertificate
    SetupRDP -MaxConnections 10
    InitiateLocalRDPSession -Password $pword
    Write-Output "RDP Loopback created. Audio will persist."
  }

  try {
    & $Main
  }
  catch {
    Write-Output "An error occurred: $_"
    $Error[0] | Format-List -Force
  }
  finally {
    Write-Output "Exiting..."
  }
