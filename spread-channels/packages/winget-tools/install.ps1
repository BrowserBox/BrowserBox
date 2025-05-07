[CmdletBinding()]
param (
  [ValidateSet("/shhh", "/shh")]
  [string]$InstallMode = "/shhh"
)

$ProgressPreference = 'SilentlyContinue'

$branch = 'main'
$ForceAll = $false
$Debug = $false

# Ensure running as Administrator
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Not running as Administrator. Relaunching..." -ForegroundColor Yellow
    $scriptPath = $PSCommandPath
    $arguments = @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", "`"$scriptPath`"",
        "-InstallMode", $InstallMode
    )
    Start-Process powershell -Verb RunAs -ArgumentList $arguments
    Start-Sleep -Seconds 2
    return
}

Write-Host "Running as Administrator." -ForegroundColor Green
Start-Sleep -Seconds 2

# Function to fetch installer URLs (unchanged)
function Get-InstallerUrlFromWinget {
  param (
    [Parameter(Mandatory = $true)][string]$PackageId,
    [Parameter(Mandatory = $true)][string]$Version,
    [Parameter(Mandatory = $true)][string]$Architecture
  )

  $segments = $PackageId -split '\.'
  if ($segments.Length -lt 2) {
    throw "Invalid PackageId: $PackageId"
  }

  $firstLetter = $segments[0].Substring(0,1).ToLower()
  $slugPath = "$firstLetter/$($segments -join '/')/$Version"
  $yamlFileName = "$PackageId.installer.yaml"
  $url = "https://raw.githubusercontent.com/microsoft/winget-pkgs/refs/heads/master/manifests/$slugPath/$yamlFileName"

  try {
    Write-Host "🔍 Fetching YAML from: $url"
    $yamlRaw = Invoke-RestMethod -Uri $url -Headers @{ 'User-Agent' = 'winget-fetcher' }

    # Split YAML into lines
    $lines = $yamlRaw -split "`n"

    # Helper function to parse for a specific architecture
    function Find-InstallerUrl {
      param (
        [string]$TargetArch,
        [array]$Lines
      )
      $inInstallers = $false
      $currentArch = $null
      $installerUrl = $null
      $installerSha256 = $null
      foreach ($line in $Lines) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith('#')) {
          continue
        }
        $parts = $trimmed -split ':', 2
        if ($parts.Length -lt 2) {
          continue
        }
        $key = $parts[0].Trim()
        $value = $parts[1].Trim()
        if ($key -eq "Installers") {
          $inInstallers = $true
          continue
        }
        if ($inInstallers -and $key -eq "- Architecture") {
          $currentArch = $value
          continue
        }
        if ($inInstallers -and $currentArch -ieq $TargetArch) {
          if ($key -eq "Installer pełni") {
            $installerUrl = $value
            continue
          }
          if ($key -eq "InstallerSha256" -and $installerUrl) {
            $installerSha256 = $value
            return @{ Url = $installerUrl; Sha256 = $installerSha256 }
          }
        }
      }
      if ($installerUrl) {
        return @{ Url = $installerUrl; Sha256 = $null }
      }
      return $null
    }

    # Define fallback list based on architecture
    $fallbackList = @()
    if ($Architecture -ieq "arm64") {
      $fallbackList = @("arm64", "x64", "x86")
    } elseif ($Architecture -ieq "x64") {
      $fallbackList = @("x64", "x86")
    } else {
      $fallbackList = @("x86")
    }

    # Try each architecture in the fallback list
    foreach ($arch in $fallbackList) {
      $result = Find-InstallerUrl -TargetArch $arch -Lines $lines
      if ($result) {
        $message = if ($arch -ieq $Architecture) {
          "✅ $PackageId ($Architecture): $($result.Url)"
        } else {
          "⚠️ $PackageId ($Architecture not found, using $arch): $($result.Url)"
        }
        Write-Host $message
        if ($result.Sha256) {
          Write-Host "🔒 SHA256: $($result.Sha256)"
        } else {
          Write-Warning "⚠️ No SHA256 found for $PackageId ($arch)"
        }
        return $result
      }
    }

    Write-Warning "⚠️ No installer found for architecture: $Architecture or compatible fallback"
    return $null
  } catch {
    Write-Warning "❌ Failed to fetch or parse installer YAML for $PackageId $Version. Error: $($_.Exception.Message)"
    return $null
  }
}

