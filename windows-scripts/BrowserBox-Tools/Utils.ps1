function Get-DestinationDirectory {
  $programFilesPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::ProgramFiles)
  $destinationPath = Join-Path $programFilesPath -ChildPath "DOSYAGO\BrowserBox"
  
  if (-not (Test-Path -Path $destinationPath)) {
    New-Item -ItemType Directory -Path $destinationPath -Force
  }

  return $destinationPath
}

function Copy-CurrentToDestination {
  $destinationPath = Get-DestinationDirectory
  $currentPath = Get-Location
  Copy-Item -Path "$currentPath\*" -Destination $destinationPath -Recurse -Force
}

