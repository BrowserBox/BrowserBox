# bbx.ps1 - BrowserBox Binary Installer & Wrapper for Windows
# This script downloads and runs pre-compiled BrowserBox binaries
# from the public BrowserBox/BrowserBox repository.

$ErrorActionPreference = "Stop"

$global:LASTEXITCODE = 0

if ($env:BBX_DEBUG_CLI -and $env:BBX_DEBUG_CLI -ne "0" -and $env:BBX_DEBUG_CLI.ToLowerInvariant() -ne "false") {
    try {
        [Console]::Error.WriteLine("[bbx] PSVersion: $($PSVersionTable.PSVersion)")
    } catch { }
    [Console]::Error.WriteLine("[bbx] Script: $($MyInvocation.MyCommand.Path)")
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

if ($null -eq $env:BBX_DONT_KILL_CHROME_ON_STOP) {
    $env:BBX_DONT_KILL_CHROME_ON_STOP = "true"
}

$BinaryDir = "$env:LOCALAPPDATA\browserbox\bin"

# Local Name (on disk)
$BinaryName = "browserbox.exe"
# Remote Name (on GitHub Release)
$RemoteAssetName = "browserbox-win-x64.exe"

$BinaryPath = Join-Path $BinaryDir $BinaryName
$script:ResolvedBinaryPath = $null
$script:RestartArgs = @()

$ScriptMap = @{
    "install"     = "install.ps1"
    "update"      = "update.ps1"
    "setup"       = "setup.ps1"
    "run"         = "start.ps1"
    "start"       = "start.ps1"
    "stop"        = "stop.ps1"
    "certify"     = "certify.ps1"
    "prepare"     = "prepare.ps1"
    "uninstall"   = "uninstall.ps1"
    "restart"     = "restart.ps1"
    "logs"        = "logs.ps1"
    "gui"         = "gui.ps1"
    "vacancy"     = "vacancy.ps1"
    "activate"    = "activate.ps1"
    "use-chrome"  = "use-chrome.ps1"
    "cf-start"    = "cf-start.ps1"
    "cf-run"      = "cf-start.ps1"
    "tor-start"   = "tor-start.ps1"
    "tor-run"     = "tor-start.ps1"
    "zt-start"    = "zt-start.ps1"
    "zt-run"      = "zt-start.ps1"
    "ng-start"    = "ng-start.ps1"
    "ng-run"      = "ng-start.ps1"
    "ng-config"   = "ng-config.ps1"
    "win9x-start" = "win9x-start.ps1"
    "win9x-run"   = "win9x-start.ps1"
}

# Commands whose first argument is a value, not a named option.
$PositionalCommands = @{
    "activate"   = "Seats"
    "use-chrome" = "Target"
    "ng-config"  = "Action"
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

function Get-ReleaseByTag {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Repo,
        [Parameter(Mandatory = $true)]
        [string]$Tag,
        [hashtable]$Headers = @{},
        [int]$PerPage = 100,
        [int]$MaxPages = 20
    )

    try {
        return Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/tags/$Tag" -Headers $Headers -ErrorAction Stop
    } catch {
        Write-Host "Direct tag lookup failed (common for drafts), scanning release list pages..." -ForegroundColor Gray
        for ($page = 1; $page -le $MaxPages; $page++) {
            $uri = "https://api.github.com/repos/$Repo/releases?per_page=$PerPage&page=$page"
            $releases = @(Invoke-RestMethod -Uri $uri -Headers $Headers -ErrorAction Stop)
            if (-not $releases -or $releases.Count -eq 0) {
                break
            }

            $release = $releases | Where-Object { $_.tag_name -eq $Tag } | Select-Object -First 1
            if ($release) {
                Write-Host "Resolved release $Tag on page $page." -ForegroundColor Gray
                return $release
            }

            if ($releases.Count -lt $PerPage) {
                break
            }
        }
    }

    $ghCmd = Get-Command gh -ErrorAction SilentlyContinue
    if ($ghCmd) {
        try {
            Write-Host "Release list scan missed $Tag, trying gh release view fallback..." -ForegroundColor Gray
            $releaseJson = & $ghCmd.Source release view $Tag --repo $Repo --json tagName,isDraft,isPrerelease,assets,id 2>$null
            if ($LASTEXITCODE -eq 0 -and $releaseJson) {
                $release = $releaseJson | ConvertFrom-Json
                if ($release -and $release.tagName -eq $Tag) {
                    Write-Host "Resolved release $Tag via gh release view." -ForegroundColor Gray
                    return $release
                }
            }
        } catch {
            Write-Host "gh release view fallback failed for $Tag." -ForegroundColor Gray
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
            $release = Get-ReleaseByTag -Repo $ReleaseRepo -Tag $Tag -Headers $headers

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
        $version = Get-LocalBinaryVersion
        if ($version) { return $version }
        return "unknown"
    }
    return "not_installed"
}

function Test-InteractiveConsole {
    if (-not [Environment]::UserInteractive) { return $false }
    try {
        if ([Console]::IsInputRedirected -or [Console]::IsOutputRedirected) { return $false }
    } catch { }
    return $true
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
    $cfgDir = Join-Path $env:USERPROFILE ".config\dosaygo\bbpro"
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

    Write-Verbose "Starting BrowserBox main detached (port=$appPort)..."
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
            $null = & curl.exe -k -sS --max-time 5 -o NUL -X POST "https://localhost:${appPort}/stop_app?session_token=${loginToken}"
        } catch { }
        try {
            $null = & curl.exe -sS --max-time 5 -o NUL -X POST "http://localhost:${appPort}/stop_app?session_token=${loginToken}"
        } catch { }
    }

    $ProcessId = $null
    if (Test-Path $pidFile) {
        $raw = (Get-Content $pidFile -ErrorAction SilentlyContinue | Out-String).Trim()
        $tmp = 0
        if ([int]::TryParse($raw, [ref]$tmp)) { $ProcessId = $tmp }
    }

    if ($ProcessId -and (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)) {
        Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped BrowserBox main (PID: $ProcessId)." -ForegroundColor Green
    } else {
        # Fallback: stop any browserbox.exe processes owned by this user
        Get-Process -Name "browserbox" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped browserbox processes (fallback)." -ForegroundColor Yellow
    }

    if (Test-Path $pidFile) { Remove-Item $pidFile -Force -ErrorAction SilentlyContinue }
}

