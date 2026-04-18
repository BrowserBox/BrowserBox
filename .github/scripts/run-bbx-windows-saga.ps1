param(
  [int]$MaxAttempts = 2
)

$ErrorActionPreference = 'Stop'
$ciE2EScript = Join-Path $PSScriptRoot 'bbx-ci-e2e.mjs'
$script:CurrentStartupTracePath = $null

function Get-BbxConfigRoot {
  return Join-Path $env:USERPROFILE ".config\dosaygo\bbpro"
}

function Get-WindowsStartupTraceRoot {
  return Join-Path (Join-Path (Get-BbxConfigRoot) "service_logs") "windows-startup"
}

function Get-TextPreview {
  param(
    [AllowNull()]
    [string]$Text,
    [int]$MaxLength = 240
  )

  if ([string]::IsNullOrEmpty($Text)) {
    return ""
  }
  if ($Text.Length -le $MaxLength) {
    return $Text
  }
  return $Text.Substring(0, $MaxLength)
}

function Get-CiAppPort {
  $rawPort = [Environment]::GetEnvironmentVariable('BBX_CI_APP_PORT')
  if ([string]::IsNullOrWhiteSpace($rawPort)) {
    return 11111
  }

  $parsedPort = 0
  if (-not [int]::TryParse($rawPort, [ref]$parsedPort) -or $parsedPort -lt 1024 -or $parsedPort -gt 65535) {
    throw "Invalid BBX_CI_APP_PORT '$rawPort'. Expected an integer port between 1024 and 65535."
  }

  return $parsedPort
}

function Write-StartupTrace {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Phase,
    [hashtable]$Details = @{}
  )

  if ([string]::IsNullOrWhiteSpace($script:CurrentStartupTracePath)) {
    return
  }

  $entry = [ordered]@{
    ts = (Get-Date).ToUniversalTime().ToString('o')
    phase = $Phase
    details = $Details
  }
  $json = $entry | ConvertTo-Json -Depth 8 -Compress
  Add-Content -Path $script:CurrentStartupTracePath -Value $json
}

function Get-PortListeners {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Port
  )

  $results = @()
  $listeners = @()
  try {
    $listeners = @(Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
  } catch {
    return @()
  }

  foreach ($listener in $listeners) {
    $processName = $null
    $processPath = $null
    try {
      $process = Get-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue
      if ($process) {
        $processName = $process.ProcessName
        $processPath = $process.Path
      }
    } catch {}

    $results += [ordered]@{
      localAddress  = $listener.LocalAddress
      localPort     = $listener.LocalPort
      state         = $listener.State.ToString()
      owningProcess = $listener.OwningProcess
      processName   = $processName
      processPath   = $processPath
    }
  }

  return $results
}

function Wait-ForPortListener {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Port,
    [int]$TimeoutSeconds = 360,
    [int]$PollMilliseconds = 1000,
    [string]$ExpectedProcessName = "",
    [string]$TracePrefix = "port-wait"
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  $attempt = 0

  while ((Get-Date) -lt $deadline) {
    $attempt += 1
    $allListeners = @(Get-PortListeners -Port $Port)
    $matchingListeners = $allListeners
    if (-not [string]::IsNullOrWhiteSpace($ExpectedProcessName)) {
      $matchingListeners = @($allListeners | Where-Object { $_.processName -eq $ExpectedProcessName })
    }

    if ($matchingListeners.Count -gt 0) {
      Write-StartupTrace ("{0}-success" -f $TracePrefix) @{
        attempt = $attempt
        port = $Port
        timeoutSeconds = $TimeoutSeconds
        expectedProcessName = $ExpectedProcessName
        listeners = @($matchingListeners)
        allListeners = @($allListeners)
      }
      return $matchingListeners
    }

    if ($attempt -eq 1 -or ($attempt % 10) -eq 0) {
      Write-Host "Waiting for port $Port to start listening..."
    }
    if ($attempt -eq 1 -or ($attempt % 5) -eq 0) {
      $bbxProcs = @(Get-Process -Name "browserbox*" -ErrorAction SilentlyContinue)
      Write-StartupTrace ("{0}-pending" -f $TracePrefix) @{
        attempt = $attempt
        port = $Port
        timeoutSeconds = $TimeoutSeconds
        expectedProcessName = $ExpectedProcessName
        allListeners = @($allListeners)
        bbxProcessCount = $bbxProcs.Count
      }
    }

    Start-Sleep -Milliseconds $PollMilliseconds
  }

  $finalListeners = @(Get-PortListeners -Port $Port)
  Write-StartupTrace ("{0}-failed" -f $TracePrefix) @{
    port = $Port
    timeoutSeconds = $TimeoutSeconds
    expectedProcessName = $ExpectedProcessName
    allListeners = @($finalListeners)
  }
  throw "Timed out waiting for port $Port to start listening."
}

