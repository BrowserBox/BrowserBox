param (
    [Parameter(Mandatory=$true)]
    [int]$ProcessId
)

function Set-ProcessPriorityHigh {
    param (
        [int]$ProcessId
    )

    try {
        $process = Get-Process -Id $ProcessId -ErrorAction Stop
        $process.PriorityClass = [System.Diagnostics.ProcessPriorityClass]::High
        Write-Host "The priority of process ID $ProcessId has been set to High."
    } catch {
        Write-Error "Error: Could not find or set the priority of the process with ID $ProcessId."
    }
}

# Call the function with the passed process ID
Set-ProcessPriorityHigh -ProcessId $ProcessId