# The GUI consumes these three contracts on every platform. Keep this wrapper
# authoritative for Windows lifecycle facts instead of making the GUI inspect
# processes, config files, or PowerShell scripts itself.
function Get-BbxHelpCatalogue {
    $flag = { param($name, $flag) [ordered]@{ name=$name; flag=$flag; type="flag"; required=$false; choices=@(); description="" } }
    $text = { param($name, $flag, $required=$false, $choices=@()) [ordered]@{ name=$name; flag=$flag; type="text"; required=[bool]$required; choices=@($choices); description="" } }
    $command = {
        param($path, $name, $group, $description, $fields=@(), $confirm=$false, $note="")
        [ordered]@{ path=@($path); name=$name; group=$group; description=$description;
            fields=@($fields); aliases=@(); confirm=[bool]$confirm; platform="windows"; note=$note }
    }

    $commands = @(
        & $command @("status") "status" "Instance" "Read current service and endpoint status." @(& $flag "json" "--json")
        & $command @("setup") "setup" "Instance" "Configure BrowserBox for this Windows user." @(& $text "hostname" "--hostname"; & $text "port" "--port")
        & $command @("start") "start" "Instance" "Start BrowserBox services." @(& $text "hostname" "--hostname"; & $text "port" "--port")
        & $command @("stop") "stop" "Instance" "Stop BrowserBox services." @() $true
        & $command @("install") "install" "Lifecycle" "Install BrowserBox." @() $true
        & $command @("update") "update" "Lifecycle" "Update BrowserBox." @() $true
        & $command @("certify") "certify" "License" "Validate the BrowserBox license." @()
        & $command @("revalidate") "revalidate" "License" "Clear the local ticket and validate again." @() $true
        & $command @("uninstall") "uninstall" "Lifecycle" "Remove BrowserBox from this machine." @() $true
        & $command @("policy","where") "policy where" "Policy" "Locate the policy bundle." @(& $text "scope" "--scope" $false @("user","global"); & $flag "json" "--json")
        & $command @("policy","baselines") "policy baselines" "Policy" "List available policy baselines." @()
        & $command @("policy","controls") "policy controls" "Policy" "List policy controls." @(& $flag "json" "--json")
        & $command @("policy","show") "policy show" "Policy" "Show the policy bundle." @(& $text "scope" "--scope" $false @("user","global"))
        & $command @("policy","resolve") "policy resolve" "Policy" "Resolve the effective policy." @()
        & $command @("policy","check") "policy check" "Policy" "Evaluate an action against policy." @(& $text "action" "--action" $true; & $text "url" "--url"; & $text "source" "--source")
        & $command @("policy","trace") "policy trace" "Policy" "Show recent policy decisions." @(& $text "last" "--last")
        & $command @("policy","validate") "policy validate" "Policy" "Validate a policy file or the current policy." @(& $text "scope" "--scope" $false @("user","global"); & $text "file" "--file")
        & $command @("policy","set") "policy set" "Policy" "Install a policy bundle from JSON." @(& $text "scope" "--scope" $false @("user","global"); & $text "file" "--file" $true) $true
        & $command @("policy","reset") "policy reset" "Policy" "Reset the policy bundle." @(& $text "scope" "--scope" $false @("user","global"); & $text "baseline" "--baseline" $false @("regulated","compat")) $true
        # Names and groups match the Unix catalogue entry for entry, so the GUI
        # reads one command surface rather than a Windows dialect of it.
        & $command @("restart") "restart" "Instance" "Restart BrowserBox using the current configuration." @() $true
        & $command @("logs") "logs" "Instance" "View the logs for the BrowserBox services." @(& $text "service" "--service" $false @("main","devtools","cloudflared","tor","nginx"); & $text "lines" "--lines")
        & $command @("activate") "activate" "Setup" "Activate a license for more users." @(& $text "seats" "--seats")
        & $command @("vacancy") "vacancy" "Setup" "Show the current license vacancy snapshot." @()
        & $command @("use-chrome") "use-chrome" "Setup" "Install a specific browser and use it." @(& $text "target" "--target" $true) $true
        & $command @("cf-start") "cf-start" "Tunnels" "Run BrowserBox through a Cloudflare quick tunnel." @(& $text "port" "--port"; & $flag "background" "--background")
        & $command @("zt-start") "zt-start" "Tunnels" "Expose BrowserBox on your ZeroTier network." @(& $text "network-id" "--network-id" $true; & $text "port" "--port")
        & $command @("tor-start") "tor-start" "Tunnels" "Serve BrowserBox as a Tor onion service." @(& $flag "no-onion" "--no-onion"; & $flag "no-anonymize" "--no-anonymize"; & $text "port" "--port")
        & $command @("ng-start") "ng-start" "Tunnels" "Proxy BrowserBox with Nginx." @(& $text "listen-port" "--listen-port"; & $text "port" "--port"; & $text "hostname" "--hostname")
        & $command @("ng-config","print") "ng-config print" "Tunnels" "Print external Nginx configuration." @()
        & $command @("ng-config","validate") "ng-config validate" "Tunnels" "Validate external Nginx configuration." @()
        & $command @("ng-config","apply") "ng-config apply" "Tunnels" "Apply external Nginx configuration." @() $true
        & $command @("win9x-start") "win9x-start" "Tunnels" "Run in Windows 9x compatibility mode." @(& $text "port" "--port")
        & $command @("--faq") "--faq" "Help" "Show frequently asked questions." @()
        & $command @("--help-json") "--help-json" "Help" "Show the machine-readable command catalogue." @(& $text "out" "--out")
    )
    return [ordered]@{ schema="bbx.help/1"; commands=$commands }
}