function Get-ChromeCandidates {
  $candidates = New-Object System.Collections.Generic.List[string]

  foreach ($envVar in @('CHROME_PATH', 'LIGHTHOUSE_CHROMIUM_PATH')) {
    $value = [Environment]::GetEnvironmentVariable($envVar)
    if (-not [string]::IsNullOrWhiteSpace($value)) {
      $candidates.Add($value)
    }
  }

  foreach ($root in @($env:LOCALAPPDATA, $env:ProgramFiles, ${env:ProgramFiles(x86)})) {
    if ([string]::IsNullOrWhiteSpace($root)) { continue }
    $candidates.Add((Join-Path $root 'Google\Chrome SxS\Application\chrome.exe'))
    $candidates.Add((Join-Path $root 'Google\Chrome\Application\chrome.exe'))
  }

  return $candidates | Where-Object { $_ } | Select-Object -Unique
}

function Resolve-ChromePath {
  foreach ($candidate in @(Get-ChromeCandidates)) {
    if (Test-Path $candidate) {
      return (Resolve-Path $candidate).Path
    }
  }
  return $null
}

function Get-ChromeMetadata {
  $chromePath = Resolve-ChromePath
  $chromeVersion = $null
  if ($chromePath) {
    try {
      $chromeVersion = (Get-Item $chromePath).VersionInfo.ProductVersion
    } catch {}
  }

  return [ordered]@{
    path = $chromePath
    version = $chromeVersion
    candidates = @(Get-ChromeCandidates)
  }
}

function Reset-BbxState {
  Write-Host "Cleaning up BrowserBox state before retry..."
  Write-StartupTrace "retry-cleanup-start"
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
  Write-StartupTrace "retry-cleanup-complete"
}

