﻿[CmdletBinding(SupportsShouldProcess=$true)]
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
}

Write-Verbose "Script dir: $scriptDir"
Write-Verbose "Install dir: $installDir"
Write-Verbose "Command: $Command"
Write-Verbose "Args: $($Args -join ', ')"

function Show-Help {
    Write-Host "bbx CLI (Windows)" -ForegroundColor Green
    Write-Host "Usage: bbx <command> [options]" -ForegroundColor Yellow
    Write-Host "Commands:" -ForegroundColor Cyan
    $commandDescriptions = @{
        "install"   = "Install BrowserBox and bbx CLI`n    bbx install"
        "uninstall" = "Remove BrowserBox and related files`n    bbx uninstall [-Force]"
        "setup"     = "Set up BrowserBox`n    bbx setup [-Hostname <hostname>] [-Email <email>] [-Port <port>] [-Token <token>] [-Force]"
        "run"       = "Run BrowserBox`n    bbx run [-Hostname <hostname>] [-Port <port>] [-Token <token>] [-Email <email>]"
        "certify"   = "Certify your license`n    bbx certify [-ForceLicense] [-LicenseKey <key>]"
        "stop"      = "Stop BrowserBox`n    bbx stop [-GraceSeconds <seconds>]"
        "revalidate" = "Clears ticket and revalidates`n    bbx revalidate"
    }
    $commands.Keys + "revalidate" | Sort-Object | ForEach-Object {
        Write-Host "  $_" -ForegroundColor White
        Write-Host "    $($commandDescriptions[$_])" -ForegroundColor Gray
    }
    Write-Host "Run 'bbx <command> -help' for command-specific options." -ForegroundColor Gray
}

if (-not $Command -or $Command -eq "-help") {
    Write-Verbose "No command or -help specified—showing help"
    Show-Help
    return
}

if ($commands.ContainsKey($Command)) {
    $scriptPath = Join-Path $scriptDir $commands[$Command]
    Write-Verbose "Script path: $scriptPath"
    if ((Test-Path "$scriptPath") -or ($Command -eq "revalidate")) {
        Write-Host "Running bbx $Command..." -ForegroundColor Cyan
        if ($Command -eq "revalidate") {
            $ticketPath = Join-Path $env:USERPROFILE ".config\dosyago\bbpro\tickets\ticket.json"
            Write-Verbose "Ticket path: $ticketPath"
            if ($Args -contains "-help") {
                Write-Host "bbx revalidate" -ForegroundColor Green
                Write-Host "Clears ticket and revalidates license" -ForegroundColor Yellow
                Write-Host "Usage: bbx revalidate" -ForegroundColor Cyan
                Write-Host "Options: None" -ForegroundColor Cyan
                return
            }
            if (-not (Test-Path (Split-Path $ticketPath))) {
                Write-Warning "Ticket directory does not exist at $(Split-Path $ticketPath)"
                return
            }
            if (Test-Path $ticketPath) {
                Write-Host "Removing ticket.json..." -ForegroundColor Cyan
                if ($PSCmdlet.ShouldProcess($ticketPath, "Remove file")) {
                    Remove-Item $ticketPath -Force
                    Write-Host "ticket.json removed." -ForegroundColor Green
                }
            } else {
                Write-Verbose "ticket.json does not exist at $ticketPath"
            }
            return
        }
        if ($Args -and $Args.Count -gt 0) {
            Write-Verbose "Parsing args: $($Args -join ', ')"
            if ($Args -contains "-help") {
                Write-Verbose "Passing -help to $scriptPath"
                & $scriptPath -help
                return
            }
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
        throw "bbx: $Command failed"
    }
} else {
    Write-Error "Unknown command: $Command"
    Show-Help
    throw "bbx: $Command failed"
}
