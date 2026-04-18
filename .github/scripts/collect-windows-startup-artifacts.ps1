[CmdletBinding()]
param(
  [Parameter(Mandatory = $false)]
  [string]$OutputDir = ""
)

$ErrorActionPreference = 'Stop'

function Get-BbxConfigRoot {
  return Join-Path $env:USERPROFILE ".config\dosaygo\bbpro"
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

function Write-JsonFile {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [AllowNull()]
    [object]$Value
  )

  New-Item -ItemType Directory -Path (Split-Path -Parent $Path) -Force | Out-Null
  $json = $Value | ConvertTo-Json -Depth 8
  Set-Content -Path $Path -Value $json -Encoding utf8
}

function Write-DirectoryListing {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SourceDir,
    [Parameter(Mandatory = $true)]
    [string]$OutputPath,
    [int]$MaxEntries = 600
  )

  $entries = @()
  if (Test-Path $SourceDir) {
    $entries = @(Get-ChildItem -Path $SourceDir -Force -Recurse -ErrorAction SilentlyContinue |
      Select-Object -First $MaxEntries FullName, Name, Length, Mode, LastWriteTimeUtc, PSIsContainer)
  }
  Write-JsonFile -Path $OutputPath -Value $entries
}

function Copy-DirectoryTreeIfPresent {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SourceDir,
    [Parameter(Mandatory = $true)]
    [string]$DestinationDir
  )

  if (-not (Test-Path $SourceDir)) {
    return
  }

  Copy-Item -Path $SourceDir -Destination $DestinationDir -Recurse -Force
}

function Write-JoinedChromeStdioLogs {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ChromeLogDir
  )

  if (-not (Test-Path $ChromeLogDir)) {
    return
  }

  $stdoutLogs = @(Get-ChildItem -Path $ChromeLogDir -File -Filter 'chrome-*-stdout.log' -ErrorAction SilentlyContinue)
  foreach ($stdoutLog in $stdoutLogs) {
    $baseName = $stdoutLog.BaseName -replace '-stdout$', ''
    $stderrLog = Join-Path $ChromeLogDir ("{0}-stderr.log" -f $baseName)
    $joinedLog = Join-Path $ChromeLogDir ("{0}-stdio.log" -f $baseName)
    $sections = New-Object System.Collections.Generic.List[string]

    if (Test-Path $stderrLog) {
      $sections.Add(("===== {0} =====" -f (Split-Path $stderrLog -Leaf)))
      $sections.Add((Get-Content -Path $stderrLog -Raw -ErrorAction SilentlyContinue))
    }

    $sections.Add(("===== {0} =====" -f $stdoutLog.Name))
    $sections.Add((Get-Content -Path $stdoutLog.FullName -Raw -ErrorAction SilentlyContinue))

    Set-Content -Path $joinedLog -Value ($sections -join [Environment]::NewLine) -Encoding utf8
  }
}

if ([string]::IsNullOrWhiteSpace($OutputDir)) {
  $OutputDir = Join-Path $env:RUNNER_TEMP "bbx-windows-startup-artifacts"
}

Remove-Item -Path $OutputDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

$configRoot = Get-BbxConfigRoot
$serviceLogRoot = Join-Path $configRoot "service_logs"
$legacyLogRoot = Join-Path $configRoot "logs"
$browserCacheRoot = Join-Path $configRoot "browser-cache"
$browserCrashRoot = Join-Path $configRoot "browser-crashes"
$tempPath = [System.IO.Path]::GetTempPath()
$loginLink = $env:BBX_LOGIN_LINK
$loginLinkFile = Join-Path $configRoot "login.link"

if (-not $loginLink -and (Test-Path $loginLinkFile)) {
  $loginLink = (Get-Content $loginLinkFile -ErrorAction SilentlyContinue | Select-Object -First 1)
}

$appPort = $null
$chromeDebuggerPort = $null
if ($loginLink) {
  try {
    $uri = [System.Uri]$loginLink
    $appPort = $uri.Port
    $chromeDebuggerPort = $appPort - 3000
  } catch {}
}

$chromePath = Resolve-ChromePath
$chromeVersion = $null
if ($chromePath) {
  try {
    $chromeVersion = (Get-Item $chromePath).VersionInfo.ProductVersion
  } catch {}
}

