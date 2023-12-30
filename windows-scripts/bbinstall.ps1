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
    Write-Host "An error occurred during window management: $_"
  }
  finally {
    Write-Host "Continuing..."
  }

  # Set the title of the PowerShell window
  $Host.UI.RawUI.WindowTitle = "BrowserBox Windows Edition Installer"

  # Main script flow
  $Main={
    Write-Host "Running PowerShell version: $($PSVersionTable.PSVersion)"

    # Disabling the progress bar
    $ProgressPreference = 'SilentlyContinue'

    CheckForPowerShellCore
    EnsureRunningAsAdministrator

    # Call the function to show user agreement dialog
    try {
      $dialogResult = Show-UserAgreementDialog
      if ($dialogResult -ne [System.Windows.Forms.DialogResult]::Yes) {
        Write-Host 'You must agree to the terms and conditions to proceed.'
        Exit
      }
    } 
    catch {
      Read-Host "Do you agree to the terms?"
    }

    Write-Host "Installing preliminairies..."

    InstallNuGet

    try {
	    Repair-WinGetPackageManager -AllUsers
    } catch {
      Write-Host "Could not repair WinGet ($_) will try to install instead."
    }
    Install-Module -Name Microsoft.WinGet.Client
    
    $currentVersion = CheckWingetVersion
    UpdateWingetIfNeeded $currentVersion
    UpdatePowerShell
    
    InstallMSVC

    EnableWindowsAudio
    InstallPulseAudioForWindows
    AddPulseAudioToPath

    InstallGoogleChrome
   
    InstallIfNeeded "jq" "jqlang.jq"
    InstallIfNeeded "vim" "vim.vim"
    AddVimToPath
    InstallIfNeeded "git" "Git.Git"

    InstallAndLoadNvm

    nvm install latest
    nvm use latest

    Write-Host "Setting up certificate..."
    BeginSecurityWarningAcceptLoop
    InstallMkcertAndSetup
    EndSecurityWarningAcceptLoop

    Write-Host "Installing BrowserBox..."

    Set-Location $HOME
    Write-Host $PWD
    git config --global core.symlinks true
    git clone https://github.com/BrowserBox/BrowserBox.git

    cd BrowserBox
    git checkout windows-install
    git pull

    Write-Host "Cleaning non-Windows detritus..."
    npm run clean
    Write-Host "Installing dependencies..."
    npm i
    Write-Host "Building client..."
    npm run parcel

    Write-Host "Full install completed. Press any key to exit."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
  }

  # Function Definitions
    function BeginSecurityWarningAcceptLoop {
      Write-Host "Implemente!!"
    }

    function EndSecurityWarningAcceptLoop {
      Write-Host "Implemente!!"
    }

    function EnableWindowsAudio {
      Write-Host "Enabling windows audio service..."

      try {
        Set-Service -Name Audiosrv -StartupType Automatic
        Start-Service -Name Audiosrv
      } catch {
        Write-Host "Error when attempting to enable Windows Audio service: $_"
      }

      try {
        Get-PnpDevice | Where-Object { $_.Class -eq 'AudioEndpoint' } | Select-Object Status, Class, FriendlyName
      } catch {
        Write-Host "Error when attempting to list sound devices: $_"
      }

      Write-Host "Completed audio service startup attempt."
    }

    function InstallPulseAudioForWindows {
      $pulseRelease = "https://github.com/pgaskin/pulseaudio-win32/releases/download/v5/pasetup.exe"
      $destination = Join-Path -Path $env:TEMP -ChildPath "pasetup.exe"

      Write-Host "Downloading PulseAudio for Windows by Patrick Gaskin..."

      DownloadFile $pulseRelease $destination

      Write-Host "Downloaded. Installing PulseAudio for Windows by Patrick Gaskin..."

      Start-Process -FilePath $destination -ArgumentList '/install', '/silent', '/quiet', '/norestart' -Wait -NoNewWindow

      Write-Host "Installed PulseAudio for Windows by Patrick Gaskin"
    }

    function UpdatePowerShell {
      if ($PSVersionTable.PSVersion.Major -ge 6) {
        Write-Host "Recent version of PowerShell already installed. Skipping..."
      } else {
        Write-Host "Upgrading PowerShell..."
        winget install -e --id Microsoft.PowerShell --accept-source-agreements
        RestartEnvironment
      }
    }

    function InstallGoogleChrome {
      $chrometest = Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe'

      if($chrometest -eq $true){
         Write-Host "Chrome is installed"
      }else{
        Write-Host "Chrome is not installed"
        $url = 'https://dl.google.com/tag/s/dl/chrome/install/googlechromestandaloneenterprise64.msi' 
        $destination = Join-Path -Path $env:TEMP -ChildPath "googlechrome.msi"

        Write-Host "Downloading Google Chrome..."
        DownloadFile $url $destination

        Write-Host "Installing Google Chrome silently..."
        Start-Process -FilePath 'msiexec.exe' -ArgumentList "/i `"$destination`" /qn /norestart" -Wait -NoNewWindow

        Write-Host "Installation of Google Chrome completed."
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

      Write-Host "Downloading Microsoft Visual C++ Redistributable..."
      DownloadFile $url $destination

      Write-Host "Installing Microsoft Visual C++ Redistributable silently..."

      Start-Process -FilePath $destination -ArgumentList '/install', '/silent', '/quiet', '/norestart' -Wait -NoNewWindow

      Write-Host "Installation of Microsoft Visual C++ Redistributable completed."
    }

    function CheckMkcert {
      if (Get-Command mkcert -ErrorAction SilentlyContinue) {
        Write-Host "Mkcert is already installed."
        return $true 
      } else {
        Write-Host "Mkcert is not installed."
        return $false
      }
    }

    function InstallMkcert {
      Write-Host "Installing mkcert..."
      try {
        $archMap = @{
          "0" = "x86";
          "5" = "arm";
          "6" = "ia64";
          "9" = "amd64";
          "12" = "arm64";
        }
        $cpuArch = (Get-WmiObject Win32_Processor).Architecture[0]
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
        Write-Host "NVM is already installed."
        return $true
      } else {
        Write-Host "NVM is not installed."
        return $false
      }
    }

    function InstallNuGet {
      Set-PSRepository -Name PSGallery -InstallationPolicy Trusted
      try {
        Install-Module -Name PackageManagement -Repository PSGallery -Force
      } catch {
        Write-Host "Error installing PackageManagement provider: $_"
      }
      try {
        Install-PackageProvider -Name NuGet -Force -Scope CurrentUser
        Import-PackageProvider -Name NuGet -Force
      } catch {
        Write-Host "Error installing NuGet provider: $_"
      }
    }

    function InstallAndLoadNvm {
      if (-not (CheckNvm)) {
        Write-Host "NVM is not installed."
        InstallNvm
        RestartEnvironment
        Write-Host "NVM has been installed and added to the path for the current session."
      } else {
        Write-Host "NVM is already installed"
      }
    }

    function RestartShell {
      Read-Host "Need to restart shell to load nvm. Press enter to restart." 
      Write-Host "Relaunching shell and running this script again..."
      $scriptPath = $($MyInvocation.ScriptName)

      # Relaunch the script with administrative rights using the current PowerShell version
      $psExecutable = Join-Path -Path $PSHOME -ChildPath "powershell.exe"
      if ($PSVersionTable.PSVersion.Major -ge 6) {
        $psExecutable = Join-Path -Path $PSHOME -ChildPath "pwsh.exe"
      }

      $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""

      $process = (Start-Process $psExecutable -Verb RunAs -ArgumentList $arguments -PassThru)

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
        } else {
          throw "Download URL not found."
        }
      }
      catch {
        Write-Error "An error occurred while fetching the latest release: $_"
      }
    }

    function RestartEnvironment {
      param (
        [string]$ScriptPath = $($MyInvocation.ScriptName)
      )

      # Refresh environment variables

      # Use the user's home directory
      $homePath = $HOME
      $cmdScriptPath = Join-Path -Path $homePath -ChildPath "restart_ps.cmd"

      Write-Host "CSP: $cmdScriptPath"

      # Check if the CMD script exists. If it does, delete it and return (this is the restart phase)
      if (Test-Path -Path $cmdScriptPath) {
        Remove-Item -Path $cmdScriptPath
        return
      }
      
      Write-Host "CSP: $cmdScriptPath"

      $cmdContent = @"
@echo off
echo Waiting for PowerShell to close...
timeout /t 3 /nobreak > NUL
start pwsh -NoExit -File "$ScriptPath"
"@
      # Write the CMD script to disk
      $cmdContent | Set-Content -Path $cmdScriptPath

      # Launch the CMD script to restart PowerShell
      Write-Host "$cmdScriptPath"
      Read-Host "ready?"
      Start-Process "cmd.exe" -ArgumentList "/k `"$cmdScriptPath`"" 
      
      # (thoroughly) Exit the current PowerShell session
      taskkill /f /im "powershell.exe" 
      taskkill /f /im "pwsh.exe"
      Exit
    }

    function InstallNvm {
      Write-Host "Installing NVM..."
      try {
      $latestNvmDownloadUrl = Get-LatestReleaseDownloadUrl
      Write-Host "Downloading NVM from $latestNvmDownloadUrl..."

      # Define the path for the downloaded installer
      $installerPath = Join-Path -Path $env:TEMP -ChildPath "nvm-setup.exe"

      # Download the installer
      DownloadFile $latestNvmDownloadUrl $installerPath

      # Execute the installer
      Write-Host "Running NVM installer..."
      Start-Process -FilePath $installerPath -ArgumentList '/install', '/silent', '/quiet', '/norestart', '/passive'  -Wait -NoNewWindow

      Write-Host "NVM installation completed."
      }
      catch {
      Write-Error "Failed to install NVM: $_"
      }
    }

    function CheckForPowerShellCore {
      $pwshPath = (Get-Command pwsh -ErrorAction SilentlyContinue).Source
      if ($null -ne $pwshPath) {
      if ($PSVersionTable.PSVersion.Major -eq 5) {
        Write-Host "Running with latest PowerShell version..."
        Start-Process $pwshPath -ArgumentList "-NoProfile", "-File", $($MyInvocation.ScriptName)
        Write-Host "Done"
        Exit
      }
      }
    }

    function EnsureRunningAsAdministrator {
      # Check if the script is running as an Administrator
      try {
      if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
        Write-Host "Not currently Administrator. Upgrading privileges..."
        # Get the current script path
        $scriptPath = $($MyInvocation.ScriptName)

        # Relaunch the script with administrative rights using the current PowerShell version
        $psExecutable = Join-Path -Path $PSHOME -ChildPath "powershell.exe"
        if ($PSVersionTable.PSVersion.Major -ge 6) {
          $psExecutable = Join-Path -Path $PSHOME -ChildPath "pwsh.exe"
        }

        $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""

        $process = (Start-Process $psExecutable -Verb RunAs -ArgumentList $arguments -PassThru)
        #$process.WaitForExit()

        Exit
      }
      }
      catch {
        Write-Host "An error occurred: $_"
      }
      finally {
        Write-Host "Continuing..."
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
      $currentVersion = $currentVersion -replace 'v',''
      return $currentVersion
    }

    function UpdateWingetIfNeeded {
      param ([string]$currentVersion)
      $targetVersion = "1.6"
      if (-not (Is-VersionGreaterThan -currentVersion $currentVersion -targetVersion $targetVersion)) {
      Write-Host "Updating Winget to a newer version..."
      Invoke-WebRequest -Uri https://aka.ms/getwinget -OutFile winget.msixbundle
      Add-AppxPackage winget.msixbundle
      Remove-Item winget.msixbundle
      } else {
      Write-Host "Winget version ($currentVersion) is already greater than $targetVersion."
      }
    }

    function AddVimToPath {
      # Attempt to locate the Vim executable and add it to the system PATH
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
      } else {
        Write-Warning "Vim executable not found. Please add Vim to the PATH manually."
      }
    }

    function AddPulseAudioToPath {
      # Attempt to locate the Vim executable and add it to the system PATH
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
      } else {
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
      Write-Host "Successfully installed $packageId"
      } catch {
      Write-Error "Failed to install $packageId"
      }
    }

    function Add-ToSystemPath {
      param ([string]$pathToAdd)
      $currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::Machine)
      if (-not $currentPath.Contains($pathToAdd)) {
      $newPath = $currentPath + ";" + $pathToAdd
      [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::Machine)
      Write-Host "Added $pathToAdd to system PATH."
      } else {
      Write-Host "$pathToAdd is already in system PATH."
      }
    }

    function InstallIfNeeded {
      param (
      [string]$packageName,
      [string]$packageId
      )
      if (-not (Get-Command $packageName -ErrorAction SilentlyContinue)) {
      Install-PackageViaWinget $packageId
      # Add additional logic if needed to handle post-installation steps
      } else {
      Write-Host "$packageName is already installed."
      }
    }

  Write-Host ""

  # Executor helper
  try {
    & $Main
  }
  catch {
    Write-Host "An error occurred: $_"
    $Error[0] | Format-List -Force
  }
  finally {
    Write-Host "Exiting..."
  }
}

& $Outer