# Function to detect system architecture (unchanged)
function Get-SystemArchitecture {
  $arch = (Get-CimInstance Win32_OperatingSystem).OSArchitecture
  switch -Wildcard ($arch) {
    "*64*" {
      if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { return "arm64" }
      else { return "x64" }
    }
    "*32*" { return "x86" }
    default { throw "Unknown system architecture: $arch" }
  }
}

# Determine system architecture
$arch = Get-SystemArchitecture
Write-Host "🎯 System architecture detected: $arch`n"

# Define packages and versions with dynamic paths
$packages = @(
  @{ Id = "Git.Git"; Version = "2.49.0"; InstallPath = "$env:ProgramFiles\Git"; PathAdd = "$env:ProgramFiles\Git\cmd;$env:ProgramFiles\Git\usr\bin"; IsPortable = $false },
  @{ Id = "OpenJS.NodeJS.LTS"; Version = "22.15.0"; InstallPath = "$env:ProgramFiles\nodejs"; PathAdd = "$env:ProgramFiles\nodejs"; IsPortable = $false },
  @{ Id = "FiloSottile.mkcert"; Version = "1.4.4"; InstallPath = "$env:ProgramFiles\mkcert"; PathAdd = "$env:ProgramFiles\mkcert"; IsPortable = $true },
  @{ Id = "EFF.Certbot"; Version = "2.9.0"; InstallPath = "$env:ProgramFiles\Certbot"; PathAdd = "$env:ProgramFiles\Certbot\bin"; IsPortable = $false },
  @{ Id = "Google.Chrome.EXE"; Version = "136.0.7103.49"; InstallPath = $null; PathAdd = $null; IsPortable = $false }
)

# Create timestamped installers directory
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$baseDir = $env:TEMP
$installersDir = Join-Path $baseDir "installers-$timestamp"

# Fallback to user home if temp dir isn't writable
try {
  New-Item -ItemType Directory -Path $installersDir -ErrorAction Stop | Out-Null
} catch {
  Write-Warning "⚠️ Could not create directory in temp folder ($baseDir). Falling back to user home directory."
  $baseDir = $env:USERPROFILE
  $installersDir = Join-Path $baseDir "installers-$timestamp"
  New-Item -ItemType Directory -Path $installersDir -ErrorAction Stop | Out-Null
}

Write-Host "📂 Saving installers to: $installersDir`n"

