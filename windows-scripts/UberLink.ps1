# Script to automate RDP and VNC session management with state tracking

# Define the path for the state file
$stateFilePath = Join-Path $env:USERPROFILE 'Desktop\session_state.txt'

# Function to get the current state
function Get-State {
  if (Test-Path $stateFilePath) {
    return Get-Content $stateFilePath
  } else {
    return 'initial'
  }
}

# Function to set the next state
function Set-State($state) {
  $state | Out-File $stateFilePath
}

# Function to execute the nested RDP connection
function Start-NestedRDP {
  # Start a nested RDP session to localhost
  Start-Process 'mstsc' -ArgumentList '/v:localhost'
}

# Function to start BrowserBox
function Start-BrowserBox {
  # Change to the BrowserBox directory and run it
  Set-Location "$env:USERPROFILE\BrowserBox"
  Start-Process 'powershell' -ArgumentList 'npm test'
}

# Function to start VNC Server
function Start-VncServer {
  # Start the VNC server (adjust command based on your VNC software)
  # Example: Start-Process 'path\to\vncserver.exe'
}

# Main script logic
switch (Get-State) {
  'initial' {
    # First login - initiate nested RDP connection
    Start-NestedRDP
    Set-State 'nested_rdp_started'
  }
  'nested_rdp_started' {
    # Second login - start BrowserBox
    Start-BrowserBox
    Set-State 'browserbox_started'
  }
  'browserbox_started' {
    # Third login - start VNC server
    Start-VncServer
    Set-State 'vnc_started'
  }
  'vnc_started' {
    # Future logins - nothing to do, or add more logic if needed
  }
}

