
# run-pm2.ps1 PowerShell Script

# Fetch the username and log it
$username = $env:USERNAME
Write-Host "Starting viewfinder service cluster as $username"
# Start various services using pm2

# Starting audio service
Write-Host "Starting audio service..."
pm2 start ".\scripts\global\start_audio.ps1" -- $args[0]

# Starting main bbpro service
Write-Host "Starting main bbpro service..."
Set-Location -Path $env:INSTALL_DIR
pm2 start ".\scripts\basic-bb-main-service.ps1" -- $args[0]

# Starting secure remote devtools service
Write-Host "Starting secure remote devtools service..."
Set-Location -Path ".\src\services\pool\crdp-secure-proxy-server"
pm2 start ".\devtools-server.ps1" -- $args[0]

# Starting secure document viewer service
Write-Host "Starting secure document viewer service..."
Set-Location -Path $env:INSTALL_DIR
Set-Location -Path ".\src\services\pool\chai"
Invoke-Expression -Command ".\scripts\restart.ps1 $args[0]"
