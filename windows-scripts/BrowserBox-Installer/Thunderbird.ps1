  param (
    [Parameter(Mandatory = $true)]
    [string]$scriptUrlOrPath,
    [Parameter(Mandatory = $true)]
    [string]$rdpPassword,
    [string]$shell = "powershell.exe"
  )

  function ValidateArguments {
    param (
      [string]$scriptUrlOrPath,
      [string]$rdpPassword
    )
    if (-not $scriptUrlOrPath -or -not $rdpPassword) {
      Write-Host "Missing arguments. Please provide a script URL/path and RDP password."
      exit
    }
    return $true
  }

  function CheckAdminPermissions {
    $scriptPath = $($MyInvocation.ScriptName)
    if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
      Start-Process "$shell"  -Verb RunAs -ArgumentList "-File `"$scriptPath`" `"$scriptUrlOrPath`" `"$rdpPassword`" `"$shell`""
      exit
    }
  }

  function DownloadOrCopyScript {
    param (
      [string]$scriptUrlOrPath,
      [string]$destinationPath
    )
    if ($scriptUrlOrPath -like "http*") {
      Invoke-WebRequest -Uri $scriptUrlOrPath -OutFile $destinationPath
    } elseif ($scriptUrlOrPath -cne $destinationPath) {
      Copy-Item -Path $scriptUrlOrPath -Destination $destinationPath -Force
    } else {
      Write-Error "Could not copy $scriptUrlOrPath to $destinationPath"
    }
  }

  function SetLogonScript {
    Write-Host "Establishing logon script"
    $regPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
    $scriptPath = $($MyInvocation.ScriptName)
    $command = "$shell -File `"$scriptPath`" -scriptUrlOrPath `"$scriptUrlOrPath`" -rdpPassword `"$rdpPassword`" -shell $shell"
    Set-ItemProperty -Path $regPath -Name "Thunderbird-SoundBridge" -Value $command
  }

  function WriteStateFile {
    param (
      [string]$stateName
    )
    $stateDirectory = "$env:USERPROFILE\StateDirectory"
    
    # Check if the state directory exists, if not, create it
    if (-not (Test-Path -Path $stateDirectory)) {
      New-Item -Path $stateDirectory -ItemType Directory
    }

    $stateFilePath = Join-Path $stateDirectory "$stateName.state"
    $timestamp = Get-Date -Format "o"
    Set-Content -Path $stateFilePath -Value $timestamp
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
      mstsc /v:$localComputerName /w:640 /h:480
      Start-Sleep -Seconds 5 # Wait a bit for mstsc to possibly initiate

      # Get the list of sessions, excluding the current one
      $rdpSessions = qwinsta /SERVER:$localComputerName | Where-Object { $_ -notmatch "^\s*$" -and $_ -notmatch "^>" -and $_ -match "\brdp-tcp\b" }        
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
      [string]$Password
    )
    Write-Output "Establishing RDP Loopback for Windows Audio solution..."
    Trust-RDPCertificate
    SetupRDP -MaxConnections 10
    InitiateLocalRDPSession -Password $Password
  }

  function InitiateLocalRDPSession {
      param (
        [Parameter(Mandatory = $true)]
        [string]$Password,
        [int]$retryCount = 30,
        [int]$retryInterval = 5
      )

      $username = $env:USERNAME
      $localComputerName = [System.Environment]::MachineName

      cmdkey /generic:TERMSRV/$localComputerName /user:$username /pass:$Password
      Write-Output "Credentials Stored for RDP."

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

  function Start-TightVNCViewer {
    param (
      [Parameter(Mandatory = $true)]
      [string]$Password
    )
    
    $localComputerName = "localhost" 
    $vncViewerPath = "$env:ProgramFiles\TightVNC\tvnviewer.exe"

    if (Test-Path $vncViewerPath) {
      Write-Output "Starting TightVNC Viewer for a local test..."
      Start-Process $vncViewerPath -ArgumentList "$localComputerName::5900 -password=$Password" 
      Write-Output "TightVNC Viewer test completed"
    }
    else {
      Write-Error "TightVNC Viewer is not installed."
    }
  }

  function ExecuteProvidedScript {
    param (
      [string]$scriptPath
    )
    # Execute the script
    Start-Process "$shell" -ArgumentList "-File `"$scriptPath`""
  }

  function Install-TightVNC {
    param (
      [string]$downloadUrl = "https://www.tightvnc.com/download/2.8.81/tightvnc-2.8.81-gpl-setup-64bit.msi",
      [string]$installerPath = "$env:TEMP\tightvnc-setup.msi",
      [Parameter(Mandatory = $true)]
      [string]$Password
    )

    # Download TightVNC Installer
    Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath
    Write-Output "TightVNC Installer downloaded"

    # Install TightVNC Silently
    Start-Process "msiexec.exe" -ArgumentList "/i `"$installerPath`" /quiet /norestart ADDLOCAL=`"Server,Viewer`" SET_USEVNCAUTHENTICATION=1 VALUE_OF_USEVNCAUTHENTICATION=1 SET_PASSWORD=1 VALUE_OF_PASSWORD=`"$Password`" SET_ALLOWLOOPBACK=1 VALUE_OF_ALLOWLOOPBACK=1" -Wait
    Write-Output "TightVNC Installed"

    # Set TightVNC Password
    Add-ToSystemPath "$env:ProgramFiles\TightVNC"
    RefreshPath

    $installArgs = "-install -silent"
    $startArgs = "-start -silent"
    Start-Process "tvnserver.exe" -ArgumentList $installArgs -Wait
    Start-Process "tvnserver.exe" -ArgumentList $startArgs -Wait
    Write-Output "TightVNC setup"

    # Modify TightVNC Settings for RDP
    Set-ItemProperty -Path "HKLM:\SOFTWARE\TightVNC\Server" -Name "ConnectToRdpSession" -Value 1
    Write-Output "TightVNC configured to connect to RDP session"
  }

  function Add-ToSystemPath {
    param ([string]$pathToAdd)
    $currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::Machine)
    if (-not $currentPath.Contains($pathToAdd)) {
      $newPath = $currentPath + ";" + $pathToAdd
      [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::Machine)
      Write-Output "Added $pathToAdd to system PATH."
    }
    else {
      Write-Output "$pathToAdd is already in system PATH."
    }
  }

  function RefreshPath {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
  }

  function EstablishVNCLoopback {
    param (
      [string]$Password
    )

    Install-TightVNC -Password $Password
    Start-TightVNCViewer -Password $Password
  }

  function ExecuteTsconRedirection {
    $qwinstaOutput = qwinsta
    $currentSessionId = $qwinstaOutput | Where-Object { $_ -match "^>.*rdp-tcp" } | ForEach-Object { ($_ -split "\s+")[2] }
    if ($currentSessionId) {
      tscon $currentSessionId /dest:console
    }
  }

  function WaitForState {
    param (
      [string]$stateName,
      [int]$timeoutSeconds = 480
    )
    $stateDirectory = "$env:USERPROFILE\StateDirectory"
    $endTime = (Get-Date).AddSeconds($timeoutSeconds)

    Write-Output "Waiting for state '$stateName'..."
    while ((Get-Date) -lt $endTime) {
      $stateFilePath = Join-Path $stateDirectory "$stateName.state"
      if (Test-Path $stateFilePath) {
        Write-Output "State '$stateName' reached."
        return
      }
      Start-Sleep -Seconds 5
    }

    Write-Error "Timeout reached. State '$stateName' not found."
  }

  function RestartSelf {
    $scriptPath = $($MyInvocation.ScriptName)
    Write-Output "Restarting script..."
    Start-Process "$shell" -ArgumentList "-File `"$scriptPath`" -scriptUrlOrPath `"$scriptUrlOrPath`" -rdpPassword `"$rdpPassword`" -shell `"$shell`""
    exit
  }

  # Main Script Block
  if (-not (ValidateArguments -scriptUrlOrPath $scriptUrlOrPath -rdpPassword $rdpPassword)) {
    Write-Error "Need to supply script to run after audio setup and rdp password"
    exit
  }
  CheckAdminPermissions

    $currentState = Get-ChildItem -Path "$env:USERPROFILE\StateDirectory" -Filter "*.state" | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty BaseName

  if ( $currentState -eq $nil ) {
   WriteStateFile -stateName "InitialState"
   $currentState="InitialState"
  }

  Write-Host "Current state: $currentState"

  switch ($currentState) {
    "InitialState" {
      DownloadOrCopyScript -scriptUrlOrPath $scriptUrlOrPath -destinationPath "$env:USERPROFILE\Desktop\ProvidedScript.ps1"
      SetLogonScript 
      EnsureWindowsAudioService
      WriteStateFile -stateName "LoopbackConnectionsEstablished"
      EstablishRDPLoopback -Password $rdpPassword
      EstablishVNCLoopback -Password $rdpPassword
      WaitForState -stateName "ProvidedScriptRunning"
      RestartSelf 
    }
    "LoopbackConnectionsEstablished" {
      ExecuteProvidedScript -scriptPath "$env:USERPROFILE\Desktop\ProvidedScript.ps1"
      Start-Sleep -seconds 5
      WriteStateFile -stateName "ProvidedScriptRunning"
    }
    "ProvidedScriptRunning" {
      Start-Sleep -Seconds 5
      ExecuteTsconRedirection
      WriteStateFile -stateName "TsconExecutionCompleted"
    }
    "TsconExecutionCompleted" {
      # Additional actions if required
      Write-Output "Process is completed. Audio should persist"
    }
    default {
      Write-Host "Unknown state. Exiting."
      exit
    }
  }

