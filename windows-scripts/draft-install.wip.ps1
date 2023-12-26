$Outer = {
  try {
    Add-Type @"
    using System;
    using System.Runtime.InteropServices;
    public class WinApi {
      [DllImport("user32.dll")]
      [return: MarshalAs(UnmanagedType.Bool)]
      public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
    }
"@
    $hwnd = (Get-Process -Id $pid).MainWindowHandle
    # Set the window position and size: X, Y, Width, Height, and make window always be on top
    [WinApi]::SetWindowPos($hwnd, [IntPtr]::new(-1), 0, 0, 555, 555, 0x0040)
  }
  catch {
    Write-Host "An error occurred: $_"
  }
  finally {
    Write-Host "Continuing..."
  }

# Main script flow
$Main={
  Write-Host "Running PowerShell version: $($PSVersionTable.PSVersion)"

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

  $currentVersion = CheckWingetVersion
  UpdateWingetIfNeeded $currentVersion

  InstallIfNeeded "vim" "vim.vim"
  AddVimToPath
  InstallIfNeeded "git" "git.git"

  InstallAndSourceNvm
  nvm install latest
  nvm use latest

  Write-Host "Setting up certificate..."
  InstallMkcertAndSetup

  Write-Host "Installing BrowserBox..."

  git clone https://github.com/BrowserBox/BrowserBox.git

  cd BrowserBox
  git checkout windows-install

  Write-Host "Installing dependencies..."
  Read-Host "Please be responsive to prompts in the install window. Press any key to continue to install."
  npm i
  npm run parcel

  Write-Host "Full install completed. Press any key to exit."
  $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Function Definitions
  function InstallMkcertAndSetup {
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

		$sslCertsDir = "$HOME\sslcerts"
		if (-not (Test-Path $sslCertsDir)) {
				New-Item -ItemType Directory -Path $sslCertsDir
		}

		# Change directory to the SSL certificates directory
		Set-Location $sslCertsDir

		# Generate SSL certificates for localhost
		mkcert -key-file privkey.pem -cert-file fullchain.pem localhost 127.0.0.1 link.local
  }

	function CheckAndSourceNvm {
		$nvmDirectory = Join-Path -Path $env:APPDATA -ChildPath "nvm"
		if (Test-Path $nvmDirectory) {
			Write-Host "NVM is already installed."
			# Add NVM to the current session's path
			$env:Path += ";$nvmDirectory"
			return $true
		} else {
			Write-Host "NVM is not installed."
			return $false
		}
	}

	function InstallAndSourceNvm {
		if (-not (CheckAndSourceNvm)) {
			InstallNvm
			# Assuming a successful installation, add NVM to path
			$nvmDirectory = Join-Path -Path $env:APPDATA -ChildPath "nvm"
			$env:Path += ";$nvmDirectory"
			Write-Host "NVM has been installed and added to the path for the current session."
		}
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

	function InstallNvm {
		try {
			$latestNvmDownloadUrl = Get-LatestReleaseDownloadUrl
			Write-Host "Downloading NVM from $latestNvmDownloadUrl..."

			# Define the path for the downloaded installer
			$installerPath = Join-Path -Path $env:TEMP -ChildPath "nvm-setup.exe"

			# Download the installer
			Invoke-WebRequest -Uri $latestNvmDownloadUrl -OutFile $installerPath

			# Execute the installer
			Write-Host "Running NVM installer..."
			Start-Process -FilePath $installerPath -Wait

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
      winget install --id $packageId 
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
  }
  finally {
    Write-Host "Exiting..."
  }
}

& $Outer
