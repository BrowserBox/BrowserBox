param(
  [int]$MaxAttempts = 2
)

$ErrorActionPreference = 'Stop'
$ciE2EScript = Join-Path $PSScriptRoot 'bbx-ci-e2e.mjs'
$setupPort = 11111
if (-not [string]::IsNullOrWhiteSpace($env:BBX_NG_SETUP_PORT)) {
  try {
    $setupPort = [int]$env:BBX_NG_SETUP_PORT
  } catch {
    throw "BBX_NG_SETUP_PORT must be an integer; got '$($env:BBX_NG_SETUP_PORT)'"
  }
}

function Reset-BbxState {
  Write-Host "Cleaning up BrowserBox state before retry..."
  try {
    bbx stop 2>$null | Out-Null
  } catch {
  }

  $nodeProcs = Get-Process -Name "browserbox", "browserbox-devtools" -ErrorAction SilentlyContinue
  if ($nodeProcs) {
    $nodeProcs | Stop-Process -Force -ErrorAction SilentlyContinue
  }

  if ($env:BBX_DONT_KILL_CHROME_ON_STOP -ne "true") {
    $browserProcs = Get-Process -Name "chrome", "msedge" -ErrorAction SilentlyContinue
    if ($browserProcs) {
      Write-Host "Cleaning up any remaining Chrome/Edge processes before retry..."
      $browserProcs | Stop-Process -Force -ErrorAction SilentlyContinue
    }
  }

  Start-Sleep -Seconds 5
}

