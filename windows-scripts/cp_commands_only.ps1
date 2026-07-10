#
# cp_commands_only.ps1
#
# Copies the BrowserBox command wrappers ('bbx.ps1', 'stop_bbpro.ps1') to a directory in the user's PATH.
# It prioritizes user-specific, non-system locations to avoid requiring administrator privileges.
# The script outputs the chosen directory path to stdout so the main binary can be copied there.
#

# --- Functions ---

# Function to find a writable, non-system directory in the PATH.
function Get-UserPathTargetDirectory {
    $path_dirs = ($env:Path -split [System.IO.Path]::PathSeparator) | Where-Object { $_ -ne "" } | Select-Object -Unique

    # Priority order for target directories
    $preferred_dirs = @(
        [System.IO.Path]::Combine($env:USERPROFILE, "bin"),
        [System.IO.Path]::Combine($env:USERPROFILE, "Scripts"),
        [System.IO.Path]::Combine($env:LOCALAPPDATA, "Microsoft\WindowsApps") # Often writable
    )

    # Check preferred directories first if they are in PATH
    foreach ($dir in $preferred_dirs) {
        if ($path_dirs -contains $dir) {
            if (Test-Path -Path $dir -PathType Container) {
                try {
                    $testFile = [System.IO.Path]::Combine($dir, "tmp_write_test.tmp")
                    [System.IO.File]::WriteAllText($testFile, "test")
                    [System.IO.File]::Delete($testFile)
                    # If we got here, it's writable
                    return $dir
                } catch {
                    # Not writable, continue
                }
            }
        }
    }

    # Fallback to the first writable user-level directory in PATH
    foreach ($dir in $path_dirs) {
        if ($dir.StartsWith($env:USERPROFILE) -or $dir.StartsWith($env:LOCALAPPDATA)) {
            if (Test-Path -Path $dir -PathType Container) {
                try {
                    $testFile = [System.IO.Path]::Combine($dir, "tmp_write_test.tmp")
                    [System.IO.File]::WriteAllText($testFile, "test")
                    [System.IO.File]::Delete($testFile)
                    return $dir
                } catch {
                    # Not writable, continue
                }
            }
        }
    }

    return $null
}

# --- Main Script ---

# Determine the target directory for commands
$dest_dir = Get-UserPathTargetDirectory
if (-not $dest_dir) {
    Write-Error "Could not find a suitable writable directory in your PATH. Please add one (e.g., '$env:USERPROFILE\bin') and try again."
    exit 1
}

# The script's own directory, to find other scripts to copy. Assumes it's run from the extracted temp dir.
$script_dir = Split-Path -Parent $MyInvocation.MyCommand.Path

# List of command files to copy from the same directory
$command_files = @(
    "bbx.ps1",
    "stop.ps1",
    "start.ps1",
    "setup.ps1",
    "certify.ps1",
    "uninstall.ps1"
)

# Copy the files
foreach ($file in $command_files) {
    $source_path = Join-Path -Path $script_dir -ChildPath $file
    if (Test-Path $source_path) {
        $dest_path = Join-Path -Path $dest_dir -ChildPath $file
        Copy-Item -Path $source_path -Destination $dest_path -Force
        Write-Host "Copied $file to $dest_dir"
    } else {
        # This script will be in the 'deploy-scripts' temp folder, but the ps1 wrappers are in 'windows-scripts'.
        # Let's check there too.
        $fallback_source_path = Join-Path -Path (Join-Path -Path $script_dir -ChildPath "../windows-scripts") -ChildPath $file
        if (Test-Path $fallback_source_path) {
             $dest_path = Join-Path -Path $dest_dir -ChildPath $file
             Copy-Item -Path $fallback_source_path -Destination $dest_path -Force
             Write-Host "Copied $file to $dest_dir from fallback path."
        } else {
            Write-Warning "Command script '$file' not found in '$script_dir' or fallback path. Skipping."
        }
    }
}

# Legacy note: Chai assets were previously synced here from the source tree to
# support source-based installs. During the binary distribution migration the
# browserbox installer seeds %USERPROFILE%\.config\dosaygo\bbpro\chai, so these
# copy-only scripts intentionally skip that work now.

# Copy the binary executable to the destination directory
$binary_source_path = $env:BBX_BINARY_SOURCE_PATH
if (-not $binary_source_path) {
    # Fallback: assume binary is in the same directory as this script (when extracted from SEA)
    $binary_source_path = Join-Path -Path $script_dir -ChildPath "..\browserbox.exe"
}

if (Test-Path $binary_source_path) {
    Write-Host "Copying browserbox binary from $binary_source_path..."
    $binary_dest_path = Join-Path -Path $dest_dir -ChildPath "browserbox.exe"
    # Remove existing binary first to avoid corruption
    if (Test-Path $binary_dest_path) {
        Write-Host "Removing existing browserbox binary..."
        Remove-Item -Path $binary_dest_path -Force
    }
    Copy-Item -Path $binary_source_path -Destination $binary_dest_path -Force
    Write-Host "Binary copied to $binary_dest_path"
} else {
    Write-Warning "Binary not found at '$binary_source_path'. Skipping binary copy."
}

# IMPORTANT: Output the destination directory to stdout for the calling process
Write-Output $dest_dir
