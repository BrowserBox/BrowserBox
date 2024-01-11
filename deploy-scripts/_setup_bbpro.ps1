# Get the current script path
$scriptPath = $($MyInvocation.ScriptName)
$scriptArgs = $($args)

# Function to check if running as administrator
function Is-Admin {
  $currentUser = New-Object Security.Principal.WindowsPrincipal $([Security.Principal.WindowsIdentity]::GetCurrent())
  $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function RestartShellIfNeeded {
  $scriptPath = $($MyInvocation.ScriptName)

  # Relaunch the script with administrative rights using the current PowerShell version
  $psExecutable = Join-Path -Path $PSHOME -ChildPath "powershell.exe"
  if ($PSVersionTable.PSVersion.Major -ge 6) {
    $psExecutable = Join-Path -Path $PSHOME -ChildPath "pwsh.exe"
  }

  # Restart the script as administrator if not already
  if (-not (Is-Admin)) {
    try {
      Write-Information $scriptPath
      $arguments = "-NoProfile -ExecutionPolicy Bypass -Command Set-Location $PWD; $scriptPath " + ($scriptArgs -Join ' ')
      $process = (Start-Process $psExecutable -Verb RunAs -ArgumentList $arguments -WorkingDirectory $PWD -PassThru)
      $process.WaitForExit()
      $login_link = (Get-Content "$HOME\.config\dosyago\bbpro\login.link")
      Write-Output $login_link
      Exit
    }
    catch {
      Write-Error "Failed to start as Administrator: $_"
      Exit
    }
  }
}

function Wait-ForFileChange {
  param (
    [ScriptBlock]$Action,
    [string]$FilePath
  )

  if (-not (Test-Path $FilePath)) {
    throw "File not found: $FilePath"
  }

  $watcher = New-Object System.IO.FileSystemWatcher
  $watcher.Path = Split-Path $FilePath
  $watcher.Filter = Split-Path $FilePath -Leaf
  $watcher.NotifyFilter = [System.IO.NotifyFilters]'LastWrite'

  $onChanged = Register-ObjectEvent $watcher "Changed" -Action {
    try {
      & $Action
    } finally {
      $Global:fileChanged = $true
    }
  }

  $watcher.EnableRaisingEvents = $true

  try {
    $Global:fileChanged = $false
    while (-not $Global:fileChanged) {
      Start-Sleep -Seconds 1
    }
  } finally {
    Unregister-Event -SourceIdentifier $onChanged.Name
    $watcher.EnableRaisingEvents = $false
    $watcher.Dispose()
  }
}

RestartShellIfNeeded

# If running as administrator, execute the bash script with the script's arguments
# & ".\deploy-scripts\_setup_bbpro.sh" $scriptArgs > abc
cmd.exe /c .\deploy-scripts\_setup_bbpro.sh $scriptArgs 

$login_link = (Get-Content $HOME\.config\dosyago\bbpro\login.link)
Write-Output $login_link


