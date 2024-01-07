function Get-DestinationDirectory {
  $programFilesPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::ProgramFiles)
  $destinationPath = Join-Path $programFilesPath -ChildPath "DOSYAGO"
  
  if (-not (Test-Path -Path $destinationPath)) {
    New-Item -ItemType Directory -Path $destinationPath -Force
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
