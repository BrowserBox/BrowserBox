# Do not call this, it is only for use Start-BrowserBox when it detects Windows Server

$env:BrowserBoxSilentImport = $true
Import-Module BrowserBox-Tools
Start-BrowserBox -NoBranch
