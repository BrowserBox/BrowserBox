[CmdletBinding()]
param(
    [Parameter(Mandatory = $false, HelpMessage = "Show help.")]
    [switch]$Help
)

if ($Help -or $args -contains '-help') {
    Write-Host "bbx install" -ForegroundColor Green
    Write-Host "Install BrowserBox (binary distribution)" -ForegroundColor Yellow
    Write-Host "Usage: bbx install" -ForegroundColor Cyan
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  -Help    Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Environment overrides:" -ForegroundColor Cyan
    Write-Host "  BBX_RELEASE_REPO, BBX_RELEASE_TAG, GH_TOKEN/GITHUB_TOKEN, BBX_NO_UPDATE" -ForegroundColor White
    $global:LASTEXITCODE = 0
    return
}

$ErrorActionPreference = "Stop"

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
$BinaryName = "browserbox.exe"
$RemoteAssetName = "browserbox-win-x64.exe"
$BinaryPath = Join-Path $BinaryDir $BinaryName

function Ensure-BinaryDir {
    if (-not (Test-Path $BinaryDir)) {
        New-Item -ItemType Directory -Path $BinaryDir -Force | Out-Null
    }
}

function Get-LatestRelease {
    param([string]$Repo)

    if ($NoUpdate) {
        if ($env:BBX_RELEASE_TAG) { return $env:BBX_RELEASE_TAG }
        return $null
    }

    $headers = @{}
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }

    try {
        $apiUrl = "https://api.github.com/repos/$Repo/releases/latest"
        $response = Invoke-RestMethod -Uri $apiUrl -TimeoutSec 10 -Headers $headers -ErrorAction Stop
        return $response.tag_name
    } catch {
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
            if ($Tag) {
                $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$ReleaseRepo/releases/tags/$Tag" -Headers $headers -ErrorAction Stop
            } else {
                $releases = Invoke-RestMethod -Uri "https://api.github.com/repos/$ReleaseRepo/releases" -Headers $headers -ErrorAction Stop
                if (-not $releases -or $releases.Count -eq 0) {
                    Write-Error "No releases found in $ReleaseRepo"
                    exit 1
                }
                $release = $releases[0]
                $Tag = $release.tag_name
            }

            $asset = $release.assets | Where-Object { $_.name -eq $RemoteAssetName } | Select-Object -First 1
            if (-not $asset) {
                Write-Error "Release $Tag not found in $ReleaseRepo"
                exit 1
            }
            $assetUrl = "https://api.github.com/repos/$ReleaseRepo/releases/assets/$($asset.id)"
            Invoke-WebRequest -Uri $assetUrl -Headers @{ Authorization = "Bearer $Token"; Accept = "application/octet-stream" } -OutFile $tempFile -ErrorAction Stop
        } else {
            $downloadUrl = if ($Tag) {
                "https://github.com/$ReleaseRepo/releases/download/$Tag/$RemoteAssetName"
            } else {
                "https://github.com/$ReleaseRepo/releases/latest/download/$RemoteAssetName"
            }
            Invoke-WebRequest -Uri $downloadUrl -OutFile $tempFile -ErrorAction Stop
        }

        if (Test-Path $BinaryPath) {
            Remove-Item $BinaryPath -Force
        }
        Move-Item $tempFile $BinaryPath -Force
    } catch {
        Write-Error "Failed to download binary: $_"
        exit 1
    }
}

$IntegrityPublicKeyPem = @'
-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAnqKI++Z5x+cHF1je6Ww9
r3hNRuefjZzlJGPD56IQTbVIDXZT45uGNHelg+BjlZezdGH86y29zKgx2g3pt8cC
Yp8KMSgg69uo9EVFlDw8HQ1Sf7rciiU89neb48lkm5GfzXtAyIFWQj83AHDblQUq
UJoXuu7YQLskHiRa0YPOkPf5KUHS8Yv1OJwXldsmd/+NGCrZki1o6xEt55B5qo3J
89jUiVnSafUhZXuQiwYfRT5MVoBBFl6TK/kg3qTF4oVBvz0r4HO/C1uAEytaDEI4
CFy2XO6i64DgSbkjzXCsomlHU0ywPbLxXPUst5AZwX62f/caGKGZs7IrZDBYNI2k
bBZ5fCAFhExwI0HUVIFC31YFpFRZB3UnVQdE0q8UuZyCstubPk7gdkEljnCXDnMB
bvgk5+5y8WgCrbu3mndlbb4K9NqxFq3tJppM8Gq8Rip94DghUBlRMXCBwaZ+EsBZ
ZwkpTdoWvsJcO+NwHscRvHNRcDRUrDwMrTpSs/cfCRMUo0ze0ZxpenCQuQpae7ei
Rs4+aW0rrwZBFo+o5GNWDOADAoD4JEPBNuSJyOw4mjdTgf8O9pIJfDF7HtX7pHr7
e8u3jamSWvZSZA+50fI6iL05JUDA4cQ529voRTxiLALgLkSnlGY2EQrDr9A8lH4/
hYdYq1pXWapoaFZTuPK4ln8CAwEAAQ==
-----END PUBLIC KEY-----
'@

