# bbx.ps1 - BrowserBox Binary Installer & Wrapper for Windows
# This script downloads and runs pre-compiled BrowserBox binaries
# from the public BrowserBox/BrowserBox repository.

$ErrorActionPreference = "Stop"

$global:LASTEXITCODE = 0

if ($env:BBX_DEBUG_CLI -and $env:BBX_DEBUG_CLI -ne "0" -and $env:BBX_DEBUG_CLI.ToLowerInvariant() -ne "false") {
    try {
        Write-Host "[bbx] PSVersion: $($PSVersionTable.PSVersion)" -ForegroundColor DarkGray
    } catch { }
    Write-Host "[bbx] Script: $($MyInvocation.MyCommand.Path)" -ForegroundColor DarkGray
}

# Configuration
$PublicRepo = "BrowserBox/BrowserBox"
$ReleaseRepo = if ($env:BBX_RELEASE_REPO) { $env:BBX_RELEASE_REPO } else { $PublicRepo }
$Token = if ($env:GH_TOKEN) { $env:GH_TOKEN } elseif ($env:GITHUB_TOKEN) { $env:GITHUB_TOKEN } else { "" }
$NoUpdate = $false
if ($null -ne $env:BBX_NO_UPDATE -and $env:BBX_NO_UPDATE -ne "") {
    try {
        $NoUpdate = [System.Convert]::ToBoolean($env:BBX_NO_UPDATE)
    } catch {
        $NoUpdate = ($env:BBX_NO_UPDATE.ToLowerInvariant() -in @("1", "true", "yes", "y", "on"))
    }
}
$BinaryDir = "$env:LOCALAPPDATA\browserbox\bin"

# Local Name (on disk)
$BinaryName = "browserbox.exe"
# Remote Name (on GitHub Release)
$RemoteAssetName = "browserbox-win-x64.exe"

$BinaryPath = Join-Path $BinaryDir $BinaryName
$script:ResolvedBinaryPath = $null

$ScriptMap = @{
    "install"   = "install.ps1"
    "update"    = "update.ps1"
    "setup"     = "setup.ps1"
    "run"       = "start.ps1"
    "start"     = "start.ps1"
    "stop"      = "stop.ps1"
    "certify"   = "certify.ps1"
    "prepare"   = "prepare.ps1"
    "uninstall" = "uninstall.ps1"
}

function Resolve-BrowserBoxBinary {
    if ($env:BBX_BINARY_PATH -and (Test-Path $env:BBX_BINARY_PATH)) {
        return $env:BBX_BINARY_PATH
    }

    if (Test-Path $BinaryPath) {
        return $BinaryPath
    }

    $cmd = Get-Command $BinaryName -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Path -and (Test-Path $cmd.Path)) {
        return $cmd.Path
    }

    $cmd = Get-Command "browserbox" -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Path -and (Test-Path $cmd.Path)) {
        return $cmd.Path
    }

    return $null
}

# Function to ensure binary directory exists
function Ensure-BinaryDir {
    if (-not (Test-Path $BinaryDir)) {
        New-Item -ItemType Directory -Path $BinaryDir -Force | Out-Null
    }
}

# Function to get the latest release tag from GitHub
function Get-LatestRelease {
    param([string]$Repo)

    if ($NoUpdate) {
        if ($env:BBX_RELEASE_TAG) { return $env:BBX_RELEASE_TAG }
        return $null
    }
    
    $headers = @{}
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    
    # 1. Try "Latest" endpoint (works for Stable)
    try {
        $apiUrl = "https://api.github.com/repos/$Repo/releases/latest"
        $response = Invoke-RestMethod -Uri $apiUrl -TimeoutSec 10 -Headers $headers -ErrorAction Stop
        return $response.tag_name
    }
    catch {
        # 2. Fallback: List releases (needed for Drafts/Prereleases sometimes invisible to 'latest')
        try {
            Write-Host "Latest release lookup failed (check for drafts), checking release list..." -ForegroundColor Gray
            $apiUrl = "https://api.github.com/repos/$Repo/releases?per_page=1"
            $response = Invoke-RestMethod -Uri $apiUrl -TimeoutSec 10 -Headers $headers -ErrorAction Stop
            if ($response -and $response.Count -gt 0) {
                return $response[0].tag_name
            }
        } catch {
            Write-Error "Failed to fetch latest release from $Repo : $_"
            exit 1
        }
    }
    return $null
}

