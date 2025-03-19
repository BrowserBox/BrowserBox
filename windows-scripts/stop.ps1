# stop.ps1
# Located at C:\Program Files\browserbox\windows-scripts\stop.ps1
[CmdletBinding()]
param ()

# Stop BrowserBox services by process name first
$processes = @("browserbox", "browserbox-devtools")
foreach ($procName in $processes) {
    $proc = Get-Process -Name $procName -ErrorAction SilentlyContinue
    if ($proc) {
        Stop-Process -Name $procName -Force
        Write-Host "Stopped $procName service." -ForegroundColor Cyan
    } else {
        Write-Host "$procName service not running." -ForegroundColor Yellow
    }
}

# Backup: Kill node processes running server.js or index.js
$nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*server.js*" -or $_.CommandLine -like "*index.js*"
}
if ($nodeProcs) {
    $nodeProcs | Stop-Process -Force
    Write-Host "Stopped additional Node.js BrowserBox processes." -ForegroundColor Cyan
} else {
    Write-Host "No additional Node.js BrowserBox processes found." -ForegroundColor Yellow
}

Write-Host "BrowserBox services stopped successfully." -ForegroundColor Green