function Convert-HexToBytes {
    param([string]$Hex)
    $Hex = $Hex.Trim()
    if ($Hex.Length % 2 -ne 0) {
        throw "Invalid hex string length."
    }
    $bytes = New-Object byte[] ($Hex.Length / 2)
    for ($i = 0; $i -lt $Hex.Length; $i += 2) {
        $bytes[$i / 2] = [Convert]::ToByte($Hex.Substring($i, 2), 16)
    }
    return $bytes
}

function Read-AsnLength {
    param([System.IO.BinaryReader]$Reader)
    $length = $Reader.ReadByte()
    if ($length -lt 0x80) { return $length }
    $byteCount = $length -band 0x7F
    $length = 0
    for ($i = 0; $i -lt $byteCount; $i++) {
        $length = ($length -shl 8) -bor $Reader.ReadByte()
    }
    return $length
}

function Read-AsnSequence {
    param([System.IO.BinaryReader]$Reader)
    $tag = $Reader.ReadByte()
    if ($tag -ne 0x30) { throw "Invalid ASN.1 sequence tag: $tag" }
    return Read-AsnLength -Reader $Reader
}

function Read-AsnIntegerBytes {
    param([System.IO.BinaryReader]$Reader)
    $tag = $Reader.ReadByte()
    if ($tag -ne 0x02) { throw "Invalid ASN.1 integer tag: $tag" }
    $length = Read-AsnLength -Reader $Reader
    $bytes = $Reader.ReadBytes($length)
    if ($bytes.Length -gt 0 -and $bytes[0] -eq 0x00) {
        return $bytes[1..($bytes.Length - 1)]
    }
    return $bytes
}

function Get-RsaPublicKeyFromPem {
    param([string]$Pem)
    $base64 = $Pem -replace '-----BEGIN PUBLIC KEY-----','' -replace '-----END PUBLIC KEY-----','' -replace '\s',''
    $der = [Convert]::FromBase64String($base64)
    $ms = New-Object System.IO.MemoryStream(,$der)
    $reader = New-Object System.IO.BinaryReader($ms)
    $null = Read-AsnSequence -Reader $reader
    $algLen = Read-AsnSequence -Reader $reader
    $null = $reader.ReadBytes($algLen)
    $bitTag = $reader.ReadByte()
    if ($bitTag -ne 0x03) { throw "Invalid ASN.1 bit string tag: $bitTag" }
    $bitLen = Read-AsnLength -Reader $reader
    $null = $reader.ReadByte()
    $bitBytes = $reader.ReadBytes($bitLen - 1)
    $inner = New-Object System.IO.BinaryReader((New-Object System.IO.MemoryStream(,$bitBytes)))
    $null = Read-AsnSequence -Reader $inner
    $modulus = Read-AsnIntegerBytes -Reader $inner
    $exponent = Read-AsnIntegerBytes -Reader $inner
    $params = New-Object System.Security.Cryptography.RSAParameters
    $params.Modulus = $modulus
    $params.Exponent = $exponent
    $rsa = New-Object System.Security.Cryptography.RSACryptoServiceProvider
    $rsa.ImportParameters($params)
    return $rsa
}

function Verify-ManifestSignature {
    param(
        [string]$ManifestPath,
        [string]$SignaturePath
    )

    if (-not (Test-Path $ManifestPath)) { throw "Manifest not found at $ManifestPath" }
    if (-not (Test-Path $SignaturePath)) { throw "Signature not found at $SignaturePath" }

    $manifestBytes = [System.IO.File]::ReadAllBytes($ManifestPath)
    $domain = [System.Text.Encoding]::UTF8.GetBytes("INTEGRITY/RELEASE_MANIFEST/v1`0")
    $payload = New-Object byte[] ($domain.Length + $manifestBytes.Length)
    [System.Array]::Copy($domain, 0, $payload, 0, $domain.Length)
    [System.Array]::Copy($manifestBytes, 0, $payload, $domain.Length, $manifestBytes.Length)

    $sigHex = (Get-Content $SignaturePath -Raw).Trim()
    if (-not $sigHex) { throw "Signature file is empty." }
    $sigBytes = Convert-HexToBytes -Hex $sigHex

    $rsa = [System.Security.Cryptography.RSA]::Create()
    if ($rsa -and ($rsa | Get-Member -Name ImportFromPem -MemberType Method)) {
        $rsa.ImportFromPem($IntegrityPublicKeyPem)
    } else {
        $rsa = Get-RsaPublicKeyFromPem -Pem $IntegrityPublicKeyPem
    }
    $ok = $rsa.VerifyData($payload, $sigBytes, [System.Security.Cryptography.HashAlgorithmName]::SHA256, [System.Security.Cryptography.RSASignaturePadding]::Pkcs1)
    if (-not $ok) { throw "Release manifest signature verification failed." }
}

