function Get-DestinationDirectory {
  $destinationPath = "$env:ProgramFiles\DOSYAGO"
  
  if (-not (Test-Path $destinationPath)) {
    New-Item -ItemType Directory -Path $destinationPath -Force | Out-Null
  }

  return $destinationPath
}

function Copy-CurrentToDestination {
    try {
        $destinationPath = Get-DestinationDirectory
        $currentPath = Get-Location
        $files = Get-ChildItem -Path "$currentPath\*" -Recurse

        $fileCount = $files.Count
        $counter = 0

        foreach ($file in $files) {
            $counter++
            $progress = ($counter / $fileCount) * 100
            #Write-Output "Copying files ($file)..." 
            Write-Progress -Activity "Copying files" -Status "$file" -PercentComplete $progress

            # Adjusting the destination file path calculation
            $destinationFilePath = Join-Path $destinationPath $file.FullName.Substring($currentPath.Length + 1)

            Copy-Item -Path $file.FullName -Destination $destinationFilePath -Force -ErrorAction Stop
        }


        Write-Host "Copy completed successfully."
    } catch {
        Write-Error "An error occurred: $_"
    }
}

function Add-ModuleToCurrentProfile {
  param (
    [string]$ProfilePath,
    [string]$ModuleName
  )

  # Create the profile file if it does not exist
  if (-not (Test-Path $ProfilePath)) {
    New-Item -ItemType File -Path $ProfilePath -Force | Out-Null
  }

  # Define the commands
  $silentImportCommand = "`$env:BrowserBoxSilentImport = `$true"
  $importModuleCommand = "Import-Module $ModuleName"

  # Read the profile content
  $profileContent = Get-Content $ProfilePath -Raw -ErrorAction SilentlyContinue

  # Check if the import module command already exists in the profile
  if ($profileContent -notmatch [regex]::Escape($importModuleCommand)) {
    # Add the import module command to the profile
    # Always add the silent import command
    Add-Content -Path $ProfilePath -Value $silentImportCommand
    Add-Content -Path $ProfilePath -Value $importModuleCommand
    Write-Host "Module '$ModuleName' has been added to the profile at $ProfilePath."
  } else {
    Write-Host "Module '$ModuleName' is already in the profile at $ProfilePath."
  }
}

