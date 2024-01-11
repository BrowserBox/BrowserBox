# Do not call this, it is only for use Start-BrowserBox when it detects Windows Server

$env:BrowserBoxSilentImport = $true
Import-Module BrowserBox-Installer
Start-BrowserBox -NoBranch