function Invoke-BbxSagaAttempt {
  $wrtcSeedSource = Join-Path $env:USERPROFILE "build\Release\wrtc.node"
  if (-not (Test-Path $wrtcSeedSource)) {
    throw "Expected seeded wrtc.node at $wrtcSeedSource before Windows saga step"
  }

  $wrtcWatcher = Start-Job -Name "bbx-wrtc-temp-seeder" -ArgumentList $wrtcSeedSource -ScriptBlock {
    param($SeedSource)
    $deadline = (Get-Date).AddMinutes(8)
    while ((Get-Date) -lt $deadline) {
      Get-ChildItem -Path ([System.IO.Path]::GetTempPath()) -Directory -Filter 'sea-wrtc-*' -ErrorAction SilentlyContinue | ForEach-Object {
        $nativeDir = Join-Path $_.FullName "node_modules\@roamhq\wrtc-win32-x64"
        $nativePath = Join-Path $nativeDir "wrtc.node"
        if (-not (Test-Path $nativePath)) {
          New-Item -ItemType Directory -Path $nativeDir -Force | Out-Null
          Copy-Item -Path $SeedSource -Destination $nativePath -Force
        }
      }
      Start-Sleep -Milliseconds 250
    }
  }

  Write-Host "Started wrtc temp seeder job $($wrtcWatcher.Id) using $wrtcSeedSource"

  try {
    @('BBX_HOSTNAME','EMAIL','LICENSE_KEY','BBX_TEST_AGREEMENT','STATUS_MODE') | ForEach-Object {
      $val = [Environment]::GetEnvironmentVariable($_)
      Write-Host "$_ is $(if ($val) { 'set' } else { 'not set' })"
    }

    Write-Host "Using Windows saga setup port $setupPort"
    $setupOut = bbx setup -Hostname "$env:BBX_HOSTNAME" -Email "$env:EMAIL" -Port $setupPort 2>&1 | Tee-Object -Variable setupLog
    $loginLink = $null
    $linkFile = "$env:USERPROFILE\.config\dosaygo\bbpro\login.link"
    if (Test-Path $linkFile) {
      $loginLink = (Get-Content $linkFile -ErrorAction SilentlyContinue | Select-String 'https?://').ToString().Trim()
    }
    if (-not $loginLink) {
      $logText = ($setupLog | Out-String)
      $match = [regex]::Match($logText, 'https?://\S+/login\?token=\S+')
      if ($match.Success) { $loginLink = $match.Value.Trim() }
    }
    if (-not $loginLink) {
      $testEnv = "$env:USERPROFILE\.config\dosaygo\bbpro\test.env"
      if (Test-Path $testEnv) {
        $token = Select-String -Path $testEnv -Pattern 'LOGIN_TOKEN=(.+)' | ForEach-Object { $_.Matches.Groups[1].Value }
        if ($token) { $loginLink = "https://localhost:$setupPort/login?token=$token" }
      }
    }
    if (-not $loginLink) {
      throw "Could not determine login link"
    }

    Write-Host "Login link: $loginLink"
    "BBX_LOGIN_LINK=$loginLink" | Out-File -FilePath $env:GITHUB_ENV -Append -Encoding utf8

    bbx run
    Write-Host "Testing URL: $loginLink"
    $uri = [System.Uri]$loginLink
    $port = $uri.Port
    $chromeDebuggerPort = $port - 3000
    $chromeProbeOk = $false
    $chromeProbeUrl = $null
    $chromeProbeHosts = @("127.0.0.1", "localhost", "[::1]")
    for ($i = 0; $i -lt 10; $i++) {
      foreach ($probeHost in $chromeProbeHosts) {
        $probeUrl = "http://$probeHost`:$chromeDebuggerPort/json/version"
        Write-Host "Chrome debugger probe $($i + 1)/10 => $probeUrl"
        $chromeProbeBody = curl.exe -sS --max-time 5 "$probeUrl" 2>&1
        if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($chromeProbeBody)) {
          Write-Host "Chrome debugger probe succeeded:"
          Write-Host $chromeProbeBody
          $chromeProbeOk = $true
          $chromeProbeUrl = $probeUrl
          break
        }
        Write-Host "Chrome debugger probe failed: $chromeProbeBody"
      }
      if ($chromeProbeOk) { break }
      Start-Sleep -Seconds 5
    }

    $readyOk = $false
    for ($attempt = 1; $attempt -le 3; $attempt++) {
      Write-Host "Readiness attempt $attempt/3..."
      node $ciE2EScript ready "$loginLink" --timeout-ms=60000 --interval-ms=5000
      if ($LASTEXITCODE -eq 0) { $readyOk = $true; break }
      Write-Host "Attempt $attempt failed, checking if BBX is still alive..."
      $bbxProcs = Get-Process -Name "browserbox*" -ErrorAction SilentlyContinue
      if (-not $bbxProcs) {
        Write-Host "BBX process not running — dumping logs:"
        $logDir = "$env:USERPROFILE\.config\dosaygo\bbpro"
        Get-ChildItem "$logDir\*.log" -ErrorAction SilentlyContinue | ForEach-Object {
          Write-Host "=== $($_.Name) ==="
          Get-Content $_.FullName -Tail 40 -ErrorAction SilentlyContinue
        }
        throw "BBX exited before readiness check succeeded (likely license validation failure)"
      }
      if ($chromeProbeOk) {
        Write-Warning "BrowserBox Chrome debugger probe succeeded at $chromeProbeUrl but BBX app readiness still failed. This points to internal readiness/priming rather than Chrome bring-up."
      }
      Start-Sleep -Seconds 5
    }
    if (-not $readyOk) { throw "Readiness check failed after 3 attempts" }

    $devtoolsPort = $port + 1
    $devtoolsLink = $loginLink.Replace(":$port", ":$devtoolsPort")
    Write-Host "Testing Devtools URL: $devtoolsLink"
    $devtoolsOk = $false
    for ($i = 0; $i -lt 10; $i++) {
      $response = curl.exe -k -L --max-time 10 "$devtoolsLink" -o NUL -w "%{http_code}" 2>$null
      if ($response -ne "000") { $devtoolsOk = $true; break }
      Write-Host "  Devtools probe $($i + 1)/10 — retrying in 5s..."
      Start-Sleep -Seconds 5
    }
    if (-not $devtoolsOk) { throw "Devtools connection failed after 10 attempts" }
    Write-Host "Devtools connection successful: $response"

    Write-Host "Waiting 30 seconds to verify link stability..."
    Start-Sleep -Seconds 30

    node $ciE2EScript ready "$loginLink" --timeout-ms=45000 --interval-ms=4000
    if ($LASTEXITCODE -ne 0) { throw "Second readiness check failed" }

    $response = curl.exe -k -L --max-time 10 "$devtoolsLink" -o NUL -w "%{http_code}" 2>$null
    if ($response -eq "000") { throw "Second devtools check failed: HTTP $response" }
    Write-Host "Second verification (Devtools) successful: $response"
  } finally {
    if ($wrtcWatcher) {
      Stop-Job -Job $wrtcWatcher -ErrorAction SilentlyContinue
      Receive-Job -Job $wrtcWatcher -ErrorAction SilentlyContinue | Out-Host
      Remove-Job -Job $wrtcWatcher -Force -ErrorAction SilentlyContinue
    }
  }
}

for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
  Write-Host "BBX Windows saga attempt $attempt/$MaxAttempts"
  try {
    Invoke-BbxSagaAttempt
    exit 0
  } catch {
    if ($attempt -ge $MaxAttempts) {
      throw
    }

    Write-Warning ("BBX Windows saga failed on attempt {0}/{1}: {2}" -f $attempt, $MaxAttempts, $_.Exception.Message)
    Reset-BbxState
  }
}