function Write-BbxHelpCatalogue {
    param([string[]]$ArgList)
    $json = Get-BbxHelpCatalogue | ConvertTo-Json -Depth 8 -Compress
    if (-not $ArgList -or $ArgList.Count -eq 0) { [Console]::Out.WriteLine($json); return 0 }
    if ($ArgList.Count -ne 2 -or $ArgList[0] -ne "--out" -or -not [IO.Path]::IsPathRooted($ArgList[1])) {
        [Console]::Error.WriteLine("usage: bbx --help-json [--out C:\absolute\new\file]")
        return 2
    }
    try {
        $stream = [IO.File]::Open($ArgList[1], [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
        $writer = New-Object IO.StreamWriter($stream, (New-Object Text.UTF8Encoding($false)))
        $writer.WriteLine($json); $writer.Dispose()
        return 0
    } catch {
        [Console]::Error.WriteLine("bbx: cannot create help output: $($_.Exception.Message)")
        return 2
    }
}

function Test-BbxLocalEndpoint {
    param([string]$Scheme, [int]$Port)
    $request = New-Object -ComObject WinHttp.WinHttpRequest.5.1
    try {
        $request.SetTimeouts(2000, 2000, 2000, 2000)
        $request.Open('GET', "${Scheme}://localhost:$Port/", $false)
        # Only the loopback probe accepts the locally generated certificate.
        $request.Option(4) = 13056
        $request.Option(6) = $false
        $request.Send()
        return $request.Status -ge 100
    } catch [System.Runtime.InteropServices.COMException] {
        # Connection refusal, TLS mismatch and deadline expiry mean no endpoint.
        return $false
    } finally {
        [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($request)
    }
}

function Get-BbxStatus {
    $userRoot = if ($env:USERPROFILE) { $env:USERPROFILE } else { [Environment]::GetFolderPath("UserProfile") }
    $cfgDir = Join-Path $userRoot ".config\dosaygo\bbpro"
    $cfg = Read-TestEnv -Path (Join-Path $cfgDir "test.env")
    $hostname = if ($cfg.ContainsKey("DOMAIN")) { [string]$cfg["DOMAIN"] } else { "localhost" }
    $port = if ($cfg.ContainsKey("APP_PORT")) { [int]$cfg["APP_PORT"] } else { $null }
    $running = $false
    $detection = "none"
    $pidFile = Join-Path $cfgDir "browserbox-main.pid"
    if (Test-Path $pidFile) {
        $pidValue = 0
        $rawPid = (Get-Content $pidFile -ErrorAction SilentlyContinue | Out-String).Trim()
        if ([int]::TryParse($rawPid, [ref]$pidValue) -and (Get-Process -Id $pidValue -ErrorAction SilentlyContinue)) {
            $running = $true; $detection = "process"
        }
    }
    $scheme = "https"
    if ($port) {
        if (Test-BbxLocalEndpoint -Scheme https -Port $port) {
            $running = $true; $detection = "endpoint"
        } elseif (Test-BbxLocalEndpoint -Scheme http -Port $port) {
            $running = $true; $detection = "endpoint"; $scheme = "http"
        }
    }
    $version = Get-LocalBinaryVersion
    return [ordered]@{ ok=$true; running=$running; detection=$detection; hostname=$hostname;
        scheme=$scheme; main_port=$port; version=$version; audio=(Get-BbxAudioStatus -ConfigDir $cfgDir);
        connections=(Get-BbxConnectionsStatus -ConfigDir $cfgDir) }
}

# Audio is a real, permanent gap on Windows rather than an unknown: multi-user
# RDP audio on Windows Server needs per-seat RDS licensing BrowserBox does not
# ship. Say so, so the GUI can explain it instead of showing nothing.
function Get-BbxAudioStatus {
    param([string]$ConfigDir)
    $state = "disabled"
    $detail = "not supported on Windows: multi-user RDP audio requires per-seat RDS licensing"
    $path = Join-Path $ConfigDir "audio.state"
    if (Test-Path $path) {
        foreach ($line in (Get-Content $path -ErrorAction SilentlyContinue)) {
            if ($line -match '^state=(.*)$') { $state = $matches[1].Trim() }
            elseif ($line -match '^detail=(.*)$') { $detail = $matches[1].Trim() }
        }
    }
    return [ordered]@{ state=$state; detail=$detail }
}

# The same six connection profiles the Unix status reports, in the same order
# and with the same names, so one GUI reader serves both platforms.
function Get-BbxConnectionsStatus {
    param([string]$ConfigDir)

    $owner = "setup"
    $launch = @{}
    $statePath = Join-Path $ConfigDir "connection.json"
    if (Test-Path $statePath) {
        try {
            $parsed = (Get-Content $statePath -Raw -ErrorAction Stop) | ConvertFrom-Json -ErrorAction Stop
            if ($parsed.PSObject.Properties.Name -contains "owner" -and $parsed.owner) { $owner = [string]$parsed.owner }
            if ($parsed.PSObject.Properties.Name -contains "launch" -and $parsed.launch) {
                foreach ($tag in $parsed.launch.PSObject.Properties) {
                    $values = @{}
                    foreach ($kv in $tag.Value.PSObject.Properties) { $values[$kv.Name] = [string]$kv.Value }
                    $launch[$tag.Name] = $values
                }
            }
        } catch { }
    }

    $userEnv = Read-TestEnv -Path (Join-Path $ConfigDir "user.env")
    $order = @("setup", "cf", "zt", "tor", "ng", "win9x")
    $launchKeys = @{
        "cf"    = @("background")
        "zt"    = @("network-id")
        "tor"   = @("anonymize", "no-anonymize", "onion", "no-onion")
        "ng"    = @("listen-port")
        "setup" = @()
        "win9x" = @()
    }

    $profiles = @()
    foreach ($tag in $order) {
        # The owning tag's configuration is the live file; the others were
        # filed under their own name when they last had it.
        if ($tag -eq $owner) {
            $source = Join-Path $ConfigDir "test.env"
        } else {
            $source = Join-Path $ConfigDir "test.env.profile.$tag"
        }
        $values = [ordered]@{}
        if (Test-Path $source) {
            $profileCfg = Read-TestEnv -Path $source
            $hostValue = $profileCfg["DOMAIN"]
            if ($userEnv.ContainsKey("DOMAIN") -and $userEnv["DOMAIN"]) { $hostValue = $userEnv["DOMAIN"] }
            $portValue = $profileCfg["APP_PORT"]
            if ($userEnv.ContainsKey("APP_PORT") -and $userEnv["APP_PORT"]) { $portValue = $userEnv["APP_PORT"] }
            if ($hostValue) { $values["hostname"] = [string]$hostValue }
            if ($portValue) { $values["port"] = [string]$portValue }
        }
        if ($launch.ContainsKey($tag)) {
            foreach ($key in $launchKeys[$tag]) {
                if ($launch[$tag].ContainsKey($key) -and $launch[$tag][$key]) {
                    $values[$key] = [string]$launch[$tag][$key]
                }
            }
        }
        $name = if ($tag -eq "setup") { "start" } else { "$tag-start" }
        $profiles += [ordered]@{ name=$name; values=$values }
    }

    $active = if ($order -contains $owner -and $owner -ne "setup") { "$owner-start" } else { "start" }
    return [ordered]@{ active=$active; profiles=$profiles }
}

# Function to check for updates
function Check-Update {
    if ($NoUpdate) { return }
    if (-not (Test-BinaryExists)) { return }

    $currentVersion = Get-BinaryVersion
    if ($currentVersion -eq "unknown" -or $currentVersion -eq "not_installed") {
        return
    }

    try {
        $latestTag = Get-LatestRelease -Repo $ReleaseRepo
        $latestNorm = $latestTag -replace '^[vV]'
        $currentNorm = $currentVersion -replace '^[vV]'
        if (-not $latestNorm -or -not $currentNorm -or $latestNorm -eq $currentNorm) {
            return
        }

        $yesUpdate = $false
        if ($null -ne $env:BBX_YES_UPDATE -and $env:BBX_YES_UPDATE -ne "") {
            try {
                $yesUpdate = [System.Convert]::ToBoolean($env:BBX_YES_UPDATE)
            } catch {
                $yesUpdate = ($env:BBX_YES_UPDATE.ToLowerInvariant() -in @("1", "true", "yes", "y", "on"))
            }
        }

        if (-not (Test-InteractiveConsole) -and -not $yesUpdate) {
            return
        }

        $shouldInstall = $yesUpdate
        if (-not $shouldInstall) {
            $response = Read-Host "A new version of BrowserBox is available ($latestTag). Install now? [y/N]"
            if ($response -match '^(y|yes)$') {
                $shouldInstall = $true
            }
        }

        if ($shouldInstall) {
            $updatedTag = Invoke-UpdateInstall
            if ($updatedTag) {
                Write-Host "BrowserBox updated to $updatedTag. Restarting..." -ForegroundColor Green
                $env:BBX_UPDATE_ALREADY_APPLIED = "1"
                & $PSCommandPath @script:RestartArgs
                exit $LASTEXITCODE
            }
        }
    }
    catch {
        # Silently ignore update check failures
    }
}

function Invoke-UpdateInstall {
    if ($NoUpdate -and -not $env:BBX_RELEASE_TAG) {
        Write-Error "BBX_NO_UPDATE is set; provide BBX_RELEASE_TAG to update without release lookups."
        return $null
    }

    $tag = if ($env:BBX_RELEASE_TAG) { $env:BBX_RELEASE_TAG } else { Get-LatestRelease -Repo $ReleaseRepo }
    if (-not $tag) {
        Write-Error "Could not determine release tag."
        return $null
    }

    Download-Binary -Tag $tag

    $env:BBX_BINARY_SOURCE_PATH = $BinaryPath
    $copyScript = Join-Path $PSScriptRoot "cp_commands_only.ps1"
    if (Test-Path $copyScript) {
        & $copyScript | Out-Null
    }

    return $tag
}

function Should-CheckUpdateNow {
    $cfgDir = Ensure-ConfigDir
    $checkFile = Join-Path $cfgDir "last_update_check"
    $now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    if (Test-Path $checkFile) {
        try {
            $last = [int64](Get-Content $checkFile -ErrorAction Stop | Select-Object -First 1)
            if ($last -gt ($now - 3600)) {
                return $false
            }
        } catch { }
    }
    try {
        Set-Content -Path $checkFile -Value $now -Encoding ascii -ErrorAction SilentlyContinue | Out-Null
    } catch { }
    return $true
}

function Invoke-UpdateCheck {
    param(
        [string]$Command,
        [string[]]$CommandArgs
    )

    if ($env:BBX_UPDATE_ALREADY_APPLIED) { return }
    if ($NoUpdate) { return }
    if ($Command -in @("update", "install", "uninstall")) { return }
    if (-not (Should-CheckUpdateNow)) { return }

    $script:RestartArgs = @($Command) + $CommandArgs
    Check-Update
}

# Function to show help
function Show-Help {
    Write-Host "bbx CLI (Windows Binary Distribution)" -ForegroundColor Green
    Write-Host "Usage: bbx <command> [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "SETUP & MANAGEMENT" -ForegroundColor Cyan
    Write-Host "  install         Install BrowserBox binary and CLI" -ForegroundColor White
    Write-Host "  update          Update BrowserBox to the latest version" -ForegroundColor White
    Write-Host "  uninstall       Remove BrowserBox from this machine" -ForegroundColor White
    Write-Host "  setup           Configure core options. bbx setup [-Hostname <h>] [-Port <p>] [-Token <t>]" -ForegroundColor White
    Write-Host "  activate        Activate a license for more users. bbx activate [number_of_users]" -ForegroundColor White
    Write-Host "  certify         Validate your current license status" -ForegroundColor White
    Write-Host "  revalidate      Clear the local ticket and validate again" -ForegroundColor White
    Write-Host "  vacancy         Show the current license vacancy snapshot" -ForegroundColor White
    Write-Host "  use-chrome      Install a specific browser and use it. bbx use-chrome <version|url|stable>" -ForegroundColor White
    Write-Host "  status          Read process/endpoint state (--json supported)" -ForegroundColor White
    Write-Host "  logs            Show service state and logs" -ForegroundColor White
    Write-Host "  gui             Install and open the desktop app; prints where it lives. bbx gui [-Reinstall]" -ForegroundColor White
    Write-Host ""
    Write-Host "CORE ACTIONS" -ForegroundColor Cyan
    Write-Host "  start, run      Start BrowserBox for this Windows user" -ForegroundColor White
    Write-Host "  stop            Stop BrowserBox and any transport bbx started" -ForegroundColor White
    Write-Host "  restart         Restart using the configuration in use" -ForegroundColor White
    Write-Host ""
    Write-Host "ADVANCED RUNNERS & TUNNELS" -ForegroundColor Cyan
    Write-Host "  cf-start        Run through a Cloudflare quick tunnel. bbx cf-start [-Port <p>] [-Background]" -ForegroundColor White
    Write-Host "  zt-start        Serve on your ZeroTier network. bbx zt-start -NetworkId <id>" -ForegroundColor White
    Write-Host "  tor-start       Serve as a Tor onion service. bbx tor-start [-NoOnion] [-NoAnonymize]" -ForegroundColor White
    Write-Host "  ng-start        Proxy with nginx. bbx ng-start [-ListenPort <p>]" -ForegroundColor White
    Write-Host "  ng-config       Print, validate or apply the nginx configuration" -ForegroundColor White
    Write-Host "  win9x-start     Run in Windows 9x compatibility mode" -ForegroundColor White
    Write-Host ""
    Write-Host "OTHER COMMANDS" -ForegroundColor Cyan
    Write-Host "  policy          Dispatch policy read, check and mutation commands" -ForegroundColor White
    Write-Host "  --faq           Display frequently asked questions" -ForegroundColor White
    Write-Host "  --version, -v   Show version information" -ForegroundColor White
    Write-Host "  --help, -h      Show this help message" -ForegroundColor White
    Write-Host "  --help-json     Show the GUI command catalogue" -ForegroundColor White
    Write-Host ""
    Write-Host "Not available on Windows: audio (Windows Server multi-user RDP audio needs" -ForegroundColor Gray
    Write-Host "per-seat licensing), fleet, start-as and stop-user (Linux user pools)." -ForegroundColor Gray
    Write-Host "Recognized binary commands are passed through; unknown or unsupported commands exit 2." -ForegroundColor Gray
    Write-Host "Run 'bbx <command> -help' for command-specific options." -ForegroundColor Gray
}

function Show-Faq {
    Write-Host "BrowserBox FAQ (Windows)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Where is my login link?" -ForegroundColor Cyan
    Write-Host "  %USERPROFILE%\.config\dosaygo\bbpro\login.link, rewritten on every start." -ForegroundColor White
    Write-Host ""
    Write-Host "Why is there no sound?" -ForegroundColor Cyan
    Write-Host "  Audio is not supported on Windows. Multi-user RDP audio on Windows Server" -ForegroundColor White
    Write-Host "  requires per-seat RDS licensing that BrowserBox does not ship." -ForegroundColor White
    Write-Host ""
    Write-Host "How do I expose this machine to someone else?" -ForegroundColor Cyan
    Write-Host "  bbx cf-start for a public URL, bbx zt-start for a private network," -ForegroundColor White
    Write-Host "  bbx tor-start for an onion address, bbx ng-start to serve on 443." -ForegroundColor White
    Write-Host ""
    Write-Host "The browser will not start." -ForegroundColor Cyan
    Write-Host "  BrowserBox needs a Chrome-family browser. Install one with" -ForegroundColor White
    Write-Host "  bbx use-chrome stable, then bbx restart." -ForegroundColor White
    Write-Host ""
    Write-Host "My certificate is not trusted on another machine." -ForegroundColor Cyan
    Write-Host "  Local hostnames and private addresses get a machine-local mkcert" -ForegroundColor White
    Write-Host "  certificate. Use a public hostname, or import this machine's root CA." -ForegroundColor White
    Write-Host ""
    Write-Host "Where do I get a license?" -ForegroundColor Cyan
    Write-Host "  bbx activate, or https://browserbox.io" -ForegroundColor White
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
        "restart" { & (Join-Path $PSScriptRoot "restart.ps1") -Help; return }
        "logs" { & (Join-Path $PSScriptRoot "logs.ps1") -Help; return }
        "vacancy" { & (Join-Path $PSScriptRoot "vacancy.ps1") -Help; return }
        "activate" { & (Join-Path $PSScriptRoot "activate.ps1") -Help; return }
        "use-chrome" { & (Join-Path $PSScriptRoot "use-chrome.ps1") -Help; return }
        "cf-start" { & (Join-Path $PSScriptRoot "cf-start.ps1") -Help; return }
        "cf-run" { & (Join-Path $PSScriptRoot "cf-start.ps1") -Help; return }
        "tor-start" { & (Join-Path $PSScriptRoot "tor-start.ps1") -Help; return }
        "tor-run" { & (Join-Path $PSScriptRoot "tor-start.ps1") -Help; return }
        "zt-start" { & (Join-Path $PSScriptRoot "zt-start.ps1") -Help; return }
        "zt-run" { & (Join-Path $PSScriptRoot "zt-start.ps1") -Help; return }
        "ng-start" { & (Join-Path $PSScriptRoot "ng-start.ps1") -Help; return }
        "ng-run" { & (Join-Path $PSScriptRoot "ng-start.ps1") -Help; return }
        "ng-config" { & (Join-Path $PSScriptRoot "ng-config.ps1") -Help; return }
        "win9x-start" { & (Join-Path $PSScriptRoot "win9x-start.ps1") -Help; return }
        "win9x-run" { & (Join-Path $PSScriptRoot "win9x-start.ps1") -Help; return }
        default { Show-Help; return }
    }
}

function Convert-ArgListToSplat {
    param(
        [Parameter(Mandatory = $true)][string]$Command,
        [Parameter(Mandatory = $true)][string[]]$ArgList
    )

    $map = @{}
    switch -Wildcard ($Command) {
        "setup" { $map = @{ "host" = "Hostname"; "hostname" = "Hostname" } }
        "run" { $map = @{ "host" = "Hostname"; "hostname" = "Hostname" } }
        "start" { $map = @{ "host" = "Hostname"; "hostname" = "Hostname" } }
        "cf-*" { $map = @{ "port" = "Port"; "p" = "Port"; "background" = "Background"; "d" = "Background";
                           "tunnel-timeout" = "TunnelTimeout" } }
        "tor-*" { $map = @{ "port" = "Port"; "p" = "Port"; "no-onion" = "NoOnion"; "onion" = "Onion";
                            "no-darkweb" = "NoAnonymize"; "no-anonymize" = "NoAnonymize";
                            "anonymize" = "Anonymize"; "bootstrap-timeout" = "BootstrapTimeout" } }
        "zt-*" { $map = @{ "port" = "Port"; "p" = "Port"; "network-id" = "NetworkId";
                           "address-timeout" = "AddressTimeout" } }
        "ng-start" { $map = @{ "port" = "Port"; "p" = "Port"; "listen-port" = "ListenPort";
                               "host" = "Hostname"; "hostname" = "Hostname" } }
        "ng-run" { $map = @{ "port" = "Port"; "p" = "Port"; "listen-port" = "ListenPort";
                             "host" = "Hostname"; "hostname" = "Hostname" } }
        "win9x-*" { $map = @{ "port" = "Port"; "p" = "Port" } }
        "logs" { $map = @{ "service" = "Service"; "s" = "Service"; "lines" = "Lines"; "n" = "Lines" } }
        "use-chrome" { $map = @{} }
        "gui" { $map = @{ "reinstall" = "Reinstall" } }
        "activate" { $map = @{ "seats" = "Seats" } }
        default { $map = @{} }
    }

    # Unix spells these as bare negations; Windows scripts take switches, so a
    # positive form has to clear the corresponding switch rather than set one.
    $inverse = @{ "Onion" = "NoOnion"; "Anonymize" = "NoAnonymize" }

    $positionalName = $null
    if ($PositionalCommands.ContainsKey($Command)) { $positionalName = $PositionalCommands[$Command] }

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

        if ($positionalName -and -not $splat.ContainsKey($positionalName)) {
            $splat[$positionalName] = $a
            continue
        }

        throw "Positional argument '$a' is not supported; use named options (e.g. -Hostname localhost -Port 9955)."
    }

    foreach ($key in @($splat.Keys)) {
        if ($inverse.ContainsKey($key)) {
            # '-onion' means 'not -NoOnion'; drop both so the default applies.
            $splat.Remove($inverse[$key]) | Out-Null
            $splat.Remove($key) | Out-Null
        }
    }

    return $splat
}

# Function to handle revalidate command
function Invoke-Revalidate {
    $ticketPath = Join-Path $env:USERPROFILE ".config\dosaygo\bbpro\tickets\ticket.json"
    $reservationPath = Join-Path $env:USERPROFILE ".config\dosaygo\bbpro\tickets\reservation.json"
    
    if (-not (Test-Path (Split-Path $ticketPath))) {
        Write-Warning "Ticket directory does not exist at $(Split-Path $ticketPath)"
    }
    
    if (Test-Path $ticketPath) {
        Write-Host "Removing ticket.json..." -ForegroundColor Cyan
        Remove-Item $ticketPath -Force
        Write-Host "ticket.json removed." -ForegroundColor Green
    }
    else {
        Write-Host "No ticket found at $ticketPath" -ForegroundColor Yellow
    }

    if (Test-Path $reservationPath) {
        Write-Host "Removing reservation.json..." -ForegroundColor Cyan
        Remove-Item $reservationPath -Force
        Write-Host "reservation.json removed." -ForegroundColor Green
    }

    # Re-certify to obtain a fresh ticket (mirrors Unix bbrevalidate)
    Write-Host "Re-certifying license..." -ForegroundColor Cyan
    $certifyScript = Join-Path $PSScriptRoot "certify.ps1"
    if (Test-Path $certifyScript) {
        & $certifyScript
    } else {
        # Fallback: invoke via bbx command
        Invoke-CommandScript -Command "certify" -Arguments @()
    }
}

# Called as a statement, never as the condition of an if: a command that writes
# to stdout (bbx ng-config print, bbx vacancy) would otherwise have its output
# collected as this function's return value and thrown away.
function Invoke-CommandScript {
    param (
        [string]$Command,
        [string[]]$Arguments
    )

    $scriptPath = Join-Path $PSScriptRoot $ScriptMap[$Command]
    if (-not (Test-Path $scriptPath)) {
        [Console]::Error.WriteLine("bbx: the script for '$Command' is missing at $scriptPath")
        exit 1
    }

    # Progress chatter belongs on stderr so stdout carries only the command's
    # own output, which callers redirect and parse.
    [Console]::Error.WriteLine("Running bbx $Command...")

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
    # SEA PE metadata identifies Node, not BrowserBox. Read the app's version
    # contract without letting native stderr terminate PowerShell 5.1 callers.
    $process = New-Object System.Diagnostics.Process
    try {
        $process.StartInfo.FileName = $path
        $process.StartInfo.Arguments = '--version'
        $process.StartInfo.UseShellExecute = $false
        $process.StartInfo.CreateNoWindow = $true
        $process.StartInfo.RedirectStandardOutput = $true
        $process.StartInfo.RedirectStandardError = $true
        [void]$process.Start()
        $stdout = $process.StandardOutput.ReadToEndAsync()
        $stderr = $process.StandardError.ReadToEndAsync()
        if (-not $process.WaitForExit(5000)) {
            $process.Kill()
            return $null
        }
        if ($process.ExitCode -ne 0) { return $null }
        return Get-SemverFromText -Text $stdout.GetAwaiter().GetResult()
    } catch { return $null }
    finally { $process.Dispose() }
}

# Main execution logic (argv-driven; do not let PowerShell bind subcommand options to this wrapper)
$argv = @($args | Where-Object { $_ -ne $null -and $_ -ne "" })

# Library mode: let the regression suite dot-source this file and call the
# parsing helpers without an update check or a dispatched command.
if ($env:BBX_LIB_MODE -or ($argv -contains '-BbxLibraryMode')) {
    return
}

if (-not $argv -or $argv.Count -eq 0) {
    Show-Help
    exit 0
}

$Command = [string]$argv[0]
$CommandArgs = @()
if ($argv.Count -gt 1) { $CommandArgs = @($argv[1..($argv.Count - 1)]) }

$CommandArgs = Normalize-CommandArgs -ArgList $CommandArgs
$normalizedCommand = $Command.ToLowerInvariant()

# Reject typos and unsupported platform commands before update/install checks.
# Keep explicit binary entrypoints available for diagnostics and service helpers.
$binaryCommands = @(
    'main', 'audio', 'docs', 'devtools', 'pm2', 'pm2-guard', 'policy',
    'flipbook-finalize', 'flipbook-generate', 'chrome-cleanup',
    'uuid', 'device-id', 'sign-ed25519', 'verify-rsa-sha256', 'license-request',
    '--install', '--full-install', '--uninstall', '--version', '--help'
)
$wrapperCommands = @(
    'status', 'revalidate', '--help-json', '--output-log', '--faq',
    '--help', '-help', 'help', '-h', '--version', '-v', 'version'
)
if (-not $ScriptMap.ContainsKey($normalizedCommand) -and
    $normalizedCommand -notin $wrapperCommands -and
    $normalizedCommand -notin $binaryCommands) {
    [Console]::Error.WriteLine("bbx: unknown or unsupported command '$Command' on Windows. Run 'bbx --help' for supported commands.")
    exit 2
}

if ($env:BBX_DEBUG_CLI -and $env:BBX_DEBUG_CLI -ne "0" -and $env:BBX_DEBUG_CLI.ToLowerInvariant() -ne "false") {
    [Console]::Error.WriteLine("[bbx] Command: $Command")
    [Console]::Error.WriteLine("[bbx] Argument count: $($CommandArgs.Count)")
    [Console]::Error.WriteLine("[bbx] Normalized: $normalizedCommand")
}

if (-not $Command -or $normalizedCommand -in @("--help","-help","help","-h")) {
    Show-Help
    exit 0
}

if ($normalizedCommand -eq "--output-log") {
    if ($CommandArgs.Count -lt 3 -or -not [IO.Path]::IsPathRooted($CommandArgs[0]) -or $CommandArgs[1] -ne "--") {
        [Console]::Error.WriteLine("usage: bbx --output-log C:\absolute\new\log -- command [args...]")
        exit 2
    }
    $logPath = $CommandArgs[0]
    try {
        $created = [IO.File]::Open($logPath, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::Read)
    } catch {
        [Console]::Error.WriteLine("bbx: cannot create output log: $($_.Exception.Message)")
        exit 2
    }
    $inner = @($CommandArgs[2..($CommandArgs.Count - 1)])
    # One encoding on both PS5 and PS7; PS5 redirection otherwise writes UTF-16.
    # Retain the create-new handle and flush each observation for the GUI tail.
    $writer = New-Object IO.StreamWriter($created, (New-Object Text.UTF8Encoding($false)))
    $writer.AutoFlush = $true
    $savedError = [Console]::Error
    try {
        # This wrapper also uses Console.Error directly; it bypasses PS streams.
        [Console]::SetError($writer)
        & $PSCommandPath @inner *>&1 | ForEach-Object { $writer.WriteLine($_.ToString()); $writer.Flush() }
        $commandExit = $LASTEXITCODE
    } finally { [Console]::SetError($savedError); $writer.Dispose() }
    exit $commandExit
}

if ($normalizedCommand -eq "--faq") {
    Show-Faq
    exit 0
}

if ($normalizedCommand -eq "--help-json") {
    $rc = Write-BbxHelpCatalogue -ArgList $CommandArgs
    exit $rc
}

if ($normalizedCommand -eq "status") {
    $status = Get-BbxStatus
    if ($CommandArgs -contains "--json") {
        $status | ConvertTo-Json -Depth 4 -Compress
    } else {
        $word = if ($status.running) { "running" } else { "not running" }
        Write-Host "BrowserBox is $word ($($status.detection))."
        if ($status.main_port) { Write-Host "$($status.scheme)://$($status.hostname):$($status.main_port)" }
    }
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

Invoke-UpdateCheck -Command $normalizedCommand -CommandArgs $CommandArgs

# Chrome guard: commands that launch BrowserBox require a browser
$chromeNeededCommands = @(
    "run", "start", "restart",
    "cf-start", "cf-run", "tor-start", "tor-run", "zt-start", "zt-run",
    "ng-start", "ng-run", "win9x-start", "win9x-run"
)
if ($normalizedCommand -in $chromeNeededCommands) {
    $chromeFound = $false
    if ($env:CHROME_PATH -and (Test-Path $env:CHROME_PATH)) {
        $chromeFound = $true
    }
    if (-not $chromeFound) {
        $chromePaths = @(
            "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
            "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
            "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
        )
        foreach ($p in $chromePaths) {
            if (Test-Path $p) { $chromeFound = $true; break }
        }
    }
    if (-not $chromeFound) {
        $reg = Get-ItemProperty -Path "HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" -ErrorAction SilentlyContinue
        if ($reg) { $chromeFound = $true }
    }
    if (-not $chromeFound) {
        Write-Host "Chrome/Chromium is not installed." -ForegroundColor Red
        Write-Host "BrowserBox requires a Chrome-family browser to run."
        Write-Host "Install it with:  browserbox --full-install <hostname> <email>"
        exit 1
    }
}

if ($normalizedCommand -in @("run", "start")) {
    # Mirror Unix bbx.sh: run certify in background, launch binary concurrently,
    # wait for certify. The binary's validateLicense polls for reservation.json.
    $certifyScript = Join-Path $PSScriptRoot "certify.ps1"
    $startScript = Join-Path $PSScriptRoot "start.ps1"

    # Resolve LICENSE_KEY (env > config)
    $ConfigDir = "$env:USERPROFILE\.config\dosaygo\bbpro"
    $TestEnvFile = "$ConfigDir\test.env"
    $lk = $env:LICENSE_KEY
    if (-not $lk -and (Test-Path $TestEnvFile)) {
        Get-Content $TestEnvFile | ForEach-Object {
            if ($_ -match "^LICENSE_KEY=(.+)$") { $lk = $Matches[1] }
        }
    }
    if (-not $lk) {
        Write-Error "No LICENSE_KEY available. Run 'bbx certify' or set LICENSE_KEY env var."
        exit 1
    }

    Write-Host "[startup] Certifying license..." -ForegroundColor Yellow
    $certJob = Start-Job -ScriptBlock {
        param($script, $key)
        $env:LICENSE_KEY = $key
        $env:BBX_NONINTERACTIVE = "true"
        & $script
    } -ArgumentList $certifyScript, $lk

    Write-Host "[startup] Starting BrowserBox services..." -ForegroundColor Yellow
    if ($CommandArgs -and $CommandArgs.Count -gt 0) {
        $params = Convert-ArgListToSplat -Command $normalizedCommand -ArgList $CommandArgs
        & $startScript @params
    } else {
        & $startScript
    }
    $startRc = $LASTEXITCODE
    if ($startRc -ne 0) {
        Write-Host "Failed to start BrowserBox (exit $startRc)." -ForegroundColor Red
        Stop-Job $certJob -ErrorAction SilentlyContinue
        Remove-Job $certJob -Force -ErrorAction SilentlyContinue
        exit $startRc
    }

    # Wait for background certification (bounded: 120s)
    Write-Host "[startup] Waiting for license certification..." -ForegroundColor Yellow
    $certResult = $certJob | Wait-Job -Timeout 120
    if (-not $certResult -or $certResult.State -eq 'Running') {
        Write-Host "License certification timed out after 120s." -ForegroundColor Red
        Receive-Job $certJob -ErrorAction SilentlyContinue | Write-Host
        Stop-Job $certJob -ErrorAction SilentlyContinue
        Remove-Job $certJob -Force -ErrorAction SilentlyContinue
        bbx stop 2>$null
        exit 1
    }
    $certOutput = Receive-Job $certJob -ErrorAction SilentlyContinue
    if ($certResult.State -eq 'Failed') {
        Write-Host "License check failed. Run 'bbx certify' or visit dosaygo.com." -ForegroundColor Red
        $certOutput | Write-Host
        Remove-Job $certJob -Force -ErrorAction SilentlyContinue
        bbx stop 2>$null
        exit 1
    }
    Remove-Job $certJob -Force -ErrorAction SilentlyContinue
    Write-Host "[startup] License certified." -ForegroundColor Green
    exit 0
}
elseif ($ScriptMap.ContainsKey($normalizedCommand)) {
    Invoke-CommandScript -Command $normalizedCommand -Arguments $CommandArgs
    exit $LASTEXITCODE
}
else {
    # Pass through to the browserbox binary
    Ensure-Binary
    $passArgs = @($Command) + $CommandArgs
    & $script:ResolvedBinaryPath @passArgs
    exit $LASTEXITCODE
}