# Function to download the binary
function Download-Binary {
    param(
        [string]$Tag
    )
    
    Ensure-BinaryDir
    
    $tempFile = "$BinaryPath.tmp"
    
    Write-Host "Downloading BrowserBox $Tag for Windows..." -ForegroundColor Cyan
    
    $headers = @{}
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }

    $useAssetApi = $Token -or ($ReleaseRepo -ne $PublicRepo)
    if ($ReleaseRepo -ne $PublicRepo -and -not $Token) {
        Write-Error "GH_TOKEN/GITHUB_TOKEN is required to download from private/internal repo $ReleaseRepo."
        exit 1
    }

    try {
        if ($useAssetApi) {
            # Try getting specific tag
            $release = $null
            try {
                $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$ReleaseRepo/releases/tags/$Tag" -Headers $headers -ErrorAction Stop
            } catch {
                # Fallback for Drafts: Scan list for matching tag
                Write-Host "Direct tag lookup failed (common for drafts), scanning release list..." -ForegroundColor Gray
                $releases = Invoke-RestMethod -Uri "https://api.github.com/repos/$ReleaseRepo/releases" -Headers $headers -ErrorAction Stop
                $release = $releases | Where-Object { $_.tag_name -eq $Tag } | Select-Object -First 1
            }

            if (-not $release) {
                Write-Error "Release $Tag not found in $ReleaseRepo"
                exit 1
            }

            # Look for browserbox-win-x64.exe OR browserbox.exe
            $asset = $release.assets | Where-Object { $_.name -eq $RemoteAssetName -or $_.name -eq $BinaryName } | Select-Object -First 1
            
            if (-not $asset) {
                Write-Error "Asset $RemoteAssetName (or $BinaryName) not found on release $Tag"
                exit 1
            }
            
            Write-Host "Found asset: $($asset.name)" -ForegroundColor Gray
            
            $assetUrl = "https://api.github.com/repos/$ReleaseRepo/releases/assets/$($asset.id)"
            $headers["Accept"] = "application/octet-stream"
            Invoke-WebRequest -Uri $assetUrl -Headers $headers -OutFile $tempFile -MaximumRedirection 5 -ErrorAction Stop | Out-Null
        }
        else {
            # Public download path (fallback)
            $downloadUrl = "https://github.com/$ReleaseRepo/releases/download/$Tag/$RemoteAssetName"
            $webClient = New-Object System.Net.WebClient
            if ($Token) {
                $webClient.Headers.Add("Authorization", "Bearer $Token") | Out-Null
            }
            try {
                $webClient.DownloadFile($downloadUrl, $tempFile)
            } catch {
                # Try fallback name
                $downloadUrl = "https://github.com/$ReleaseRepo/releases/download/$Tag/$BinaryName"
                $webClient.DownloadFile($downloadUrl, $tempFile)
            }
            $webClient.Dispose()
        }
        
        if (Test-Path $BinaryPath) {
            Remove-Item $BinaryPath -Force
        }
        Move-Item $tempFile $BinaryPath -Force
        
        Write-Host "Successfully downloaded and installed BrowserBox binary" -ForegroundColor Green
    }
    catch {
        Write-Error "Failed to download binary for $Tag : $_"
        if (Test-Path $tempFile) {
            Remove-Item $tempFile -Force
        }
        exit 1
    }
}

