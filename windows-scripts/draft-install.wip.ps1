$Outer={
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
	[WinApi]::SetWindowPos($hwnd, [IntPtr]::new(-1), 0, 0, 0, 0, 0x0003)

# Main script flow
$Main={
  Write-Host "Running PowerShell version: $($PSVersionTable.PSVersion)"

  CheckForPowerShellCore
  EnsureRunningAsAdministrator

  # Call the function to show user agreement dialog
  $dialogResult = Show-UserAgreementDialog
  if ($dialogResult -ne [System.Windows.Forms.DialogResult]::Yes) {
    Write-Host 'You must agree to the terms and conditions to proceed.'
    Exit
  }

  $currentVersion = CheckWingetVersion
  UpdateWingetIfNeeded $currentVersion

  InstallIfNeeded "vim" "vim.vim"
  InstallIfNeeded "git" "git.git"

  Write-Host "Full install completed. Press any key to exit."
  $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Function Definitions
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
