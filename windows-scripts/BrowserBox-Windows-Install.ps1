param (
  [Parameter(Mandatory = $true)]
  [string]$UserPassword
)

$CloseJob = $null

$Outer = {
  try {
    if (-not ([System.Management.Automation.PSTypeName]'BBInstallerWindowManagement').Type) {
      Add-Type -AssemblyName System.Windows.Forms;
      Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  public class BBInstallerWindowManagement {
    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
  }
"@
    }
    $hwnd = (Get-Process -Id $pid).MainWindowHandle

    # Get the screen width and window width
    $screenWidth = [System.Windows.Forms.SystemInformation]::VirtualScreen.Width
    $windowWidth = 555  # Assuming this is your current window width

    # Calculate the X coordinate
    $xCoordinate = $screenWidth - $windowWidth

    # Set the window position: X, Y, Width, Height
    [BBInstallerWindowManagement]::SetWindowPos($hwnd, [IntPtr]::new(-1), $xCoordinate, 0, $windowWidth, 555, 0x0040)
  }
  catch {
    Write-Information "An error occurred during window management: $_"
  }
  finally {
    Write-Information "Continuing..."
  }

  # Set the title of the PowerShell window
  $Host.UI.RawUI.WindowTitle = "BrowserBox Windows Edition Installer"

  # Main script flow
  $Main = {
    Guard-CheckAndSaveUserAgreement

    Write-Information "Running PowerShell version: $($PSVersionTable.PSVersion)"

    # Disabling the progress bar
    $ProgressPreference = 'SilentlyContinue'

    CheckForPowerShellCore
    EnsureRunningAsAdministrator
    RemoveAnyRestartScript

    Write-Information "Installing preliminairies..."

    EnhancePackageManagers

    $currentVersion = CheckWingetVersion
    UpdateWingetIfNeeded $currentVersion
    UpdatePowerShell

    InstallMSVC

    EnableWindowsAudio
    InstallGoogleChrome

    InstallIfNeeded "jq" "jqlang.jq"
    InstallIfNeeded "vim" "vim.vim"
    AddVimToPath
    InstallIfNeeded "git" "Git.Git"

    InstallFmedia
    InstallAndLoadNvm

    nvm install latest
    nvm use latest

    Write-Information "Setting up certificate..."
    BeginSecurityWarningAcceptLoop
    InstallMkcertAndSetup
    EndSecurityWarningAcceptLoop

    Write-Information "Installing BrowserBox..."

    Set-Location $HOME
    Write-Information $PWD
    git config --global core.symlinks true
    git clone https://github.com/BrowserBox/BrowserBox.git

    Set-Location BrowserBox
    git checkout windows-install
    git pull

    Write-Information "Cleaning non-Windows detritus..."
    npm run clean
    Write-Information "Installing dependencies..."
    npm i
    Write-Information "Building client..."
    npm run parcel

    Write-Information "Full install completed."
    Write-Information "Starting BrowserBox..."
    $loginLink = ./deploy-scripts/_setup_bbpro.ps1 -p 9999

    EstablishRDPLoopback -pword $UserPassword
    npm test

    Write-Output $loginLink | clip
    Write-Output $loginLink
  }

  # Function Definitions
  # it's worth noting that while Remote Sound Device from remote desktop works well,
  # there is distortion on some sounds, for instance
  # https://www.youtube.com/watch?v=v0wVRG38IYs
  #

  function Guard-CheckAndSaveUserAgreement {
    $configDir = Join-Path $env:USERPROFILE ".config\dosyago\bbpro"
    $agreementFile = Join-Path $configDir "user_agreement.txt"

    # Check if the agreement file already exists and contains the agreement
    if (Test-Path $agreementFile) {
      $agreementData = Get-Content $agreementFile
      if ($agreementData -match "Agreed") {
        return
      }
    }

    # Show user agreement dialog
    try {
      $dialogResult = Show-UserAgreementDialog
      if ($dialogResult -ne [System.Windows.Forms.DialogResult]::Yes) {
        Write-Information 'You must agree to the terms and conditions to proceed.'
        Exit
      }
    }
    catch {
      $userInput = Read-Host "Do you agree to the terms? (Yes/No)"
      if ($userInput -ne 'Yes') {
        Write-Information 'You must agree to the terms and conditions to proceed.'
        Exit
      }
    }

    # Save the user's agreement
    if (!(Test-Path $configDir)) {
      New-Item -Path $configDir -ItemType Directory -Force
    }
    $userName = [Environment]::UserName
    $dateTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$userName,$dateTime,Agreed" | Out-File $agreementFile
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
      Write-Information "Certificate exported to $certPath"
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
        Write-Information "Certificate added to the Trusted Root Certification Authorities store."
      }
      catch {
        Write-Error "An error occurred while importing the certificate."
      }
    }
    else {
      Write-Error "Exported certificate file not found."
    }
  }

  function EnsureWindowsAudioService {
    $audioService = Get-Service -Name 'Audiosrv'

    # Set service to start automatically
    Set-Service -Name 'Audiosrv' -StartupType Automatic
    Write-Information "Windows Audio service set to start automatically"

    # Start the service if it's not running
    if ($audioService.Status -ne 'Running') {
      Start-Service -Name 'Audiosrv'
      Write-Information "Windows Audio service started"
    }
    else {
      Write-Information "Windows Audio service is already running"
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
      Write-Information "RDP Enabled"
    }

    Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -Name "MaxConnectionAllowed" -Value $MaxConnections
    Set-ItemProperty -Path "HKLM:\System\CurrentControlSet\Control\Terminal Server" -Name "fSingleSessionPerUser" -Value 0
    Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\Terminal Services" -Name "MaxConnectionCount" -Value 999

    Write-Information "Max RDP Connections set to $MaxConnections"
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
    Write-Information "Credentials Stored for RDP. Password: $Password"

    for ($i = 0; $i -lt $retryCount; $i++) {
      mstsc /v:$localComputerName
      Start-Sleep -Seconds 5 # Wait a bit for mstsc to possibly initiate

      # Get the list of sessions, excluding the current one
      $rdpSessions = qwinsta /SERVER:$localComputerName | Where-Object { $_ -notmatch "^>" -and $_ -match "\brdp-tcp\b" }
      $activeSession = $rdpSessions | Select-String $username

      if ($activeSession) {
        Write-Information "RDP Session initiated successfully."
        return
      }
      else {
        Write-Information "RDP Session failed to initiate. Retrying in $retryInterval seconds..."
        Start-Sleep -Seconds $retryInterval
      }
    }

    Write-Error "Failed to initiate RDP Session after $retryCount attempts."
  }

  function EstablishRDPLoopback {
    param (
      [string]$pword
    )
    Write-Information "Establishing RDP Loopback for Windows Audio solution..."
    EnsureWindowsAudioService
    Trust-RDPCertificate
    SetupRDP -MaxConnections 10
    InitiateLocalRDPSession -Password $pword
    Write-Information "RDP Loopback created. Audio will persist."
  }

  function RemoveAnyRestartScript {
    $homePath = $HOME
    $cmdScriptPath = Join-Path -Path $homePath -ChildPath "restart_ps.cmd"

    # Check if the CMD script exists. If it does, delete it and return (this is the restart phase)
    if (Test-Path -Path $cmdScriptPath) {
      Remove-Item -Path $cmdScriptPath
    }
  }

	function PatchNvmPath {
	  $additionalPaths = @(
	    "$env:NVM_HOME",
	    "$env:NVM_SYMLINK",
	    "$env:LOCALAPPDATA\Microsoft\WindowsApps",
	    "$env:LOCALAPPDATA\Microsoft\WinGet\Links",
	    "$env:APPDATA\nvm"
	  )

	  # Program Files directories
	  $programFilesPaths = @(
	    $env:ProgramFiles,
	    "$env:ProgramFiles(x86)",
	    $env:ProgramW6432
	  ) | Select-Object -Unique

	  foreach ($path in $programFilesPaths) {
	    $nodeJsPath = Join-Path $path "nodejs"
	    if (Test-Path $nodeJsPath) {
	      $additionalPaths += $nodeJsPath
	    }
	  }

	  # Add paths to PATH environment variable, avoiding duplicates
	  $currentPath = $env:PATH.Split(';')
	  $newPath = $currentPath + $additionalPaths | Select-Object -Unique
	  $env:PATH = $newPath -join ";"
	}

  function BeginSecurityWarningAcceptLoop {
    $myshell = New-Object -com "Wscript.Shell"
    $loop = {
      while ($true) {
        sleep 2
        $myshell.AppActivate("Security Warning")
        $myshell.SendKeys("y")
      }
    }
    $script:CloseJob = Start-Job -ScriptBlock $loop
  }

  function EndSecurityWarningAcceptLoop {
    Stop-Job -Job $script:CloseJob
  }

  function EnableWindowsAudio {
    Write-Information "Enabling windows audio service..."

    try {
      Set-Service -Name Audiosrv -StartupType Automatic
      Start-Service -Name Audiosrv
    }
    catch {
      Write-Information "Error when attempting to enable Windows Audio service: $_"
    }

    try {
      Get-PnpDevice | Where-Object { $_.Class -eq 'AudioEndpoint' } | Select-Object Status, Class, FriendlyName
    }
    catch {
      Write-Information "Error when attempting to list sound devices: $_"
    }

    Write-Information "Completed audio service startup attempt."
  }

  function InstallFmedia {
    $url = "https://github.com/stsaz/fmedia/releases/download/v1.31/fmedia-1.31-windows-x64.zip"
    $outputDir = Join-Path $env:ProgramFiles "fmedia"
    $zipPath = Join-Path $env:TEMP "fmedia.zip"

    # Download the fmedia zip file
    Invoke-WebRequest -Uri $url -OutFile $zipPath

    # Create the output directory if it doesn't exist
    if (!(Test-Path $outputDir)) {
      New-Item -Path $outputDir -ItemType Directory
    }

    # Extract the zip file
    Expand-Archive -Path $zipPath -DestinationPath $env:TEMP -Force

    # Move the extracted files to the correct directory
    $extractedDir = Join-Path $env:TEMP "fmedia"
    Move-Item -Path "$extractedDir\*" -Destination $outputDir -Force

    # Install fmedia
    $fmediaExe = Join-Path $outputDir "fmedia.exe"
    Add-ToSystemPath $fmediaExe

    & $fmediaExe --install

    # Refresh environment variables in the current session
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "User")
  }

  function InstallPulseAudioForWindows {
    if (-not (Get-Command "pulseaudio.exe" -ErrorAction SilentlyContinue) ) {
      $pulseRelease = "https://github.com/pgaskin/pulseaudio-win32/releases/download/v5/pasetup.exe"
      $destination = Join-Path -Path $env:TEMP -ChildPath "pasetup.exe"

      Write-Information "Downloading PulseAudio for Windows by Patrick Gaskin..."

      DownloadFile $pulseRelease $destination

      Write-Information "Downloaded. Installing PulseAudio for Windows by Patrick Gaskin..."

      Start-Process -FilePath $destination -ArgumentList '/install', '/silent', '/quiet', '/norestart' -Wait -NoNewWindow

      Write-Information "Installed PulseAudio for Windows by Patrick Gaskin"
      AddPulseAudioToPath
    }
    else {
      Write-Information "Pulseaudio is already installed"
    }
  }

  function UpdatePowerShell {
    if ($PSVersionTable.PSVersion.Major -ge 6) {
      Write-Information "Recent version of PowerShell already installed. Skipping..."
    }
    else {
      Write-Information "Upgrading PowerShell..."
      winget install -e --id Microsoft.PowerShell --accept-source-agreements
      RestartEnvironment
    }
  }

  function InstallGoogleChrome {
    $chrometest = Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe'

    if ($chrometest -eq $true) {
      Write-Information "Chrome is installed"
    }
    else {
      Write-Information "Chrome is not installed"
      $url = 'https://dl.google.com/tag/s/dl/chrome/install/googlechromestandaloneenterprise64.msi'
      $destination = Join-Path -Path $env:TEMP -ChildPath "googlechrome.msi"

      Write-Information "Downloading Google Chrome..."
      DownloadFile $url $destination

      Write-Information "Installing Google Chrome silently..."
      Start-Process -FilePath 'msiexec.exe' -ArgumentList "/i `"$destination`" /qn /norestart" -Wait -NoNewWindow

      Write-Information "Installation of Google Chrome completed."
    }
  }

  function DownloadFile {
    param (
      [string]$Url,
      [string]$Destination
    )
    $webClient = New-Object System.Net.WebClient
    $webClient.DownloadFile($Url, "$Destination")
  }

  function InstallMSVC {
    $url = 'https://aka.ms/vs/17/release/vc_redist.x64.exe'
    $destination = Join-Path -Path $env:TEMP -ChildPath "vc_redist.x64.exe"

    Write-Information "Downloading Microsoft Visual C++ Redistributable..."
    DownloadFile $url $destination

    Write-Information "Installing Microsoft Visual C++ Redistributable silently..."

    Start-Process -FilePath $destination -ArgumentList '/install', '/silent', '/quiet', '/norestart' -Wait -NoNewWindow

    Write-Information "Installation of Microsoft Visual C++ Redistributable completed."
  }

  function CheckMkcert {
    if (Get-Command mkcert -ErrorAction SilentlyContinue) {
      Write-Information "Mkcert is already installed."
      return $true
    }
    else {
      Write-Information "Mkcert is not installed."
      return $false
    }
  }

  function InstallMkcert {
    Write-Information "Installing mkcert..."
    try {
      $archMap = @{
        "0"  = "x86";
        "5"  = "arm";
        "6"  = "ia64";
        "9"  = "amd64";
        "12" = "arm64";
      }
      $cpuArch = (Get-CimInstance -ClassName Win32_Processor).Architecture
      $arch = $archMap["$cpuArch"]

      # Create the download URL
      $url = "https://dl.filippo.io/mkcert/latest?for=windows/$arch"

      # Download mkcert.exe to a temporary location
      $tempPath = [System.IO.Path]::GetTempFileName() + ".exe"
      Invoke-WebRequest -Uri $url -OutFile $tempPath -UseBasicParsing

      # Define a good location to place mkcert.exe (within the system PATH)
      $destPath = "C:\Windows\System32\mkcert.exe"

      # Move the downloaded file to the destination
      Move-Item -Path $tempPath -Destination $destPath -Force

      # Run mkcert.exe -install
      mkcert -install
    }
    catch {
      Write-Error "An error occurred while fetching the latest release: $_"
    }
  }

  function InstallMkcertAndSetup {
    if (-not (CheckMkcert)) {
      InstallMkcert
    }

    $sslCertsDir = "$HOME\sslcerts"
    if (-not (Test-Path $sslCertsDir)) {
      New-Item -ItemType Directory -Path $sslCertsDir
    }

    # Change directory to the SSL certificates directory
    Set-Location $sslCertsDir

    # Generate SSL certificates for localhost
    mkcert -key-file privkey.pem -cert-file fullchain.pem localhost 127.0.0.1 link.local
  }

  function CheckNvm {
    $nvmDirectory = Join-Path -Path $env:APPDATA -ChildPath "nvm"
    if (Test-Path $nvmDirectory) {
      Write-Information "NVM is already installed."
      return $true
    }
    else {
      Write-Information "NVM is not installed."
      return $false
    }
  }

  function EnhancePackageManagers {
    try {
      Install-PackageProvider -Name NuGet -MinimumVersion 2.8.5.201 -Force
      #Install-PackageProvider -Name NuGet -Force -Scope CurrentUser
      Import-PackageProvider -Name NuGet -Force
    }
    catch {
      Write-Information "Error installing NuGet provider: $_"
    }
    Set-PSRepository -Name PSGallery -InstallationPolicy Trusted
    try {
      Install-Module -Name PackageManagement -Repository PSGallery -Force
    }
    catch {
      Write-Information "Error installing PackageManagement provider: $_"
    }
    Install-Module -Name Microsoft.WinGet.Client
    try {
      Repair-WinGetPackageManager -AllUsers
    }
    catch {
      Write-Information "Could not repair WinGet ($_) will try to install instead."
    }
  }

  function RefreshPath {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
  }

  function InstallAndLoadNvm {
    if (-not (CheckNvm)) {
      Write-Information "NVM is not installed."
      InstallNvm
      RefreshPath
      PatchNvmPath
      #RestartEnvironment
      Write-Information "NVM has been installed and added to the path for the current session."
    }
    else {
      Write-Information "NVM is already installed"
    }
  }

  function RestartShell {
    Write-Information "Relaunching shell and running this script again..."
    $scriptPath = $($MyInvocation.ScriptName)
    $userPasswordArg = if ($UserPassword) { "-UserPassword `"$UserPassword`"" } else { "" }

    # Relaunch the script with administrative rights using the current PowerShell version
    $psExecutable = Join-Path -Path $PSHOME -ChildPath "powershell.exe"
    if ($PSVersionTable.PSVersion.Major -ge 6) {
      $psExecutable = Join-Path -Path $PSHOME -ChildPath "pwsh.exe"
    }

    $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" $userPasswordArg"

    (Start-Process $psExecutable -Verb RunAs -ArgumentList $arguments -PassThru)

    Exit
  }

  function RestartEnvironment {
    param (
      [string]$ScriptPath = $($MyInvocation.ScriptName)
    )

    RemoveAnyRestartScript

    $homePath = $HOME
    $cmdScriptPath = Join-Path -Path $homePath -ChildPath "restart_ps.cmd"
    $userPasswordArg = if ($UserPassword) { "-UserPassword `"$UserPassword`"" } else { "" }

    $cmdContent = @"
@echo off
echo Waiting for PowerShell to close...
timeout /t 4 /nobreak > NUL
start pwsh -NoExit -File "$ScriptPath" $userPasswordArg
timeout /t 2
"@
    Write-Information "Restarting at $cmdScriptPath with: $cmdContent"

    # Write the CMD script to disk
    $cmdContent | Set-Content -Path $cmdScriptPath

    # Launch the CMD script to restart PowerShell
    Write-Information "$cmdScriptPath"
    Start-Process "cmd.exe" -ArgumentList "/c `"$cmdScriptPath`""

    # (thoroughly) Exit the current PowerShell session
    taskkill /f /im "powershell.exe"
    taskkill /f /im "pwsh.exe"
    Exit
  }

  function Get-LatestReleaseDownloadUrl {
    param (
      [string]$userRepo = "coreybutler/nvm-windows"
    )

    try {
      $apiUrl = "https://api.github.com/repos/$userRepo/releases/latest"
      $latestRelease = Invoke-RestMethod -Uri $apiUrl
      $downloadUrl = $latestRelease.assets | Where-Object { $_.name -like "*.exe" } | Select-Object -ExpandProperty browser_download_url

      if ($downloadUrl) {
        return $downloadUrl
      }
      else {
        throw "Download URL not found."
      }
    }
    catch {
      Write-Error "An error occurred while fetching the latest release: $_"
    }
  }

  function InstallNvm {
    Write-Information "Installing NVM..."
    try {
      $latestNvmDownloadUrl = Get-LatestReleaseDownloadUrl
      Write-Information "Downloading NVM from $latestNvmDownloadUrl..."

      # Define the path for the downloaded installer
      $installerPath = Join-Path -Path $env:TEMP -ChildPath "nvm-setup.exe"

      # Download the installer
      DownloadFile $latestNvmDownloadUrl $installerPath

      # Execute the installer
      Write-Information "Running NVM installer..."
      Start-Process -FilePath $installerPath -ArgumentList '/install', '/silent', '/quiet', '/norestart', '/passive'  -Wait -NoNewWindow

      Write-Information "NVM installation completed."
    }
    catch {
      Write-Error "Failed to install NVM: $_"
    }
  }

  function CheckForPowerShellCore {
    $pwshPath = (Get-Command pwsh -ErrorAction SilentlyContinue).Source
    if ($null -ne $pwshPath) {
      if ($PSVersionTable.PSVersion.Major -eq 5) {
        Write-Information "Running with latest PowerShell version..."
        $scriptPath = $($MyInvocation.ScriptName)
        $userPasswordArg = if ($UserPassword) { "-UserPassword `"$UserPassword`"" } else { "" }
        Start-Process $pwshPath -ArgumentList "-NoProfile", "-File", "`"$scriptPath`" $userPasswordArg"
        Write-Information "Done"
        Exit
      }
    }
  }

  function EnsureRunningAsAdministrator {
    try {
      if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
        Write-Information "Not currently Administrator. Upgrading privileges..."
        # Get the current script path
        $scriptPath = $($MyInvocation.ScriptName)
        $userPasswordArg = if ($UserPassword) { "-UserPassword `"$UserPassword`"" } else { "" }

        # Relaunch the script with administrative rights using the current PowerShell version
        $psExecutable = Join-Path -Path $PSHOME -ChildPath "powershell.exe"
        if ($PSVersionTable.PSVersion.Major -ge 6) {
          $psExecutable = Join-Path -Path $PSHOME -ChildPath "pwsh.exe"
        }

        $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" $userPasswordArg"

        (Start-Process $psExecutable -Verb RunAs -ArgumentList $arguments -PassThru)

        Exit
      }
    }
    catch {
      Write-Information "An error occurred: $_"
    }
    finally {
      Write-Information "Continuing..."
    }
  }

  function Show-UserAgreementDialog {
    Add-Type -AssemblyName System.Windows.Forms

    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'BrowserBox User Agreement'
    $form.TopMost = $true
    $form.StartPosition = 'CenterScreen'
    $form.ClientSize = New-Object System.Drawing.Size(333, 185)

    $label = New-Object System.Windows.Forms.Label
    $label.Text = 'Do you agree to our terms and conditions?'
    $label.Width = 313  # Set the width to allow for text wrapping within the form width
    $label.Height = 130  # Adjust height as needed
    $label.Location = New-Object System.Drawing.Point(32, 32)  # Positioning the label
    $label.AutoSize = $true  # Disable AutoSize to enable word wrapping
    $label.MaximumSize = New-Object System.Drawing.Size($label.Width, 0)  # Allow dynamic height
    $label.TextAlign = 'TopLeft'
    #$label.WordWrap = $true
    $form.Controls.Add($label)

    $yesButton = New-Object System.Windows.Forms.Button
    $yesButton.Text = 'I Agree'
    $yesButton.DialogResult = [System.Windows.Forms.DialogResult]::Yes
    $yesButton.Location = New-Object System.Drawing.Point(173, 145)
    $form.Controls.Add($yesButton)

    $noButton = New-Object System.Windows.Forms.Button
    $noButton.Text = 'No'
    $noButton.DialogResult = [System.Windows.Forms.DialogResult]::No
    $noButton.Location = New-Object System.Drawing.Point(253, 145)
    $form.Controls.Add($noButton)

    return $form.ShowDialog()
  }

  function CheckWingetVersion {
    $currentVersion = & winget --version
    $currentVersion = $currentVersion -replace 'v', ''
    return $currentVersion
  }

  function UpdateWingetIfNeeded {
    param ([string]$currentVersion)
    $targetVersion = "1.6"

    if (-not (Is-VersionGreaterThan -currentVersion $currentVersion -targetVersion $targetVersion)) {
      Write-Information "Updating Winget to a newer version..."
      Invoke-WebRequest -Uri https://aka.ms/getwinget -OutFile winget.msixbundle
      Add-AppxPackage winget.msixbundle
      Remove-Item winget.msixbundle
    }
    else {
      Write-Information "Winget version ($currentVersion) is already greater than $targetVersion."
    }
  }

  function AddVimToPath {
    $vimPaths = @("C:\Program Files (x86)\Vim\vim*\vim.exe", "C:\Program Files\Vim\vim*\vim.exe")
    $vimExecutable = $null
    foreach ($path in $vimPaths) {
      $vimExecutable = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
      if ($vimExecutable -ne $null) {
        break
      }
    }

    if ($vimExecutable -ne $null) {
      $vimDirectory = [System.IO.Path]::GetDirectoryName($vimExecutable.FullName)
      Add-ToSystemPath $vimDirectory
    }
    else {
      Write-Warning "Vim executable not found. Please add Vim to the PATH manually."
    }
  }

  function AddPulseAudioToPath {
    $paPaths = @("C:\Program Files (x86)\PulseAudio\bin\pulseaudio.exe", "C:\Program Files\PulseAudio\bin\pulseaudio.exe")
    $paExecutable = $null
    foreach ($path in $paPaths) {
      $paExecutable = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
      if ($paExecutable -ne $null) {
        break
      }
    }

    if ($paExecutable -ne $null) {
      $paDirectory = [System.IO.Path]::GetDirectoryName($paExecutable.FullName)
      Add-ToSystemPath $paDirectory
    }
    else {
      Write-Warning "PulseAudio executable not found. Please add PulseAudio to the PATH manually."
    }
  }

  function Is-VersionGreaterThan {
    param (
      [string]$currentVersion,
      [string]$targetVersion
    )
    return [Version]$currentVersion -gt [Version]$targetVersion
  }

  function Install-PackageViaWinget {
    param ([string]$packageId)
    try {
      winget install -e --id $packageId --accept-source-agreements
      Write-Information "Successfully installed $packageId"
    }
    catch {
      Write-Error "Failed to install $packageId"
    }
  }

  function Add-ToSystemPath {
    param ([string]$pathToAdd)
    $currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::Machine)
    if (-not $currentPath.Contains($pathToAdd)) {
      $newPath = $currentPath + ";" + $pathToAdd
      [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::Machine)
      Write-Information "Added $pathToAdd to system PATH."
    }
    else {
      Write-Information "$pathToAdd is already in system PATH."
    }
  }

  function InstallIfNeeded {
    param (
      [string]$packageName,
      [string]$packageId
    )
    if (-not (Get-Command $packageName -ErrorAction SilentlyContinue)) {
      Install-PackageViaWinget $packageId
    }
    else {
      Write-Information "$packageName is already installed."
    }
  }

  Write-Information ""

  # Executor helper
  try {
    & $Main
  }
  catch {
    Write-Information "An error occurred: $_"
    $Error[0] | Format-List -Force
  }
  finally {
    Write-Information "Your login link will be in your clipboard once installation completed."
    Write-Information "Remember to also keep the inner RDP connection (on the RDP desktop) open to enable BrowserBox Audio"
    Write-Information "Exiting..."
  }
}

& $Outer



