# Get the current script path
$scriptPath = $MyInvocation.ScriptName

# Function to check if running as administrator
function Is-Admin {
    $currentUser = New-Object Security.Principal.WindowsPrincipal $([Security.Principal.WindowsIdentity]::GetCurrent())
    $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Determine the PowerShell executable to use
$psExecutable = if ($PSVersionTable.PSVersion.Major -ge 6) { "pwsh" } else { "powershell" }

# Restart the script as administrator if not already
if (-not (Is-Admin)) {
    try {
        $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" $args"
        Start-Process $psExecutable -Verb RunAs -ArgumentList $arguments
        exit
    }
    catch {
        Write-Error "Failed to start as Administrator: $_"
        exit
    }
}

# If running as administrator, execute the bash script with the script's arguments
$bashScript = "./deploy-scripts/_setup_bbpro.sh"
$arguments = $args -join ' '
$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = "bash"
$processInfo.RedirectStandardOutput = $true
$processInfo.UseShellExecute = $false
$processInfo.Arguments = "$bashScript $arguments"
$process = New-Object System.Diagnostics.Process
$process.StartInfo = $processInfo
$process.Start() | Out-Null
$output = $process.StandardOutput.ReadToEnd()
$process.WaitForExit()

# Print the output
Write-Host $output

