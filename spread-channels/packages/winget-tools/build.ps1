# build.ps1
# Builds install.ps1 into browserbox-installer.exe using ps2exe with specified metadata and options

# Install ps2exe if not already installed
$ps2exeModule = Get-Module -ListAvailable -Name ps2exe
if (-not $ps2exeModule) {

    Write-Host "Running as Administrator." -ForegroundColor Green
    Start-Sleep -Seconds 2

    Write-Host "Installing ps2exe module..." -ForegroundColor Cyan
    # Ensure running as Administrator (required for module installation)
    if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Host "Not running as Administrator. Relaunching..." -ForegroundColor Yellow
        $arguments = @(
            "-NoProfile"
            "-ExecutionPolicy", "Bypass"
            "-File", "`"$($MyInvocation.MyCommand.Path)`""
        )
        Start-Process powershell -Verb RunAs -ArgumentList $arguments
        Start-Sleep -Seconds 2
        return
    }

    try {
        Install-Module -Name ps2exe -Force -Scope AllUsers -ErrorAction Stop
        Write-Host "ps2exe installed successfully." -ForegroundColor Green
    } catch {
        Write-Error "Failed to install ps2exe module. Error: $($_.Exception.Message)"
        return
    }
} else {
    Write-Host "ps2exe module already installed -- skipping." -ForegroundColor Cyan
}

# Define metadata from Winget manifest
$metadata = @{
    Title           = "DOSAYGO.BrowserBox.Installer"
    Description     = "A secure and remote browser solution for government and regulated enterprises."
    Company         = "The Dosyago Corporation"
    Product         = "BrowserBox"
    Copyright       = "Copyright (c) 2025 The Dosyago Corporation"
    Trademark       = "DOSAYGO"
    Version         = "11.1.7"
}

# Define ps2exe options
$ps2exeParams = @{
    InputFile        = ".\install.ps1"
    OutputFile       = ".\browserbox-installer.exe"
    X64              = $true
    UNICODEEncoding  = $true
    Title            = $metadata.Title
    Description      = $metadata.Description
    Company          = $metadata.Company
    Product          = $metadata.Product
    Copyright        = $metadata.Copyright
    Trademark        = $metadata.Trademark
    Version          = $metadata.Version
}

# Build the EXE
Write-Host "Building browserbox-installer.exe..." -ForegroundColor Cyan
try {
    Invoke-PS2EXE @ps2exeParams -ErrorAction Stop
    Write-Host "✅ Successfully built browserbox-installer.exe with metadata:" -ForegroundColor Green
    Write-Host "  Title: $($metadata.Title)"
    Write-Host "  Description: $($metadata.Description)"
    Write-Host "  Company: $($metadata.Company)"
    Write-Host "  Product: $($metadata.Product)"
    Write-Host "  Copyright: $($metadata.Copyright)"
    Write-Host "  Trademark: $($metadata.Trademark)"
    Write-Host "  Version: $($metadata.Version)`n"
} catch {
    Write-Error "❌ Failed to build browserbox-installer.exe. Error: $($_.Exception.Message)"
    return
}

Write-Host "Build complete! You can find browserbox-installer.exe in the current directory." -ForegroundColor Green