function Invoke-BbxSagaAttempt {
  param(
    [Parameter(Mandatory = $true)]
    [int]$AttemptNumber
  )

  $configRoot = Get-BbxConfigRoot
  $traceRoot = Get-WindowsStartupTraceRoot
  New-Item -ItemType Directory -Path $traceRoot -Force | Out-Null
  $script:CurrentStartupTracePath = Join-Path $traceRoot ("attempt-{0}.ndjson" -f $AttemptNumber)
  Remove-Item -Path $script:CurrentStartupTracePath -Force -ErrorAction SilentlyContinue

  $wrtcSeedSource = Join-Path $env:USERPROFILE "build\Release\wrtc.node"
  if (-not (Test-Path $wrtcSeedSource)) {
    throw "Expected seeded wrtc.node at $wrtcSeedSource before Windows saga step"
  }

  $wrtcWatcher = $null

  try {
    $appPort = Get-CiAppPort
    $windowsVersion = $null
    try {
      $windowsVersion = Get-CimInstance Win32_OperatingSystem |
        Select-Object Caption, Version, BuildNumber, OSArchitecture, CSName
    } catch {}

    Write-StartupTrace "saga-attempt-start" @{
      attempt = $AttemptNumber
      maxAttempts = $MaxAttempts
      cwd = (Get-Location).Path
      configRoot = $configRoot
      tempPath = [System.IO.Path]::GetTempPath()
      bbxNoUpdate = $env:BBX_NO_UPDATE
      ciAppPort = $appPort
      ciChromeDebuggerPort = $appPort - 3000
      startupTrace = $env:BBX_WINDOWS_STARTUP_TRACE
      chromeStdioLogging = $env:BBX_CHROME_STDIO_LOGGING
      nodePath = (Get-Command node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue)
      chrome = Get-ChromeMetadata
      windows = $windowsVersion
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
    Write-StartupTrace "wrtc-temp-seeder-started" @{
      jobId = $wrtcWatcher.Id
      source = $wrtcSeedSource
    }

    @('BBX_HOSTNAME','EMAIL','LICENSE_KEY','BBX_TEST_AGREEMENT','STATUS_MODE') | ForEach-Object {
      $val = [Environment]::GetEnvironmentVariable($_)
      Write-Host "$_ is $(if ($val) { 'set' } else { 'not set' })"
    }

    Write-StartupTrace "bbx-setup-start" @{
      hostname = $env:BBX_HOSTNAME
      email = $env:EMAIL
      port = $appPort
    }
    $setupOut = bbx setup -Hostname "$env:BBX_HOSTNAME" -Email "$env:EMAIL" -Port $appPort 2>&1 | Tee-Object -Variable setupLog
    $setupText = ($setupLog | Out-String)
    $loginLink = $null
    $linkFile = Join-Path $configRoot "login.link"
    if (Test-Path $linkFile) {
      $loginLink = (Get-Content $linkFile -ErrorAction SilentlyContinue | Select-String 'https?://').ToString().Trim()
    }
    if (-not $loginLink) {
      $match = [regex]::Match($setupText, 'https?://\S+/login\?token=\S+')
      if ($match.Success) { $loginLink = $match.Value.Trim() }
    }
    if (-not $loginLink) {
      $testEnv = Join-Path $configRoot "test.env"
      if (Test-Path $testEnv) {
        $token = Select-String -Path $testEnv -Pattern 'LOGIN_TOKEN=(.+)' | ForEach-Object { $_.Matches.Groups[1].Value }
        if ($token) { $loginLink = "https://localhost:$appPort/login?token=$token" }
      }
    }
    if (-not $loginLink) {
      throw "Could not determine login link"
    }

    Write-StartupTrace "bbx-setup-complete" @{
      loginLink = $loginLink
      setupOutputPreview = Get-TextPreview -Text $setupText -MaxLength 1200
      linkFile = $linkFile
    }

    Write-Host "Login link: $loginLink"
    "BBX_LOGIN_LINK=$loginLink" | Out-File -FilePath $env:GITHUB_ENV -Append -Encoding utf8

    Write-StartupTrace "bbx-run-start"
    bbx run
    Write-StartupTrace "bbx-run-dispatched"

    Write-Host "Testing URL: $loginLink"
    $uri = [System.Uri]$loginLink
    $port = $uri.Port
    $chromeDebuggerPort = $port - 3000
    Write-StartupTrace "port-resolution" @{
      loginLink = $loginLink
      appPort = $port
      chromeDebuggerPort = $chromeDebuggerPort
      preexistingChromeListeners = @(Get-PortListeners -Port $chromeDebuggerPort)
      preexistingAppListeners = @(Get-PortListeners -Port $port)
    }

    Write-Host "Waiting for BrowserBox app port $port to start listening before Chrome/debugger probes..."
    Write-StartupTrace "app-port-wait-start" @{
      appPort = $port
      expectedProcessName = "browserbox"
      timeoutSeconds = 360
    }
    $appListeners = @(Wait-ForPortListener -Port $port -TimeoutSeconds 360 -ExpectedProcessName "browserbox" -TracePrefix "app-port-wait")
    Write-Host "BrowserBox app port is now listening."

    $chromeProbeOk = $false
    $chromeProbeUrl = $null
    $chromeProbeHosts = @("127.0.0.1", "localhost", "[::1]")
    for ($i = 0; $i -lt 10; $i++) {
      foreach ($probeHost in $chromeProbeHosts) {
        $probeUrl = "http://$probeHost`:$chromeDebuggerPort/json/version"
        Write-Host "Chrome debugger probe $($i + 1)/10 => $probeUrl"
        Write-StartupTrace "chrome-probe-attempt" @{
          attempt = $i + 1
          host = $probeHost
          url = $probeUrl
        }
        $chromeProbeBody = curl.exe -sS --max-time 5 "$probeUrl" 2>&1
        if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($chromeProbeBody)) {
          Write-Host "Chrome debugger probe succeeded:"
          Write-Host $chromeProbeBody
          $chromeProbeOk = $true
          $chromeProbeUrl = $probeUrl
          Write-StartupTrace "chrome-probe-success" @{
            attempt = $i + 1
            host = $probeHost
            url = $probeUrl
            appListeners = @($appListeners)
            responsePreview = Get-TextPreview -Text $chromeProbeBody -MaxLength 1200
          }
          break
        }
        Write-Host "Chrome debugger probe failed: $chromeProbeBody"
        Write-StartupTrace "chrome-probe-failed" @{
          attempt = $i + 1
          host = $probeHost
          url = $probeUrl
          exitCode = $LASTEXITCODE
          error = Get-TextPreview -Text $chromeProbeBody -MaxLength 800
          listeners = @(Get-PortListeners -Port $chromeDebuggerPort)
        }
      }
      if ($chromeProbeOk) { break }
      Start-Sleep -Seconds 5
    }

    $readyOk = $false
    for ($attempt = 1; $attempt -le 3; $attempt++) {
      Write-Host "Readiness attempt $attempt/3..."
      Write-StartupTrace "browserbox-ready-attempt" @{
        attempt = $attempt
        url = $loginLink
      }
      node $ciE2EScript ready "$loginLink" --timeout-ms=60000 --interval-ms=5000
      if ($LASTEXITCODE -eq 0) {
        $readyOk = $true
        Write-StartupTrace "browserbox-ready-success" @{
          attempt = $attempt
          url = $loginLink
        }
        break
      }
      Write-Host "Attempt $attempt failed, checking if BBX is still alive..."
      $bbxProcs = Get-Process -Name "browserbox*" -ErrorAction SilentlyContinue
      Write-StartupTrace "browserbox-ready-failed" @{
        attempt = $attempt
        url = $loginLink
        exitCode = $LASTEXITCODE
        bbxProcessCount = @($bbxProcs).Count
        chromeProbeOk = $chromeProbeOk
        chromeProbeUrl = $chromeProbeUrl
        appListeners = @(Get-PortListeners -Port $port)
        chromeListeners = @(Get-PortListeners -Port $chromeDebuggerPort)
      }
      if (-not $bbxProcs) {
        Write-Host "BBX process not running — dumping logs:"
        $logDir = Join-Path $configRoot "service_logs"
        Get-ChildItem "$logDir\*.log" -ErrorAction SilentlyContinue | ForEach-Object {
          Write-Host "=== $($_.Name) ==="
          Get-Content $_.FullName -Tail 40 -ErrorAction SilentlyContinue
        }
        Write-StartupTrace "browserbox-process-missing" @{
          logDir = $logDir
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
      if ($response -ne "000") {
        $devtoolsOk = $true
        Write-StartupTrace "devtools-probe-success" @{
          attempt = $i + 1
          url = $devtoolsLink
          status = $response
        }
        break
      }
      Write-Host "  Devtools probe $($i + 1)/10 — retrying in 5s..."
      Write-StartupTrace "devtools-probe-failed" @{
        attempt = $i + 1
        url = $devtoolsLink
        status = $response
      }
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
    Write-StartupTrace "saga-attempt-succeeded" @{
      attempt = $AttemptNumber
      loginLink = $loginLink
      appPort = $port
      chromeDebuggerPort = $chromeDebuggerPort
      devtoolsPort = $devtoolsPort
    }
  } catch {
    Write-StartupTrace "saga-attempt-failed" @{
      attempt = $AttemptNumber
      error = $_.Exception.Message
      stack = $_.ScriptStackTrace
    }
    throw
  } finally {
    if ($wrtcWatcher) {
      Stop-Job -Job $wrtcWatcher -ErrorAction SilentlyContinue
      Receive-Job -Job $wrtcWatcher -ErrorAction SilentlyContinue | Out-Host
      Remove-Job -Job $wrtcWatcher -Force -ErrorAction SilentlyContinue
      Write-StartupTrace "wrtc-temp-seeder-stopped" @{
        jobId = $wrtcWatcher.Id
      }
    }
    $script:CurrentStartupTracePath = $null
  }
}

for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
  Write-Host "BBX Windows saga attempt $attempt/$MaxAttempts"
  try {
    Invoke-BbxSagaAttempt -AttemptNumber $attempt
    exit 0
  } catch {
    if ($attempt -ge $MaxAttempts) {
      throw
    }

    Write-Warning ("BBX Windows saga failed on attempt {0}/{1}: {2}" -f $attempt, $MaxAttempts, $_.Exception.Message)
    Reset-BbxState
  }
}
