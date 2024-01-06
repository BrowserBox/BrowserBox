# add arguments for -acceptTermsEmail <email@address> -hostname <bb host> that will also be passed through ($args)
# extend GUI to account for these which will not show if args are provided implying consent
# add wait for hostname to resolve function and console reminder to add A record
# if hostname resolves to a link local address ensure that it points at our machine. How? don't know. But can be done.
param (
  [string]$UserPassword,
  [string]$acceptTermsEmail,
  [string]$hostname
)

Write-Host "OK1"

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
    Write-Output "An error occurred during window management: $_"
  }
  finally {
    Write-Output "Continuing..."
  }

  # Set the title of the PowerShell window
  $Host.UI.RawUI.WindowTitle = "BrowserBox Windows Edition Installer"

  # Main script flow
  $Main = {
    Guard-CheckAndSaveUserAgreement ([ref]$acceptTermsEmail) ([ref]$hostname)

    Write-Host $acceptTermsEmail $hostname

    if (Validate-NonEmptyParameters -hostname $hostname -acceptTermsEmail $acceptTermsEmail) {
      Write-Output "Inputs look good. Proceeding..."
    }
    else {
      Show-Usage
      Exit
    }

    Write-Output "Running PowerShell version: $($PSVersionTable.PSVersion)"

    # Disabling the progress bar
    $ProgressPreference = 'SilentlyContinue'

    CheckForPowerShellCore
    EnsureRunningAsAdministrator
    RemoveAnyRestartScript

    Write-Output "Installing preliminairies..."

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

    nvm install node
    nvm use latest

    Write-Output "Setting up certificate..."
    if (Is-HostnameLinkLocal -hostname $hostname) {
      InstallCertbot

      OpenFirewallPort -Port 80
      RequestCertificate -Domain $hostname -TermsEmail $acceptTermsEmail
      PersistCerts -Domain $domain
    }
    else {
      RunCloserFunctionInNewWindow
      InstallMkcertAndSetup
    }

    Write-Output "Installing BrowserBox..."

    Set-Location $HOME
    Write-Output $PWD
    git config --global core.symlinks true
    git clone https://github.com/BrowserBox/BrowserBox.git

    Set-Location BrowserBox
    git checkout windows-install
    git pull

    Write-Output "Cleaning non-Windows detritus..."
    npm run clean
    Write-Output "Installing dependencies..."
    npm i
    Write-Output "Building client..."
    npm run parcel

    Write-Output "Full install completed."
    Write-Output "Starting BrowserBox..."
    $loginLink = ./deploy-scripts/_setup_bbpro.ps1 -p 9999

    npm test

    Write-Output $loginLink | clip
    Write-Output $loginLink
  }


  # Function Definitions
  # it's worth noting that while Remote Sound Device from remote desktop works well,
  # due to RDP audio driver on Windows
  # there is distortion on some music sounds, for instance
  # https://www.youtube.com/watch?v=v0wVRG38IYs

  function Show-Usage {
    Write-Host "Usage: BrowserBox-Install-Task.ps1 [-acceptTermsEmail <email> -hostname <hostname>]"
    Write-Host ""
    Write-Host "This script installs and configures BrowserBox on your Windows system."
    Write-Host "Parameters:"
    Write-Host "  -acceptTermsEmail  The email address used for accepting terms and receiving notifications."
    Write-Host "             Optional if not provided, a GUI prompt will request this information."
    Write-Host "  -hostname      The hostname for the BrowserBox service. This is used for certificate generation."
    Write-Host "             Optional if not provided, a GUI prompt will request this information."
    Write-Host ""
    Write-Host "Documentation Links:"
    Write-Host "  Terms of Service: https://dosyago.com/terms.txt"
    Write-Host "  Privacy Policy:   https://dosyago.com/privacy.txt"
    Write-Host "  License:      https://github.com/BrowserBox/BrowserBox/blob/boss/LICENSE.md"
    Write-Host ""
    Write-Host "Example:"
    Write-Host "  .\BrowserBox-Install-Task.ps1 -acceptTermsEmail 'user@example.com' -hostname 'yourhostname.com'"
    Write-Host ""
    Write-Host "Note: Run this script with administrative privileges for proper installation."
  }


  function Validate-NonEmptyParameters {
    param (
      [string]$hostname,
      [string]$acceptTermsEmail
    )

    # Check if either hostname or acceptTermsEmail is empty
    if ([string]::IsNullOrWhiteSpace($hostname) -or [string]::IsNullOrWhiteSpace($acceptTermsEmail)) {
      Write-Host "Hostname and Email must both be provided."
      return $false
    }

    return $true
  }

  function RequestCertificate {
    param (
      [string]$Domain,
      [string]$termsEmail
    )

    try {
      # Run the Certbot command
      certbot certonly --standalone --keep -d $Domain --agree-tos -m $termsEmail --no-eff-email
    }
    catch {
      # Handle errors (if any)
      Write-Error "An error occurred while requesting the certificate: $_"
    }
  }

  function OpenFirewallPort {
    param (
      [string]$Port
    )
    try {
      netsh advfirewall firewall add rule name="Open Port $Port" dir=in action=allow protocol=TCP localport=$Port
      Write-Output "Port $Port opened successfully."
    }
    catch {
      Write-Error "Failed to open port $Port with error: $_"
    }
  }

  function Guard-CheckAndSaveUserAgreement {
    param (
      [ref]$acceptTermsEmail,
      [ref]$hostname
    )

    $configDir = Join-Path $env:USERPROFILE ".config\dosyago\bbpro"
    $agreementFile = Join-Path $configDir "user_agreement.txt"

    # Check if the agreement file already exists and contains the agreement
    if (Test-Path $agreementFile) {
      $agreementData = Get-Content $agreementFile
      $agreed = $agreementData | Select-String "Agreed" -Quiet
      $storedEmail = ($agreementData | Select-String "Email:" | Out-String).Trim().Split(":")[1]
      $storedHostname = ($agreementData | Select-String "Hostname:" | Out-String).Trim().Split(":")[1]

      if ($agreed) {
        if (-not $acceptTermsEmail.Value) { $acceptTermsEmail.Value = $storedEmail }
        if (-not $hostname.Value) { $hostname.Value = $storedHostname }
        return
      }
    }

    Write-Host "OK"

    # Show user agreement dialog
    try {
      $userInput = Show-UserAgreementDialog -acceptTermsEmail $acceptTermsEmail.Value -hostname $hostname.Value
      if ($userInput) {
        $acceptTermsEmail.Value = $userInput.Email
        $hostname.Value = $userInput.Hostname
      }
      else {
        Exit
      }
    }
    catch {
      $userInput = Read-Host "Do you agree to the terms? (Yes/No)"
      if ($userInput -ne 'Yes') {
        Write-Output 'You must agree to the terms and conditions to proceed.'
        Exit
      }
    }


    # Save the user's agreement along with email and hostname
    if (!(Test-Path $configDir)) {
      New-Item -Path $configDir -ItemType Directory -Force
    }
    $userName = [Environment]::UserName
    $dateTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $agreementText = "$userName,$dateTime,Agreed`nEmail:$($acceptTermsEmail.Value)`nHostname:$($hostname.Value)"
    $agreementText | Out-File $agreementFile
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

  function RemoveAnyRestartScript {
    $homePath = $HOME
    $cmdScriptPath = Join-Path -Path $homePath -ChildPath "restart_ps.cmd"

    # Check if the CMD script exists. If it does, delete it and return (this is the restart phase)
    if (Test-Path -Path $cmdScriptPath) {
      Remove-Item -Path $cmdScriptPath
    }
  }

  function PatchNvmPath {
    $env:NVM_HOME = "$env:appdata\nvm"
    $env:NVM_SYMLINK = "$env:programfiles\nodejs"
    $additionalPaths = @(
      "$env:NVM_HOME",
      "$env:NVM_SYMLINK",
      "$env:LOCALAPPDATA\Microsoft\WindowsApps",
      "$env:LOCALAPPDATA\Microsoft\WinGet\Links",
      "$env:APPDATA\nvm"
    )

    # Program Files directories
    $programFilesPaths = @(
      $env:ProgramFiles
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
  
    while ($true) {
      Start-Sleep -Seconds 2
      # Check for the presence of the "Security Warning" window
      if ($myshell.AppActivate("Security Warning")) {
        $myshell.SendKeys("y")

        # Wait a bit for the action to be processed
        Start-Sleep -Seconds 2

        # Check if the window is still active; if not, break the loop
        if (-not $myshell.AppActivate("Security Warning")) {
          break
        }
      }
    }
  }

  function RunCloserFunctionInNewWindow {
    # Get the function definition as a string
    $functionToRun = $Function:BeginSecurityWarningAcceptLoop.ToString()

    # Script content to write to file
    $scriptContent = @"
$functionToRun

# Call the function
BeginSecurityWarningAcceptLoop

# Delete this script file once done
Remove-Item -LiteralPath `"$($MyInvocation.ScriptName)`" -Force
"@

    # Write the script content to a file
    $scriptPath = ".\AutoAcceptSecurityWarning.ps1"
    $scriptContent | Out-File -FilePath $scriptPath -Encoding UTF8

    # Run the script in a new PowerShell window
    Start-Process PowerShell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`"" -WindowStyle Hidden
  }

  function EnableWindowsAudio {
    Write-Output "Enabling windows audio service..."

    try {
      Set-Service -Name Audiosrv -StartupType Automatic
      Start-Service -Name Audiosrv
    }
    catch {
      Write-Output "Error when attempting to enable Windows Audio service: $_"
    }

    try {
      Get-PnpDevice | Where-Object { $_.Class -eq 'AudioEndpoint' } | Select-Object Status, Class, FriendlyName
    }
    catch {
      Write-Output "Error when attempting to list sound devices: $_"
    }

    Write-Output "Completed audio service startup attempt."
  }

  function InstallFmedia {
    if (-not (Get-Command "fmedia.exe" -ErrorAction SilentlyContinue) ) {
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
      Get-ChildItem -Path "$extractedDir\*" | ForEach-Object {
        $destPath = Join-Path $outputDir $_.Name
        if (Test-Path $destPath) {
          Remove-Item $destPath -Recurse -Force
        }
        Move-Item -Path $_.FullName -Destination $outputDir -Force
      }

      # Install fmedia
      $fmediaExe = Join-Path $outputDir "fmedia.exe"
      Add-ToSystemPath $outputDir

      & $fmediaExe --install

      # Refresh environment variables in the current session
      RefreshPath
    }
  }

  function InstallPulseAudioForWindows {
    if (-not (Get-Command "pulseaudio.exe" -ErrorAction SilentlyContinue) ) {
      $pulseRelease = "https://github.com/pgaskin/pulseaudio-win32/releases/download/v5/pasetup.exe"
      $destination = Join-Path -Path $env:TEMP -ChildPath "pasetup.exe"

      Write-Output "Downloading PulseAudio for Windows by Patrick Gaskin..."

      DownloadFile $pulseRelease $destination

      Write-Output "Downloaded. Installing PulseAudio for Windows by Patrick Gaskin..."

      Start-Process -FilePath $destination -ArgumentList '/install', '/silent', '/quiet', '/norestart' -Wait -NoNewWindow

      Write-Output "Installed PulseAudio for Windows by Patrick Gaskin"
      AddPulseAudioToPath
    }
    else {
      Write-Output "Pulseaudio is already installed"
    }
  }

  function UpdatePowerShell {
    if ($PSVersionTable.PSVersion.Major -ge 6) {
      Write-Output "Recent version of PowerShell already installed. Skipping..."
    }
    else {
      Write-Output "Upgrading PowerShell..."
      winget install -e --id Microsoft.PowerShell --accept-source-agreements
      RestartEnvironment
    }
  }

  function InstallGoogleChrome {
    $chrometest = Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe'

    if ($chrometest -eq $true) {
      Write-Output "Chrome is installed"
    }
    else {
      Write-Output "Chrome is not installed"
      $url = 'https://dl.google.com/tag/s/dl/chrome/install/googlechromestandaloneenterprise64.msi'
      $destination = Join-Path -Path $env:TEMP -ChildPath "googlechrome.msi"

      Write-Output "Downloading Google Chrome..."
      DownloadFile $url $destination

      Write-Output "Installing Google Chrome silently..."
      Start-Process -FilePath 'msiexec.exe' -ArgumentList "/i `"$destination`" /qn /norestart" -Wait -NoNewWindow

      Write-Output "Installation of Google Chrome completed."
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

  function PersistCerts {
    param (
      [string]$Domain
    )

    # Call the function to copy the certificates
    Copy-CertbotCertificates -Domain $Domain

    # Schedule the renewal task
    Schedule-CertbotRenewalTask -Domain $Domain
  }

  function Schedule-CertbotRenewalTask {
    param (
      [string]$Domain,
      [string]$ScriptPath = "$env:TEMP\RenewAndCopyCerts.ps1"
    )

    # Create the PowerShell script using a here-string
    $scriptContent = @"
certbot renew --quiet

# Assuming Copy-CertbotCertificates is defined or loaded
Copy-CertbotCertificates -Domain "$Domain"
"@

    # Write the script to a file
    $scriptContent | Out-File -FilePath $ScriptPath -Force

    # Schedule the task
    $action = New-ScheduledTaskAction -Execute 'Powershell.exe' -Argument "-ExecutionPolicy Bypass -File `"$ScriptPath`""
    $trigger = New-ScheduledTaskTrigger -Daily -At 3am
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

    Register-ScheduledTask -TaskName "CertbotRenewal" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force
  }

  function Copy-CertbotCertificates {
    param (
      [string]$Domain
    )
    $certbotLivePath = "C:\Certbot\live\$Domain"
    $destinationPath = Join-Path $HOME "sslcerts"

    # Create sslcerts directory if it doesn't exist
    if (-not (Test-Path $destinationPath)) {
      New-Item -Path $destinationPath -ItemType Directory
    }

    # Copy certificates to the sslcerts directory
    if (Test-Path $certbotLivePath) {
      Copy-Item -Path "$certbotLivePath\*" -Destination $destinationPath -Force
    }
    else {
      Write-Error "Certificates for $Domain not found at $certbotLivePath"
    }
  }

  function InstallCertbot {
    $url = "https://github.com/BrowserBox/BrowserBox/releases/download/v7.0/certbot-beta-installer-win_amd64.exe"
    $destination = Join-Path -Path $env:TEMP -ChildPath "certbot-beta-installer-win_amd64.exe"

    Write-Output "Downloading LetsEncrypt Certbot..."
    DownloadFile -Url $url -Destination $destination

    Write-Output "Installing LetsEncrypt Certbot silently..."
    Start-Process -FilePath $destination -ArgumentList '/install', '/silent', '/quiet', '/norestart' -Wait -NoNewWindow

    RefreshPath
    Write-Output "Installation of LetsEncrypt Certbot completed."
  }

  function InstallMSVC {
    $url = 'https://aka.ms/vs/17/release/vc_redist.x64.exe'
    $destination = Join-Path -Path $env:TEMP -ChildPath "vc_redist.x64.exe"

    Write-Output "Downloading Microsoft Visual C++ Redistributable..."
    DownloadFile -Url $url -Destination $destination

    Write-Output "Installing Microsoft Visual C++ Redistributable silently..."

    Start-Process -FilePath $destination -ArgumentList '/install', '/silent', '/quiet', '/norestart' -Wait -NoNewWindow

    Write-Output "Installation of Microsoft Visual C++ Redistributable completed."
  }

  function Is-HostnameLinkLocal {
    param (
      [string]$hostname
    )

    try {
      $ipAddress = [System.Net.Dns]::GetHostAddresses($hostname) | Select-Object -First 1
      $bytes = $ipAddress.GetAddressBytes()

      # Check for private IP ranges (e.g., 192.168.x.x, 10.x.x.x, 172.16.x.x - 172.31.x.x)
      if (($bytes[0] -eq 10) -or
    ($bytes[0] -eq 172 -and $bytes[1] -ge 16 -and $bytes[1] -le 31) -or
    ($bytes[0] -eq 192 -and $bytes[1] -eq 168)) {
        return $true
      }
    }
    catch {
      Write-Error "Failed to resolve hostname: $_"
    }

    return $false
  }

  function CheckMkcert {
    if (Get-Command mkcert -ErrorAction SilentlyContinue) {
      Write-Host "Mkcert is already installed."
      return $true
    }
    else {
      Write-Host "Mkcert is not installed."
      return $false
    }
  }

  function InstallMkcert {
    Write-Output "Installing mkcert..."
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
    if (-not (Get-Command "nvm.exe" -ErrorAction SilentlyContinue) ) {
      Write-Host "NVM is not installed."
      return $false
    }
    else {
      Write-Host "NVM is already installed."
      return $true
    }
  }

  function EnhancePackageManagers {
    try {
      Install-PackageProvider -Name NuGet -MinimumVersion 2.8.5.201 -Force
      #Install-PackageProvider -Name NuGet -Force -Scope CurrentUser
      Import-PackageProvider -Name NuGet -Force
    }
    catch {
      Write-Output "Error installing NuGet provider: $_"
    }
    Set-PSRepository -Name PSGallery -InstallationPolicy Trusted
    try {
      Install-Module -Name PackageManagement -Repository PSGallery -Force
    }
    catch {
      Write-Output "Error installing PackageManagement provider: $_"
    }
    Install-Module -Name Microsoft.WinGet.Client
    try {
      Repair-WinGetPackageManager -AllUsers
    }
    catch {
      Write-Output "Could not repair WinGet ($_) will try to install instead."
    }
  }

  function RefreshPath {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
  }

  function DeleteNodeAndNvm {
    if (Get-Command "node.exe" -ErrorAction SilentlyContinue) {
      if (Get-Command "pm2" -ErrorAction SilentlyContinue) {
        pm2 delete all
      }
    }
    taskkill /f /im nvm.exe
    taskkill /f /im node.exe
    Remove-Item -Recurse -Force "$env:programfiles\nodejs"
    Remove-Item -Recurse -Force "${env:ProgramFiles(x86)}\nodejs"
    Remove-Item -Recurse -Force "$env:ProgramW6432\nodejs"
    Remove-Item -Recurse -Force "$env:appdata\nvm"
  }

  function InstallAndLoadNvm {
    if (-not (Get-Command "nvm.exe" -ErrorAction SilentlyContinue) ) {
      Write-Output "NVM is not installed."
      DeleteNodeAndNvm
      InstallNvm
      RefreshPath
      PatchNvmPath
      #RestartEnvironment
      Write-Output "NVM has been installed and added to the path for the current session."
    }
    else {
      Write-Output "NVM is already installed"
    }
  }

  function RestartShell {
    Write-Output "Relaunching shell and running this script again..."
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
    Write-Output "Restarting at $cmdScriptPath with: $cmdContent"

    # Write the CMD script to disk
    $cmdContent | Set-Content -Path $cmdScriptPath

    # Launch the CMD script to restart PowerShell
    Write-Output "$cmdScriptPath"
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
    Write-Output "Installing NVM..."
    try {
      $latestNvmDownloadUrl = Get-LatestReleaseDownloadUrl
      Write-Output "Downloading NVM from $latestNvmDownloadUrl..."

      # Define the path for the downloaded installer
      $installerPath = Join-Path -Path $env:TEMP -ChildPath "nvm-setup.exe"

      # Download the installer
      DownloadFile $latestNvmDownloadUrl $installerPath

      # Execute the installer
      Write-Output "Running NVM installer..."
      Start-Process -FilePath $installerPath -ArgumentList '/install', '/silent', '/quiet', '/norestart', '/passive'  -Wait -NoNewWindow

      Write-Output "NVM installation completed."
    }
    catch {
      Write-Error "Failed to install NVM: $_"
    }
  }

  function CheckForPowerShellCore {
    $pwshPath = (Get-Command pwsh -ErrorAction SilentlyContinue).Source
    if ($null -ne $pwshPath) {
      if ($PSVersionTable.PSVersion.Major -eq 5) {
        Write-Output "Running with latest PowerShell version..."
        $scriptPath = $($MyInvocation.ScriptName)
        $userPasswordArg = if ($UserPassword) { "-UserPassword `"$UserPassword`"" } else { "" }
        Start-Process $pwshPath -ArgumentList "-NoProfile", "-File", "`"$scriptPath`" $userPasswordArg"
        Write-Output "Done"
        Exit
      }
    }
  }

  function EnsureRunningAsAdministrator {
    try {
      if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
        Write-Output "Not currently Administrator. Upgrading privileges..."
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
      Write-Output "An error occurred: $_"
    }
    finally {
      Write-Output "Continuing..."
    }
  }

  function Show-UserAgreementDialog {
    param (
      [string]$acceptTermsEmail,
      [string]$hostname
    )

    Add-Type -AssemblyName System.Windows.Forms

    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'BrowserBox User Agreement'
    $form.TopMost = $true
    $form.StartPosition = 'CenterScreen'
    $form.ClientSize = New-Object System.Drawing.Size(400, 250)

    $label = New-Object System.Windows.Forms.Label
    $label.Text = 'Please enter the required information and agree to our terms to continue.'
    $label.Width = 360
    $label.Height = 60
    $label.Location = New-Object System.Drawing.Point(20, 20)
    $label.AutoSize = $true
    $form.Controls.Add($label)

    if (-not $hostname ) {
      $domainLabel = New-Object System.Windows.Forms.Label
      $domainLabel.Text = 'Domain Name:'
      $domainLabel.Location = New-Object System.Drawing.Point(20, 90)
      $domainLabel.AutoSize = $true
      $form.Controls.Add($domainLabel)

      $domainTextBox = New-Object System.Windows.Forms.TextBox
      $domainTextBox.Location = New-Object System.Drawing.Point(110, 85)
      $domainTextBox.Size = New-Object System.Drawing.Size(260, 20)
      $form.Controls.Add($domainTextBox)
    }

    if (-not $acceptTermsEmail) {
      $emailLabel = New-Object System.Windows.Forms.Label
      $emailLabel.Text = 'Email:'
      $emailLabel.Location = New-Object System.Drawing.Point(20, 120)
      $emailLabel.AutoSize = $true
      $form.Controls.Add($emailLabel)

      $emailTextBox = New-Object System.Windows.Forms.TextBox
      $emailTextBox.Location = New-Object System.Drawing.Point(110, 115)
      $emailTextBox.Size = New-Object System.Drawing.Size(260, 20)
      $form.Controls.Add($emailTextBox)
    }

    # Add clickable link for Terms of Service
    $termsLink = New-Object System.Windows.Forms.LinkLabel
    $termsLink.Text = "Terms of Service"
    $termsLink.AutoSize = $true
    $termsLink.Location = New-Object System.Drawing.Point(20, 160)
    $termsLink.Add_Click({ Start-Process "https://dosyago.com/terms.txt" })
    $form.Controls.Add($termsLink)

    # Add clickable link for Privacy Policy
    $privacyLink = New-Object System.Windows.Forms.LinkLabel
    $privacyLink.Text = "Privacy Policy"
    $privacyLink.AutoSize = $true
    $privacyLink.Location = New-Object System.Drawing.Point(20, 180)
    $privacyLink.Add_Click({ Start-Process "https://dosyago.com/privacy.txt" })
    $form.Controls.Add($privacyLink)

    # Add clickable link for License
    $licenseLink = New-Object System.Windows.Forms.LinkLabel
    $licenseLink.Text = "License"
    $licenseLink.AutoSize = $true
    $licenseLink.Location = New-Object System.Drawing.Point(20, 200)
    $licenseLink.Add_Click({ Start-Process "https://github.com/BrowserBox/BrowserBox/blob/boss/LICENSE.md" })
    $form.Controls.Add($licenseLink)

    $continueButton = New-Object System.Windows.Forms.Button
    $continueButton.Text = 'Agree & Continue'
    $continueButton.Location = New-Object System.Drawing.Point(200, 200)
    $continueButton.Add_Click({
        if ($domainTextBox.Text -eq '' -or $emailTextBox.Text -eq '') {
          [System.Windows.Forms.MessageBox]::Show('Please fill in all required fields')
        }
        else {
          $form.DialogResult = [System.Windows.Forms.DialogResult]::OK
        }
      })
    $form.Controls.Add($continueButton)

    $cancelButton = New-Object System.Windows.Forms.Button
    $cancelButton.Text = 'Cancel'
    $cancelButton.Location = New-Object System.Drawing.Point(280, 200)
    $cancelButton.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
    $form.Controls.Add($cancelButton)

    $form.AcceptButton = $continueButton
    $form.CancelButton = $cancelButton

    if ($form.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
      return @{
        'Email'  = if ($acceptTermsEmail) { $acceptTermsEmail } else { $emailTextBox.Text }
        'Hostname' = if ($hostname) { $hostname } else { $domainTextBox.Text }
      }
    }
    else {
      Exit
    }
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
      Write-Output "Updating Winget to a newer version..."
      Invoke-WebRequest -Uri https://aka.ms/getwinget -OutFile winget.msixbundle
      Add-AppxPackage winget.msixbundle
      Remove-Item winget.msixbundle
    }
    else {
      Write-Output "Winget version ($currentVersion) is already greater than $targetVersion."
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
      Write-Output "Successfully installed $packageId"
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
      Write-Output "Added $pathToAdd to system PATH."
    }
    else {
      Write-Output "$pathToAdd is already in system PATH."
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
      Write-Output "$packageName is already installed."
    }
  }

  Write-Output ""

  # Executor helper
  try {
    & $Main
  }
  catch {
    Write-Output "An error occurred: $_"
    $Error[0] | Format-List -Force
  }
  finally {
    Write-Output "Your login link will be in your clipboard once installation completed."
    Write-Output "Exiting..."
  }
}

& $Outer