# Function to check if binary exists
function Test-BinaryExists {
    $script:ResolvedBinaryPath = Resolve-BrowserBoxBinary
    return [bool]$script:ResolvedBinaryPath
}

# Function to ensure binary is installed
function Ensure-Binary {
    if (-not (Test-BinaryExists)) {
        Write-Host "BrowserBox binary not found. Installing..." -ForegroundColor Yellow
        Ensure-BinaryDir
        if ($NoUpdate -and -not $env:BBX_RELEASE_TAG) {
            Write-Error "BBX_NO_UPDATE is set; provide BBX_RELEASE_TAG to install without update lookups."
            exit 1
        }
        $tag = if ($env:BBX_RELEASE_TAG) { $env:BBX_RELEASE_TAG } else { Get-LatestRelease -Repo $ReleaseRepo }
        Download-Binary -Tag $tag
        $script:ResolvedBinaryPath = $BinaryPath
    } elseif (-not $script:ResolvedBinaryPath) {
        $script:ResolvedBinaryPath = Resolve-BrowserBoxBinary
    }
}

function Get-SemverFromText {
    param([string]$Text)
    $regex = '(?im)(v?\d+\.\d+(?:\.\d+)?(?:-[0-9A-Za-z\.-]+)?)'
    $match = [regex]::Match($Text, $regex)
    if ($match.Success) { return $match.Groups[1].Value }
    return $null
}

# Function to get binary version
function Get-BinaryVersion {
    if (Test-BinaryExists) {
        try {
            $output = & $script:ResolvedBinaryPath "--version" 2>$null | Out-String
            $semver = Get-SemverFromText -Text $output
            if ($semver) { return $semver } else { return "unknown" }
        }
        catch {
            return "unknown"
        }
    }
    return "not_installed"
}

# Reads KEY=VALUE lines from test.env
function Read-TestEnv {
    param([string]$Path)
    $cfg = @{}
    if (-not (Test-Path $Path)) { return $cfg }
    Get-Content $Path | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            $cfg[$Matches[1].Trim()] = $Matches[2].Trim().Trim('"')
        }
    }
    return $cfg
}

function Get-ArgValue {
    param(
        [string[]]$ArgList,
        [string]$Name
    )
    for ($i = 0; $i -lt $ArgList.Count; $i++) {
        if ($ArgList[$i] -ieq $Name -and ($i + 1) -lt $ArgList.Count) {
            return $ArgList[$i + 1]
        }
    }
    return $null
}

function Get-ArgIntValue {
    param(
        [string[]]$ArgList,
        [string]$Name,
        [int]$DefaultValue
    )
    $v = Get-ArgValue -ArgList $ArgList -Name $Name
    if (-not $v) { return $DefaultValue }
    $out = 0
    if ([int]::TryParse($v, [ref]$out)) { return $out }
    return $DefaultValue
}

function Get-ArgSwitch {
    param(
        [string[]]$ArgList,
        [string]$Name
    )
    return ($ArgList | Where-Object { $_ -ieq $Name } | Select-Object -First 1) -ne $null
}

function Ensure-ConfigDir {
    $cfgDir = Join-Path $env:USERPROFILE ".config\dosyago\bbpro"
    New-Item -ItemType Directory -Path $cfgDir -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $cfgDir "tickets") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $cfgDir "logs") -Force | Out-Null
    return $cfgDir
}