function Get-FileSha256 {
    param([string]$Path)
    if (-not (Test-Path $Path)) { throw "File not found: $Path" }
    return (Get-FileHash -Path $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

$tag = if ($env:BBX_RELEASE_TAG) { $env:BBX_RELEASE_TAG } else { Get-LatestRelease -Repo $ReleaseRepo }
if (-not $tag) {
    Write-Error "Could not determine release tag."
    exit 1
}

Download-Binary -Tag $tag

# Try global location first (C:\ProgramData), fallback to user dir
$globalDir = Join-Path $env:PROGRAMDATA "dosaygo\bbpro"
$userConfigDir = "$env:USERPROFILE\.config\dosaygo\bbpro"

# Check if we can write to ProgramData (admin privileges)
$useGlobal = $false
try {
    if (-not (Test-Path $globalDir)) { 
        New-Item -ItemType Directory -Path $globalDir -Force -ErrorAction Stop | Out-Null 
    }
    $useGlobal = $true
} catch {
    # No admin access, use user config dir
    if (-not (Test-Path $userConfigDir)) { 
        New-Item -ItemType Directory -Path $userConfigDir -Force | Out-Null 
    }
}

$targetDir = if ($useGlobal) { $globalDir } else { $userConfigDir }
$locationDesc = if ($useGlobal) { "global location" } else { "user config" }

$tempBase = $env:TEMP
if (-not $tempBase) { $tempBase = "C:\Windows\Temp" }
$tempDir = Join-Path $tempBase "bbx-installer"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
$manifestPath = Join-Path $tempDir "release.manifest.json"
$sigPath = Join-Path $tempDir "release.manifest.json.sig"

Write-Host "Downloading release manifest to $locationDesc..." -ForegroundColor Yellow
try {
    $publicRepo = if ($PublicRepo) { $PublicRepo } else { "BrowserBox/BrowserBox" }
    if ($Token -or $ReleaseRepo -ne $publicRepo) {
        if (-not $Token) { throw "GH_TOKEN/GITHUB_TOKEN is required to download manifests from $ReleaseRepo." }
        $headers = @{ Authorization = "Bearer $Token" }
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$ReleaseRepo/releases/tags/$tag" -Headers $headers -ErrorAction Stop
        $manifestAsset = $release.assets | Where-Object { $_.name -eq "release.manifest.json" } | Select-Object -First 1
        $sigAsset = $release.assets | Where-Object { $_.name -eq "release.manifest.json.sig" } | Select-Object -First 1
        if (-not $manifestAsset -or -not $sigAsset) { throw "Manifest assets not found on release $tag." }
        Invoke-WebRequest -Uri "https://api.github.com/repos/$ReleaseRepo/releases/assets/$($manifestAsset.id)" -Headers @{ Authorization = "Bearer $Token"; Accept = "application/octet-stream" } -OutFile $manifestPath -ErrorAction Stop
        Invoke-WebRequest -Uri "https://api.github.com/repos/$ReleaseRepo/releases/assets/$($sigAsset.id)" -Headers @{ Authorization = "Bearer $Token"; Accept = "application/octet-stream" } -OutFile $sigPath -ErrorAction Stop
    } else {
        $manifestUrl = "https://github.com/$ReleaseRepo/releases/download/$tag/release.manifest.json"
        $sigUrl = "https://github.com/$ReleaseRepo/releases/download/$tag/release.manifest.json.sig"
        Invoke-WebRequest -Uri $manifestUrl -OutFile $manifestPath -ErrorAction Stop
        Invoke-WebRequest -Uri $sigUrl -OutFile $sigPath -ErrorAction Stop
    }
    Verify-ManifestSignature -ManifestPath $manifestPath -SignaturePath $sigPath

    $manifestJson = Get-Content $manifestPath -Raw | ConvertFrom-Json
    $artifactKey = "win32-x64"
    $entry = $manifestJson.artifacts.$artifactKey
    if (-not $entry) { throw "Manifest missing entry for $artifactKey." }
    if (-not $entry.sha256) { throw "Manifest missing sha256 for $artifactKey." }

    $actualSha = Get-FileSha256 -Path $BinaryPath
    if ($actualSha -ne $entry.sha256.ToLowerInvariant()) {
        throw "SHA-256 mismatch for downloaded binary."
    }

    Copy-Item $manifestPath (Join-Path $targetDir "release.manifest.json") -Force
    Copy-Item $sigPath (Join-Path $targetDir "release.manifest.json.sig") -Force
} catch {
    Write-Error "Failed to download or verify release manifest: $_"
    exit 1
}

# Ensure cp_commands_only.ps1 copies the binary we just downloaded.
$env:BBX_BINARY_SOURCE_PATH = $BinaryPath

$depsScript = Join-Path $PSScriptRoot "install_deps.ps1"
if (Test-Path $depsScript) {
    & $depsScript
    exit $LASTEXITCODE
}

Write-Warning "install_deps.ps1 not found; BrowserBox binary downloaded to $BinaryPath."
exit 0
