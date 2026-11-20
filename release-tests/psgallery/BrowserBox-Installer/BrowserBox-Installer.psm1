# BrowserBox-Installer Module
# Provides commands to install BrowserBox on Windows

function Install-BrowserBox {
    # Not an advanced function on purpose: unknown switches such as -Help pass straight through to the installer.
    # Updated to look in the tools folder
    & "$PSScriptRoot\tools\install.ps1" @args
}

# Export functions
Export-ModuleMember -Function Install-BrowserBox