# Fetch, download, and execute installers for each package
foreach ($pkg in $packages) {
  $packageId = $pkg.Id
  $version = $pkg.Version
  $installPath = $pkg.InstallPath
  $pathAdd = $pkg.PathAdd
  $isPortable = $pkg.IsPortable

  # Check if already installed
  $isInstalled = $false
  if ($packageId -eq "Git.Git") {
    $isInstalled = Test-Path "$env:ProgramFiles\Git\usr\bin\unzip.exe"
  } elseif ($packageId -eq "OpenJS.NodeJS.LTS") {
    $isInstalled = (Get-Command node -ErrorAction SilentlyContinue) -and (Test-Path "$installPath\node.exe")
  } elseif ($packageId -eq "FiloSottile.mkcert") {
    $isInstalled = Test-Path "$installPath\mkcert.exe"
  } elseif ($packageId -eq "EFF.Certbot") {
    $isInstalled = Test-Path "$installPath\bin\certbot.exe"
  } elseif ($packageId -eq "Google.Chrome.EXE") {
    $isInstalled = Get-ItemProperty -Path "HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" -ErrorAction SilentlyContinue
  }

  if ($isInstalled -and -not $ForceAll) {
    Write-Host "$packageId already installed -- skipping." -ForegroundColor Cyan
    continue
  }

  # Fetch installer URL and SHA256
  Write-Host "Fetching installer for $packageId $version..." -ForegroundColor Cyan
  $result = Get-InstallerUrlFromWinget -PackageId $packageId -Version $version -Architecture $arch
  if (-not $result) {
    Write-Warning "Skipping installation of $packageId due to fetch failure."
    continue
  }

  # Download installer
  Write-Host "`n➡️  Download URL for ${packageId}:"
  Write-Host "$($result.Url)`n"
  if ($result.Sha256) {
    Write-Host "🔒 SHA256 for ${packageId}:"
    Write-Host "$($result.Sha256)`n"
  }
  $filename = [System.IO.Path]::GetFileName($result.Url)
  $outputPath = Join-Path $installersDir $filename
  try {
    Write-Host "📥 Downloading $packageId to $outputPath..."
    $originalProgressPreference = $ProgressPreference
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $result.Url -OutFile $outputPath -ErrorAction Stop
    $ProgressPreference = $originalProgressPreference
    Write-Host "✅ Downloaded $packageId successfully!`n"
  } catch {
    Write-Warning "❌ Failed to download $packageId. Error: $($_.Exception.Message)`n"
    continue
  }

  # Handle portable vs installer
  if ($isPortable) {
    # For portable EXEs like mkcert, copy to install path
    Write-Host "⚙️ Placing $packageId in $installPath..." -ForegroundColor Cyan
    try {
      if (-not (Test-Path $installPath)) {
        New-Item -ItemType Directory -Path $installPath -Force | Out-Null
      }
      $targetPath = Join-Path $installPath "mkcert.exe"
      Copy-Item -Path $outputPath -Destination $targetPath -Force -ErrorAction Stop
      Write-Host "✅ Placed $packageId successfully!`n" -ForegroundColor Green
    } catch {
      Write-Warning "❌ Failed to place $packageId. Error: $($_.Exception.Message)`n"
      continue
    }
  } else {
    # For installers, execute as before
    Write-Host "⚙️ Installing $packageId..." -ForegroundColor Cyan
    $installerArgs = @()
    $isMsi = $filename -like "*.msi"
    if ($InstallMode -eq "/shhh") {
      if ($isMsi) {
        $installerArgs = @("/quiet", "/norestart")
        if ($installPath) {
          $installerArgs += "INSTALLDIR=`"$installPath`""
        }
      } else {
        $installerArgs = @("/S")
        if ($installPath) {
          $installerArgs += "/DIR=`"$installPath`""
        }
      }
    } else {  # /shh
      if ($isMsi) {
        $installerArgs = @("/passive", "/norestart")
        if ($installPath) {
          $installerArgs += "INSTALLDIR=`"$installPath`""
        }
      } else {
        $installerArgs = @("/S")
        if ($installPath) {
          $installerArgs += "/DIR=`"$installPath`""
        }
      }
    }

    try {
      if ($isMsi) {
        Start-Process -FilePath "msiexec.exe" -ArgumentList (@("/i", "`"$outputPath`"") + $installerArgs) -Wait -NoNewWindow
      } else {
        Start-Process -FilePath $outputPath -ArgumentList $installerArgs -Wait -NoNewWindow
      }
      Write-Host "✅ Installed $packageId successfully!`n" -ForegroundColor Green
    } catch {
      Write-Warning "❌ Failed to install $packageId. Error: $($_.Exception.Message)`n"
      continue
    }
  }

  # Update Machine PATH if specified
  if ($pathAdd) {
    $currentMachinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $pathEntries = $pathAdd -split ';'
    foreach ($entry in $pathEntries) {
      if ($currentMachinePath -notlike "*$entry*") {
        Write-Host "Adding '$entry' to Machine PATH..." -ForegroundColor Cyan
        $newMachinePath = "$currentMachinePath;$entry"
        [Environment]::SetEnvironmentVariable("Path", $newMachinePath, "Machine")
        $currentMachinePath = $newMachinePath
      }
    }
  }
}

# Update current session PATH
$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")

# BrowserBox setup with dynamic paths
$bbxUrl = "https://github.com/BrowserBox/BrowserBox/archive/refs/heads/$branch.zip"
$tempZip = "$env:TEMP\browserbox-$branch.zip"
$installDir = "$env:ProgramFiles\browserbox"
$bbxDir = "$installDir\windows-scripts"
$tempExtractDir = "$env:TEMP\browserbox-extract-$branch"
$unzipPath = "$env:ProgramFiles\Git\usr\bin\unzip.exe"

# BrowserBox
Write-Host "Downloading BrowserBox from branch '$branch'..." -ForegroundColor Cyan
(New-Object Net.WebClient).DownloadFile($bbxUrl, $tempZip)
if ($Debug) { Read-Host "Downloaded ZIP to $tempZip. Press Enter to continue..." }

Write-Host "Cleaning existing install at $installDir..." -ForegroundColor Cyan
if (Test-Path $installDir) {
    Remove-Item $installDir -Recurse -Force
}
if ($Debug) { Read-Host "Cleaned $installDir (if it existed). Press Enter to continue..." }

Write-Host "Extracting to temporary directory $tempExtractDir with unzip..." -ForegroundColor Cyan
if (Test-Path $tempExtractDir) {
    Remove-Item $tempExtractDir -Recurse -Force
}
New-Item -Path $tempExtractDir -ItemType Directory -Force | Out-Null
& $unzipPath -q $tempZip -d $tempExtractDir
if ($LASTEXITCODE -eq 0) {
    Write-Host "Extraction completed successfully." -ForegroundColor Green
} else {
    Write-Error "Extraction failed with exit code $LASTEXITCODE!"
    throw "INSTALL Error"
}
if ($Debug) { Read-Host "Extracted ZIP to $tempExtractDir. Press Enter to continue..." }

Write-Host "Mirroring to $installDir using robocopy..." -ForegroundColor Cyan
$extractedRoot = "$tempExtractDir\BrowserBox-$branch"
if (Test-Path $extractedRoot) {
    # Ensure installDir exists
    if (-not (Test-Path $installDir)) {
        New-Item -Path $installDir -ItemType Directory -Force | Out-Null
    }
    # Use robocopy to mirror the directory structure
    robocopy $extractedRoot $installDir /MIR /R:5 /W:5 /MT:8 /SL
    if ($LASTEXITCODE -le 7) {  # robocopy exit codes 0-7 indicate success
        Write-Host "Successfully mirrored files to $installDir" -ForegroundColor Green
        Remove-Item $tempExtractDir -Recurse -Force
    } else {
        Write-Error "robocopy failed with exit code $LASTEXITCODE!"
    }
} else {
    Write-Warning "Expected $extractedRoot not found after extraction!"
}
Remove-Item "$tempZip"
if ($Debug) { Read-Host "Mirrored contents to $installDir and cleaned up temp files. Press Enter to continue..." }

# Prepare step
$prepareScript = "$bbxDir\prepare.ps1"
if (Test-Path $prepareScript) {
    & powershell -NoProfile -ExecutionPolicy Bypass -File "$prepareScript"
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Preparation step failed -- continuing anyway."
    }
} else {
    Write-Warning "prepare.ps1 not found at $prepareScript -- skipping preparation."
}

# Debug: Show extracted contents
Write-Host "Checking install directory contents..." -ForegroundColor Cyan
Get-ChildItem $installDir -Recurse | ForEach-Object { if ($Debug) { Write-Host "Found: $($_.FullName)" } }
if ($Debug) { Read-Host "Listed contents of $installDir. Press Enter to continue..." }

# PATH (add bbx.ps1 directory to both Machine and User scopes)
$currentMachinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($currentMachinePath -notlike "*$bbxDir*") {
    Write-Host "Adding '$bbxDir' to Machine PATH permanently..." -ForegroundColor Cyan
    $newMachinePath = "$currentMachinePath;$bbxDir"
    [Environment]::SetEnvironmentVariable("Path", $newMachinePath, "Machine")
}

# User PATH
$currentUserPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentUserPath -notlike "*$bbxDir*") {
    Write-Host "Adding '$bbxDir' to User PATH permanently..." -ForegroundColor Cyan
    $newUserPath = "$currentUserPath;$bbxDir"
    [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
}

# Update current session PATH
$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
if ($Debug) { Read-Host "Updated PATH with $bbxDir (Machine and User). Press Enter to continue..." }

# Verify
Write-Host "BrowserBox installed! Running 'bbx --help'..." -ForegroundColor Green
$bbxPath = "$bbxDir\bbx.ps1"
if (Test-Path $bbxPath) {
    & powershell -NoProfile -ExecutionPolicy Bypass -File "$bbxPath" --help
} else {
    Write-Warning "bbx.ps1 not found at $bbxPath! Searching for it..."
    $foundBbx = Get-ChildItem -Path $installDir -Filter "bbx.ps1" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($foundBbx) {
        Write-Host "Found bbx.ps1 at $($foundBbx.FullName), running it..." -ForegroundColor Cyan
        & powershell -NoProfile -ExecutionPolicy Bypass -File "$($foundBbx.FullName)" --help
    } else {
        Write-Error "bbx.ps1 not found anywhere in $installDir! Check ZIP structure for branch '$branch'."
        throw "INSTALL Error"
    }
}
if ($Debug) { Read-Host "Ran 'bbx --help' (or tried to). Press Enter to finish..." }