function Invoke-SetupLite {
    param([string[]]$ArgList)

    $cfgDir = Ensure-ConfigDir
    $testEnvPath = Join-Path $cfgDir "test.env"

    $hostname = (Get-ArgValue -ArgList $ArgList -Name "-Hostname")
    if (-not $hostname) { $hostname = (Get-ArgValue -ArgList $ArgList -Name "--hostname") }
    if (-not $hostname) { $hostname = "localhost" }

    $email = (Get-ArgValue -ArgList $ArgList -Name "-Email")
    if (-not $email) { $email = (Get-ArgValue -ArgList $ArgList -Name "--email") }

    $port = Get-ArgIntValue -ArgList $ArgList -Name "-Port" -DefaultValue 8080
    if ($port -eq 8080) { $port = Get-ArgIntValue -ArgList $ArgList -Name "--port" -DefaultValue 8080 }

    $token = (Get-ArgValue -ArgList $ArgList -Name "-Token")
    if (-not $token) { $token = (Get-ArgValue -ArgList $ArgList -Name "--token") }
    if (-not $token) { $token = [System.Guid]::NewGuid().ToString() }

    $existing = Read-TestEnv -Path $testEnvPath
    $licenseToKeep = if ($env:LICENSE_KEY) { $env:LICENSE_KEY } elseif ($existing.ContainsKey("LICENSE_KEY")) { $existing["LICENSE_KEY"] } else { $null }

    $appPort = $port
    $audioPort = $port - 2
    $devtoolsPort = $port + 1
    $docsPort = $port - 1
    $cookieValue = if ($env:COOKIE_VALUE) { $env:COOKIE_VALUE } else { [System.Guid]::NewGuid().ToString() }

    $envContent = @(
        "APP_PORT=$appPort"
        "AUDIO_PORT=$audioPort"
        "LOGIN_TOKEN=$token"
        "COOKIE_VALUE=$cookieValue"
        "DEVTOOLS_PORT=$devtoolsPort"
        "DOCS_PORT=$docsPort"
        "SSLCERTS_DIR=$($env:USERPROFILE)\\sslcerts"
        "DOMAIN=$hostname"
    )
    if ($licenseToKeep) { $envContent += "LICENSE_KEY=$licenseToKeep" }
    $envContent -join "`r`n" | Out-File $testEnvPath -Encoding utf8

    $sslDir = Join-Path $env:USERPROFILE "sslcerts"
    $certExists = (Test-Path (Join-Path $sslDir "fullchain.pem")) -and (Test-Path (Join-Path $sslDir "privkey.pem"))
    $scheme = if ($certExists) { "https" } else { "http" }
    $loginLink = "${scheme}://${hostname}:${appPort}/login?token=${token}"
    $loginLink | Out-File (Join-Path $cfgDir "login.link") -Encoding utf8

    Write-Host "Setup complete." -ForegroundColor Green
    Write-Host "Login link: $loginLink" -ForegroundColor Cyan
}

function Start-BrowserBoxMainDetached {
    $cfgDir = Ensure-ConfigDir
    $testEnvPath = Join-Path $cfgDir "test.env"
    if (-not (Test-Path $testEnvPath)) {
        Write-Error "Configuration file not found at $testEnvPath. Run 'bbx setup' first."
        exit 1
    }

    $cfg = Read-TestEnv -Path $testEnvPath
    $appPort = if ($cfg.ContainsKey("APP_PORT")) { $cfg["APP_PORT"] } else { "8080" }
    $loginToken = if ($cfg.ContainsKey("LOGIN_TOKEN")) { $cfg["LOGIN_TOKEN"] } else { "" }

    Ensure-Binary
    Ensure-BinaryDir

    $logDir = Join-Path $cfgDir "logs"
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    $outLog = Join-Path $logDir "browserbox-main-out.log"
    $errLog = Join-Path $logDir "browserbox-main-err.log"
    $pidFile = Join-Path $cfgDir "browserbox-main.pid"

    $env:BB_CONFIG_DIR = $cfgDir
    if ($cfg.ContainsKey("LICENSE_KEY") -and -not $env:LICENSE_KEY) { $env:LICENSE_KEY = $cfg["LICENSE_KEY"] }
    if ($cfg.ContainsKey("DOMAIN")) { $env:BBX_HOSTNAME = $cfg["DOMAIN"] }

    Write-Verbose "Starting BrowserBox main detached (port=$appPort token=$loginToken)..."
    $proc = Start-Process -FilePath $script:ResolvedBinaryPath -ArgumentList @("main") -NoNewWindow -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
    $proc.Id | Out-File $pidFile -Encoding ascii -Force

    Write-Host "BrowserBox main started (PID: $($proc.Id))." -ForegroundColor Green
}

