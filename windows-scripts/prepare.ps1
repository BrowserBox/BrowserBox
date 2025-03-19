# prepare.ps1
# Located at C:\Program Files\browserbox\windows-scripts\prepare.ps1
[CmdletBinding()]
param ()

$installDir = "C:\Program Files\browserbox"

Write-Host "Preparing BrowserBox..." -ForegroundColor Cyan

# Check if in installDir
if (-not (Test-Path $installDir)) {
    Write-Error "BrowserBox install directory ($installDir) not found! Run 'bbx install' first."
    exit 1
}

# Ensure npm is available
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm not found! Ensure Node.js is installed."
    exit 1
}

# Install pm2 globally if missing
if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
    Write-Host "Installing pm2 globally..." -ForegroundColor Cyan
    & npm i -g pm2@latest
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed to install pm2 globally -- continuing anyway."
    }
}

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
    & npm i
    if ($LASTEXITCODE -ne 0) {
        Write-Error "npm install failed in $installDir!"
        exit 1
    }
    & npm audit fix
    & npm i --save-exact esbuild@latest
} else {
    Write-Warning "No package.json found in $installDir -- skipping root npm install."
}

# Subdirectory npm installs
$subDirs = @(
    "src/zombie-lord",
    "src/public/voodoo",
    "src/zombie-lord/custom-launcher",
    "services/instance/parec-server",
    "services/pool/crdp-secure-proxy-server",
    "services/chai"
)
foreach ($subDir in $subDirs) {
    $dirPath = Join-Path $installDir $subDir
    if (Test-Path $dirPath) {
        Set-Location $dirPath
        if (Test-Path "package.json") {
            Write-Host "Running npm install in $dirPath..." -ForegroundColor Cyan
            & npm i
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "npm install failed in $dirPath -- continuing."
            }
            & npm audit fix
        }
    } else {
        Write-Warning "Directory $dirPath not found -- skipping."
    }
}

Set-Location $installDir
Write-Host "BrowserBox preparation complete!" -ForegroundColor Green
