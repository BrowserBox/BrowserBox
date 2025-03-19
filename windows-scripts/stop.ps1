# stop.ps1
# Located at C:\Program Files\browserbox\windows-scripts\stop.ps1
[CmdletBinding()]
param ()

# Stop BrowserBox services by process name
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

Write-Host "BrowserBox services stopped successfully." -ForegroundColor Green