function Stop-BrowserBoxMain {
    $cfgDir = Ensure-ConfigDir
    $testEnvPath = Join-Path $cfgDir "test.env"
    $pidFile = Join-Path $cfgDir "browserbox-main.pid"

    $cfg = Read-TestEnv -Path $testEnvPath
    $appPort = if ($cfg.ContainsKey("APP_PORT")) { $cfg["APP_PORT"] } else { $null }
    $loginToken = if ($cfg.ContainsKey("LOGIN_TOKEN")) { $cfg["LOGIN_TOKEN"] } else { $null }

    if ($appPort -and $loginToken -and (Get-Command curl.exe -ErrorAction SilentlyContinue)) {
        try {
            $null = & curl.exe -k -sS -o NUL -X POST "https://localhost:${appPort}/api/v15/stop_app?session_token=${loginToken}"
        } catch { }
        try {
            $null = & curl.exe -sS -o NUL -X POST "http://localhost:${appPort}/api/v15/stop_app?session_token=${loginToken}"
        } catch { }
    }

    $pid = $null
    if (Test-Path $pidFile) {
        $raw = (Get-Content $pidFile -ErrorAction SilentlyContinue | Out-String).Trim()
        $tmp = 0
        if ([int]::TryParse($raw, [ref]$tmp)) { $pid = $tmp }
    }

    if ($pid -and (Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped BrowserBox main (PID: $pid)." -ForegroundColor Green
    } else {
        # Fallback: stop any browserbox.exe processes owned by this user
        Get-Process -Name "browserbox" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped browserbox processes (fallback)." -ForegroundColor Yellow
    }

    if (Test-Path $pidFile) { Remove-Item $pidFile -Force -ErrorAction SilentlyContinue }
}

# Function to check for updates
function Check-Update {
    if ($NoUpdate) { return }
    if (Test-BinaryExists) {
        $currentVersion = Get-BinaryVersion
        
        if ($currentVersion -eq "unknown" -or $currentVersion -eq "not_installed") {
            return
        }
        
        try {
            $latestTag = Get-LatestRelease -Repo $ReleaseRepo
            $latestNorm = $latestTag -replace '^[vV]'
            $currentNorm = $currentVersion -replace '^[vV]'
            if ($latestNorm -and $currentNorm -and $latestNorm -ne $currentNorm) {
                Write-Host "Note: A new version of BrowserBox is available: $latestTag" -ForegroundColor Yellow
                Write-Host "      Run 'bbx install' to update."
            }
        }
        catch {
            # Silently ignore update check failures
        }
    }
}

# Function to show help
function Show-Help {
    Write-Host "bbx CLI (Windows Binary Distribution)" -ForegroundColor Green
    Write-Host "Usage: bbx <command> [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Core Commands:" -ForegroundColor Cyan
    Write-Host "  install         Install BrowserBox binary and CLI" -ForegroundColor White
    Write-Host "  update          Update BrowserBox to the latest version" -ForegroundColor White
    Write-Host "  setup           Create/update test.env + login.link" -ForegroundColor White
    Write-Host "  run             Start BrowserBox main (detached)" -ForegroundColor White
    Write-Host "  stop            Stop BrowserBox main (best-effort)" -ForegroundColor White
    Write-Host "  certify         Validate license and obtain ticket" -ForegroundColor White
    Write-Host "  uninstall       Remove BrowserBox from this machine" -ForegroundColor White
    Write-Host "  revalidate      Clear ticket and revalidate license" -ForegroundColor White
    Write-Host "  --version, -v   Show version information" -ForegroundColor White
    Write-Host "  --help, -h      Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "All other commands are passed through to the browserbox binary." -ForegroundColor Gray
    Write-Host "Run 'browserbox --help' after installation for full command list." -ForegroundColor Gray
    Write-Host "Run 'bbx <command> -help' for command-specific options." -ForegroundColor Gray
}

function Normalize-CommandArgs {
    param([string[]]$ArgList)

    $out = New-Object System.Collections.Generic.List[string]
    foreach ($a in ($ArgList | Where-Object { $_ -ne $null -and $_ -ne "" })) {
        if ($a -eq "--help" -or $a -eq "-h" -or $a -eq "-help") {
            $out.Add("-Help")
            continue
        }
        $out.Add($a)
    }
    return $out.ToArray()
}

function Show-CommandHelp {
    param([string]$Command)

    switch ($Command) {
        "install" { . (Join-Path $PSScriptRoot "install.ps1") -Help; return }
        "update" { . (Join-Path $PSScriptRoot "update.ps1") -Help; return }
        "setup" { & (Join-Path $PSScriptRoot "setup.ps1") -Help; return }
        "run" { & (Join-Path $PSScriptRoot "start.ps1") -Help; return }
        "start" { & (Join-Path $PSScriptRoot "start.ps1") -Help; return }
        "stop" { & (Join-Path $PSScriptRoot "stop.ps1") -Help; return }
        "certify" { & (Join-Path $PSScriptRoot "certify.ps1") -Help; return }
        "uninstall" { & (Join-Path $PSScriptRoot "uninstall.ps1") -Help; return }
        "prepare" { Write-Host "bbx prepare (no help available)" -ForegroundColor Yellow; return }
        "revalidate" { Write-Host "bbx revalidate (no options)" -ForegroundColor Yellow; return }
        default { Show-Help; return }
    }
}

function Convert-ArgListToSplat {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [Parameter(Mandatory = $true)][string[]]$ArgList
    )

    $map = @{}
    switch ($Command) {
        "setup" { $map = @{ "host" = "Hostname"; "hostname" = "Hostname" } }
        "run" { $map = @{ "host" = "Hostname"; "hostname" = "Hostname" } }
        "start" { $map = @{ "host" = "Hostname"; "hostname" = "Hostname" } }
        default { $map = @{} }
    }

    $splat = @{}

    for ($i = 0; $i -lt $ArgList.Length; $i++) {
        $a = $ArgList[$i]
        if ($a -eq $null -or $a -eq "") { continue }

        if ($a -match '^--?([^=]+)=(.*)$') {
            $rawName = $matches[1]
            $value = $matches[2]
            $key = $rawName
            $lower = $rawName.ToLowerInvariant()
            if ($map.ContainsKey($lower)) { $key = $map[$lower] }
            $splat[$key] = $value
            continue
        }

        if ($a -match '^--?(.+)$') {
            $rawName = $matches[1]
            $key = $rawName
            $lower = $rawName.ToLowerInvariant()
            if ($map.ContainsKey($lower)) { $key = $map[$lower] }

            $next = $null
            if (($i + 1) -lt $ArgList.Length) { $next = $ArgList[$i + 1] }

            if ($next -ne $null -and $next -ne "" -and $next -notmatch '^--?.+') {
                $splat[$key] = $next
                $i++
            } else {
                $splat[$key] = $true
            }
            continue
        }

        throw "Positional argument '$a' is not supported; use named options (e.g. -Hostname localhost -Port 9955)."
    }

    return $splat
}

