[CmdletBinding(SupportsShouldProcess=$true)]
param (
    [Parameter(Position=0)]
    [string]$Command,
    [Parameter(ValueFromRemainingArguments)]
    [string[]]$Args
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$installDir = "C:\Program Files\browserbox"
$commands = @{
    "install"   = "install.ps1"
    "uninstall" = "uninstall.ps1"
    "setup"     = "setup.ps1"
    "run"       = "start.ps1"
    "certify"   = "certify.ps1"
    "stop"      = "stop.ps1"
    "revalidate" = "certify.ps1"
}

Write-Verbose "Script dir: $scriptDir"
Write-Verbose "Install dir: $installDir"
Write-Verbose "Command: $Command"
Write-Verbose "Args: $($Args -join ', ')"

function Show-Help {
    Write-Host "bbx CLI (Windows)" -ForegroundColor Green
    Write-Host "Usage: bbx <command> [args]" -ForegroundColor Yellow
    Write-Host "Commands:" -ForegroundColor Cyan
    $commands.Keys | Sort-Object | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
    Write-Host "Run 'bbx <command> --help' for command-specific options." -ForegroundColor Gray
}

if (-not $Command -or $Command -eq "--help") {
    Write-Verbose "No command or --help specified—showing help"
    Show-Help
    return
}

if ($commands.ContainsKey($Command)) {
    $scriptPath = Join-Path $scriptDir $commands[$Command]
    Write-Verbose "Script path: $scriptPath"
    if ($Command -eq "revalidate" -or (Test-Path $scriptPath)) {
        Write-Host "Running bbx $Command..." -ForegroundColor Cyan
        if ($Command -eq "revalidate") {
            $ticketPath = Join-Path $env:USERPROFILE ".config\dosyago\bbpro\tickets\ticket.json"
            Write-Verbose "Ticket path: $ticketPath"
            if (Test-Path $ticketPath) {
                Write-Host "Removing ticket.json..." -ForegroundColor Cyan
                if ($PSCmdlet.ShouldProcess($ticketPath, "Remove file")) {
                    Remove-Item $ticketPath -Force
                    Write-Host "ticket.json removed." -ForegroundColor Green
                }
            } else {
                Write-Verbose "ticket.json does not exist at $ticketPath"
            }
        }
        if ($Args -and $Args.Count -gt 0) {
            Write-Verbose "Parsing args: $($Args -join ', ')"
            $params = @{}
            for ($i = 0; $i -lt $Args.Length; $i++) {
                Write-Verbose "Processing arg ${i}: $($Args[$i])"
                if ($Args[$i] -match '^-(.+)$') {
                    $paramName = $matches[1]
                    Write-Verbose "Found param: $paramName"
                    if ($i + 1 -lt $Args.Length -and $Args[$i + 1] -notmatch '^-.+') {
                        $params[$paramName] = $Args[$i + 1]
                        Write-Verbose "Assigned $paramName = $($Args[$i + 1])"
                        $i++
                    } else {
                        $params[$paramName] = $true
                        Write-Verbose "Assigned $paramName = $true (flag)"
                    }
                }
            }
            Write-Verbose "Params hashtable: $($params | Out-String)"
            Write-Verbose "Invoking with params: & $scriptPath @params"
            & $scriptPath @params
        } else {
            Write-Verbose "No args provided—invoking bare: & $scriptPath"
            & $scriptPath
        }
    } else {
        Write-Error "Script for '$Command' not found at $scriptPath"
        if ($Command -eq "install") { 
            Write-Host "Try running 'irm bbx.dosaygo.com | iex' first." -ForegroundColor Yellow 
        }
        Show-Help
        throw "BBX Error"
    }
} else {
    Write-Error "Unknown command: $Command"
    Show-Help
    throw "COMMAND Error"
}
