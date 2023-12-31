
function InitiateLocalRDPSession {
  param (
    [string]$password,
    [int]$retryCount = 2,
    [int]$retryInterval = 5
  )

  $username = $env:USERNAME
  $localComputerName = [System.Environment]::MachineName

  cmdkey /generic:TERMSRV/$localComputerName /user:$username /pass:$password
  Write-Host "Credentials Stored for RDP"

  for ($i = 0; $i -lt $retryCount; $i++) {
    mstsc /v:$localComputerName
    Start-Sleep -Seconds 5 # Wait a bit for mstsc to possibly initiate

    # Get the list of sessions, excluding the current one
    $rdpSessions = qwinsta /SERVER:$localComputerName | Where-Object { $_ -notmatch "^>" -and $_ -match "\brdp-tcp\b" } 
    $activeSession = $rdpSessions | Select-String $username

    if ($activeSession) {
      Write-Host "RDP Session initiated successfully."
      return
    } else {
      Write-Host "RDP Session failed to initiate. Retrying in $retryInterval seconds..."
      Start-Sleep -Seconds $retryInterval
    }
  }

  Write-Error "Failed to initiate RDP Session after $retryCount attempts."
}

sleep 20
InitiateLocalRDPSession 