# Function to handle revalidate command
function Invoke-Revalidate {
    $ticketPath = Join-Path $env:USERPROFILE ".config\dosyago\bbpro\tickets\ticket.json"
    
    if (-not (Test-Path (Split-Path $ticketPath))) {
        Write-Warning "Ticket directory does not exist at $(Split-Path $ticketPath)"
        return
    }
    
    if (Test-Path $ticketPath) {
        Write-Host "Removing ticket.json..." -ForegroundColor Cyan
        Remove-Item $ticketPath -Force
        Write-Host "ticket.json removed. License will be revalidated on next use." -ForegroundColor Green
    }
    else {
        Write-Host "No ticket found at $ticketPath" -ForegroundColor Yellow
    }
}

function Invoke-CommandScript {
    param (
        [string]$Command,
        [string[]]$Arguments
    )

    if (-not $ScriptMap.ContainsKey($Command)) { return $false }

    $scriptPath = Join-Path $PSScriptRoot $ScriptMap[$Command]
    if (-not (Test-Path $scriptPath)) {
        Write-Error "Script for '$Command' not found at $scriptPath"
        return $true
    }

    Write-Host "Running bbx $Command..." -ForegroundColor Cyan

    $global:LASTEXITCODE = 0

    if ($Command -in @("install", "update")) {
        # Needs helpers like Download-Binary/Get-LatestRelease from this file's scope.
        if ($Arguments -and $Arguments.Count -gt 0) {
            $params = Convert-ArgListToSplat -Command $Command -ArgList $Arguments
            . $scriptPath @params
        } else {
            . $scriptPath
        }
        exit $LASTEXITCODE
    }

    if ($Arguments -and $Arguments.Count -gt 0) {
        $params = Convert-ArgListToSplat -Command $Command -ArgList $Arguments
        & $scriptPath @params
    } else {
        & $scriptPath
    }
    exit $LASTEXITCODE
}

