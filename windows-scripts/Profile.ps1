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

