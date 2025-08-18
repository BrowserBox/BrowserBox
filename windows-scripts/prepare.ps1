# prepare.ps1
# Located at C:\Program Files\browserbox\windows-scripts\prepare.ps1
[CmdletBinding()]
param ()

$installDir = "C:\Program Files\browserbox"

Write-Host "Preparing BrowserBox..." -ForegroundColor Cyan

# Check if in installDir
if (-not (Test-Path $installDir)) {
    Write-Error "BrowserBox install directory ($installDir) not found! Run 'bbx install' first."
    return
}

# Ensure npm is available
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm not found! Ensure Node.js is installed."
    return
}

# we don't need pm2 on windows right now as we just handle it ourselves (tho no restarts like pm2)
# # Install pm2 globally if missing
# if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
#     Write-Host "Installing pm2 globally..." -ForegroundColor Cyan
#     npm i -g pm2@latest
#     if ($LASTEXITCODE -ne 0) {
#         Write-Warning "Failed to install pm2 globally -- continuing anyway."
#     }
# }

# Copy custom binding.js (if config dir exists)
$bindingSrc = Join-Path $installDir "config/roamhq-wrtc-lib-binding.js"
$bindingDest = Join-Path $installDir "node_modules/@roamhq/wrtc/lib/binding.js"
if (Test-Path $bindingSrc) {
    Write-Host "Copying custom @roamhq/wrtc/lib/binding.js..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path (Split-Path $bindingDest -Parent) -Force | Out-Null
    Copy-Item -Path $bindingSrc -Destination $bindingDest -Force
} else {
    Write-Warning "Custom binding.js not found at $bindingSrc -- skipping copy."
}

# Root npm install
Set-Location $installDir
if (Test-Path "package.json") {
    Write-Host "Running npm install in $installDir..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "npm install failed in $installDir!"
        return
    }
    npm audit fix
} else {
    Write-Warning "No package.json found in $installDir -- skipping root npm install."
}

# Subdirectory npm installs and voodoo prep
$subDirs = @(
    "src/zombie-lord",
    "src/public/voodoo",
    "src/zombie-lord/custom-launcher",
    "src/services/instance/parec-server",
    "src/services/pool/crdp-secure-proxy-server",
    "src/services/pool/chai"
)
foreach ($subDir in $subDirs) {
    $dirPath = Join-Path $installDir $subDir
    if (Test-Path $dirPath) {
        Set-Location $dirPath
        if (Test-Path "package.json") {
            Write-Host "Running npm install in $dirPath..." -ForegroundColor Cyan
            npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "npm install failed in $dirPath -- continuing."
            }
            npm audit fix

            # Voodoo-specific prep
            if ($subDir -eq "src/public/voodoo") {
                # Copy bang.html assets to .bang.html.snapshot
                $bangSrc = Join-Path $dirPath "node_modules/bang.html"
                $bangDest = Join-Path $dirPath ".bang.html.snapshot"
                if (Test-Path $bangSrc) {
                    Write-Host "Copying bang.html assets to $bangDest..." -ForegroundColor Cyan
                    New-Item -ItemType Directory -Path $bangDest -Force | Out-Null
                    Copy-Item -Path "$bangSrc\*" -Destination $bangDest -Recurse -Force
                    # Remove LICENSE files
                    Get-ChildItem -Path $bangDest -Filter "LICENSE" -File -Recurse | Remove-Item -Force
                } else {
                    Write-Warning "bang.html not found in $dirPath\node_modules -- skipping copy."
                }

                # Copy simple-peer JS
                $peerSrc = Join-Path $dirPath "node_modules/simple-peer/simplepeer.min.js"
                $peerDest = Join-Path $dirPath "src"
                if (Test-Path $peerSrc) {
                    Write-Host "Copying simplepeer.min.js to $peerDest..." -ForegroundColor Cyan
                    New-Item -ItemType Directory -Path $peerDest -Force | Out-Null
                    Copy-Item -Path $peerSrc -Destination $peerDest -Force
                } else {
                    Write-Warning "simple-peer not found in $dirPath\node_modules -- skipping copy."
                }

                # Copy lucide-static icons
                $lucideSrc = Join-Path $dirPath "node_modules/lucide-static/icons"
                $lucideDest = Join-Path $dirPath "assets/icons"
                if (Test-Path $lucideSrc) {
                    Write-Host "Copying lucide-static icons to $lucideDest..." -ForegroundColor Cyan
                    New-Item -ItemType Directory -Path $lucideDest -Force | Out-Null
                    Copy-Item -Path "$lucideSrc\*.svg" -Destination $lucideDest -Force
                } else {
                    Write-Warning "lucide-static not found in $dirPath\node_modules -- skipping copy."
                }
            }
        }
    } else {
        Write-Warning "Directory $dirPath not found -- skipping."
    }
}

Set-Location $installDir
Write-Host "BrowserBox preparation complete!" -ForegroundColor Green