function Get-LocalBinaryVersion {
    $path = Resolve-BrowserBoxBinary
    if (-not $path) { return $null }
    try {
        $info = (Get-Item $path -ErrorAction Stop).VersionInfo
        if ($info -and $info.ProductVersion) { return $info.ProductVersion }
        if ($info -and $info.FileVersion) { return $info.FileVersion }
    } catch { }
    return $null
}

# Main execution logic (argv-driven; do not let PowerShell bind subcommand options to this wrapper)
$argv = @($args | Where-Object { $_ -ne $null -and $_ -ne "" })
if (-not $argv -or $argv.Count -eq 0) {
    Show-Help
    exit 0
}

$Command = [string]$argv[0]
$CommandArgs = @()
if ($argv.Count -gt 1) { $CommandArgs = @($argv[1..($argv.Count - 1)]) }

$CommandArgs = Normalize-CommandArgs -ArgList $CommandArgs
$normalizedCommand = $Command.ToLowerInvariant()

if ($env:BBX_DEBUG_CLI -and $env:BBX_DEBUG_CLI -ne "0" -and $env:BBX_DEBUG_CLI.ToLowerInvariant() -ne "false") {
    Write-Host "[bbx] Command: $Command" -ForegroundColor DarkGray
    Write-Host "[bbx] Args: $($CommandArgs -join ' | ')" -ForegroundColor DarkGray
    Write-Host "[bbx] Normalized: $normalizedCommand" -ForegroundColor DarkGray
}

if (-not $Command -or $normalizedCommand -in @("--help","-help","help","-h")) {
    Show-Help
    exit 0
}

if ($normalizedCommand -in @("--version","-v","version")) {
    $v = Get-LocalBinaryVersion
    if ($v) {
        Write-Host $v
        exit 0
    }
    Write-Host "browserbox.exe not found." -ForegroundColor Yellow
    exit 1
}
elseif ($normalizedCommand -eq "revalidate") {
    Invoke-Revalidate
    exit 0
}
elseif ($CommandArgs -and ($CommandArgs -contains "-Help")) {
    Show-CommandHelp -Command $normalizedCommand
    exit 0
}
elseif (Invoke-CommandScript -Command $normalizedCommand -Arguments $CommandArgs) {
    exit $LASTEXITCODE
}
else {
    # Pass through to the browserbox binary
    Ensure-Binary
    $passArgs = @($Command) + $CommandArgs
    & $script:ResolvedBinaryPath @passArgs
    exit $LASTEXITCODE
}
