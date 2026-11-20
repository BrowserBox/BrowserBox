# BrowserBox-Installer Module
# Provides commands to install BrowserBox on Windows

function Install-BrowserBox {
    [CmdletBinding()]
    param()
    # Updated to look in the tools folder
    & "$PSScriptRoot\tools\install.ps1" @args
}

# Export functions
Export-ModuleMember -Function Install-BrowserBox
