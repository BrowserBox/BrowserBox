param (
  [Parameter(Mandatory = $true)]
  [string]$UserPassword
)

# Flow
{}

  $Main = {
    Ensure-Admin
    Integrate-TightVNCWithRDPLoopback -password $UserPassword
    RunPasswordEntryFunctionInNewWindow -password $UserPassword 
    Start-TightVNCViewer
    Start-Sleep 5
    RedirectMainSessionToConsole
  }

# Funcs
{}

  function Ensure-Admin {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    $isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

    if (-not $isAdmin) {
      # Restart the script with administrative privileges
      $scriptWithArgs = "-File `"{0}`" {1}" -f $($MyInvocation.ScriptName), $args
      Start-Process PowerShell -ArgumentList $scriptWithArgs -Verb RunAs
      exit
    }
  }

  function Start-TightVNCViewer {
    $localComputerName = "localhost" 
    $vncViewerPath = "$env:ProgramFiles\TightVNC\tvnviewer.exe"

    if (Test-Path $vncViewerPath) {
      Write-Output "Starting TightVNC Viewer for a local test..."
      Start-Process $vncViewerPath -ArgumentList "$localComputerName::5900" 
      Write-Output "TightVNC Viewer test completed"
    }
    else {
      Write-Error "TightVNC Viewer is not installed."
    }
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

  function RefreshPath {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
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

  function Install-TightVNC {
    param (
      [string]$downloadUrl = "https://www.tightvnc.com/download/2.8.81/tightvnc-2.8.81-gpl-setup-64bit.msi",
      [string]$installerPath = "$env:TEMP\tightvnc-setup.msi",
      [string]$password = "YourPassword" # Replace with your desired password
    )

    # Download TightVNC Installer
    Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath
    Write-Output "TightVNC Installer downloaded"

    # Install TightVNC Silently
    Start-Process "msiexec.exe" -ArgumentList "/i `"$installerPath`" /quiet /norestart ADDLOCAL=`"Server,Viewer`" SET_USEVNCAUTHENTICATION=1 VALUE_OF_USEVNCAUTHENTICATION=1 SET_PASSWORD=1 VALUE_OF_PASSWORD=`"$UserPassword`" SET_ALLOWLOOPBACK=1 VALUE_OF_ALLOWLOOPBACK=1" -Wait
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

  function Integrate-TightVNCWithRDPLoopback {
    param (
      [string]$password
    )
    EstablishRDPLoopback -pword $password
    Install-TightVNC -password $password
  }

  function RunPasswordEntryFunctionInNewWindow {
    # Get the function definition as a string
    $functionToRun = $Function:BeginVNCPasswordPromptLoop.ToString()

    # Script content to write to file
    $scriptContent = @"
$functionToRun

# Call the function
BeginVNCPasswordPromptLoop

# Delete this script file once done
Remove-Item -LiteralPath `"$($MyInvocation.ScriptName)`" -Force
"@

    # Write the script content to a file
    $scriptPath = ".\AutoEnterVNCPassword.ps1"
    $scriptContent | Out-File -FilePath $scriptPath -Encoding UTF8

    # Run the script in a new PowerShell window
    Start-Process PowerShell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`"" -WindowStyle Hidden
  }

  function RedirectMainSessionToConsole {
    $desktopPath = [System.Environment]::GetFolderPath("Desktop")
    $batchFilePath = Join-Path $desktopPath "RedirectToConsole.bat"

    # Get the session ID of the main RDP session (the one marked with '>')
    $sessionId = qwinsta | Select-String "^>rdp-tcp#" | ForEach-Object {
      if ($_ -match "\s+(\d+)\s+rdp-tcp#") {
        return $matches[1]
      }
    }

    if (-not $sessionId) {
      Write-Error "Main RDP session ID not found."
      return
    }

    # Create the batch script with a parameter placeholder
    $batchScriptContent = @"
echo off
tscon %1 /dest:console
"@
    $batchScriptContent | Out-File -FilePath $batchFilePath

    # Execute the batch script as Administrator with the session ID as an argument
    Start-Process "cmd.exe" -ArgumentList "/c $batchFilePath $sessionId" -Verb RunAs
  }

  function BeginVNCPasswordPromptLoop {
    param (
      [string]$password
    )

    $myshell = New-Object -com "Wscript.Shell"
    while ($true) {
      Start-Sleep -Seconds 2
      if ($myshell.AppActivate("TightVNC Authentication")) { # Replace with the exact window title
        $myshell.SendKeys($password)
        $myshell.SendKeys("{ENTER}")

        # Wait a bit for the action to be processed
        Start-Sleep -Seconds 2

        # Check if the window is still active; if not, break the loop
        if (-not $myshell.AppActivate("TightVNC Authentication")) {
          break
        }
      }
    }
  }

# Executor 
{}

  try {
    & $Main
    Write-Output "TightVNC and RDP setup complete."
  }
  catch {
    Write-Output "An error occurred: $_"
    $Error[0] | Format-List -Force
  }
  finally {
    Write-Output "Exiting..."
  }


