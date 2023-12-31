function Install-PsExec {
  param (
    [string]$DownloadPath = "$Env:TEMP",
    [bool]$AddToSystemPath = $false
  )

  # Define the URL and destination path
  $url = "https://download.sysinternals.com/files/PSTools.zip"
  $zipFile = Join-Path $DownloadPath "PSTools.zip"
  $extractPath = Join-Path $DownloadPath "PSTools"

  # Disable progress bar
  $ProgressPreference = 'SilentlyContinue'

  # Download PSTools
  Invoke-WebRequest -Uri $url -OutFile $zipFile

  # Extract the ZIP file
  Expand-Archive -LiteralPath $zipFile -DestinationPath $extractPath

  # Add to System Path if requested
  if ($AddToSystemPath) {
    $path = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::Machine)
    $newPath = "$path;$extractPath"
    [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::Machine)
  }
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User") 


  # Output the installation path
  Write-Output "PsExec installed to: $extractPath"
}

# To use the function, just call it:
# Install-PsExec
# To add PsExec to system PATH:
Install-PsExec -AddToSystemPath $true
# accept eula without prompt
# psexec /accepteula