$windowsVersion = $null
try {
  $windowsVersion = Get-CimInstance Win32_OperatingSystem |
    Select-Object Caption, Version, BuildNumber, OSArchitecture, CSName, LastBootUpTime
} catch {}

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString('o')
  cwd = (Get-Location).Path
  configRoot = $configRoot
  loginLink = $loginLink
  appPort = $appPort
  chromeDebuggerPort = $chromeDebuggerPort
  chrome = [ordered]@{
    path = $chromePath
    version = $chromeVersion
    candidates = @(Get-ChromeCandidates)
  }
  windows = $windowsVersion
  env = [ordered]@{
    BBX_NO_UPDATE = $env:BBX_NO_UPDATE
    BBX_CI_APP_PORT = $env:BBX_CI_APP_PORT
    BBX_WINDOWS_STARTUP_TRACE = $env:BBX_WINDOWS_STARTUP_TRACE
    BBX_CHROME_STDIO_LOGGING = $env:BBX_CHROME_STDIO_LOGGING
    GITHUB_RUN_ID = $env:GITHUB_RUN_ID
    GITHUB_RUN_ATTEMPT = $env:GITHUB_RUN_ATTEMPT
  }
}
Write-JsonFile -Path (Join-Path $OutputDir "summary.json") -Value $summary

Copy-DirectoryTreeIfPresent -SourceDir $serviceLogRoot -DestinationDir (Join-Path $OutputDir "service_logs")
Copy-DirectoryTreeIfPresent -SourceDir $legacyLogRoot -DestinationDir (Join-Path $OutputDir "legacy_logs")
Write-JoinedChromeStdioLogs -ChromeLogDir (Join-Path $OutputDir "service_logs\chrome")

foreach ($fileName in @('test.env', 'login.link')) {
  $source = Join-Path $configRoot $fileName
  if (Test-Path $source) {
    $dest = Join-Path (Join-Path $OutputDir "config") $fileName
    New-Item -ItemType Directory -Path (Split-Path -Parent $dest) -Force | Out-Null
    Copy-Item -Path $source -Destination $dest -Force
  }
}

Write-DirectoryListing -SourceDir $serviceLogRoot -OutputPath (Join-Path $OutputDir "service-log-listing.json")
Write-DirectoryListing -SourceDir $legacyLogRoot -OutputPath (Join-Path $OutputDir "legacy-log-listing.json")
Write-DirectoryListing -SourceDir $browserCacheRoot -OutputPath (Join-Path $OutputDir "browser-cache-listing.json")
Write-DirectoryListing -SourceDir $browserCrashRoot -OutputPath (Join-Path $OutputDir "browser-crashes-listing.json")

$devToolsActivePort = Join-Path $browserCacheRoot "DevToolsActivePort"
if (Test-Path $devToolsActivePort) {
  Copy-Item -Path $devToolsActivePort -Destination (Join-Path $OutputDir "browser-cache\DevToolsActivePort") -Force
}

$seaWrtcDirs = @(Get-ChildItem -Path $tempPath -Directory -Filter 'sea-wrtc-*' -ErrorAction SilentlyContinue |
  Select-Object FullName, Name, CreationTimeUtc, LastWriteTimeUtc)
Write-JsonFile -Path (Join-Path $OutputDir "sea-wrtc-dirs.json") -Value $seaWrtcDirs
foreach ($dir in $seaWrtcDirs) {
  $safeName = ($dir.Name -replace '[^A-Za-z0-9._-]', '_')
  Write-DirectoryListing -SourceDir $dir.FullName -OutputPath (Join-Path $OutputDir ("sea-wrtc-listings\{0}.json" -f $safeName))
}

if ($appPort) {
  $listenerSnapshot = [ordered]@{
    appPort = [ordered]@{
      port = $appPort
      listeners = @(Get-PortListeners -Port $appPort)
    }
    chromeDebuggerPort = [ordered]@{
      port = $chromeDebuggerPort
      listeners = @(Get-PortListeners -Port $chromeDebuggerPort)
    }
  }
  Write-JsonFile -Path (Join-Path $OutputDir "port-listeners.json") -Value $listenerSnapshot
}
