#!/bin/bash

# tor_status.sh: Restart Tor and show a progress bar for connection status
# Assumes Tor uses cookie authentication with a readable cookie file

# Exit on errors, undefined variables, and pipe failures
set -euo pipefail

# ANSI color codes
LIME_GREEN='\033[92m'
NC='\033[0m'  # No color

# Global variables
TOR_CONTROL_PORT=9051
COOKIE_AUTH_FILE=""
SUDO=$(command -v sudo >/dev/null && echo "sudo -n" || echo "")
MAX_ATTEMPTS=240  # 120 seconds total with 0.5s sleep
POLL_INTERVAL=1  # Check every 5 seconds (10 * 0.5s)
SPINNER_CHARS="|/-\|"

# Detect OS and set Tor paths/service commands
detect_os() {
    case "$(uname -s)" in
        Linux)
            OS_TYPE="linux"
            COOKIE_AUTH_FILE="/var/lib/tor/control_auth_cookie"
            STOP_CMD="$SUDO systemctl stop tor"
            START_CMD="$SUDO systemctl start tor"
            ;;
        Darwin)
            OS_TYPE="macos"
            if ! command -v node >/dev/null 2>&1; then
                echo "Node.js required for path resolution on macOS" >&2
                exit 1
            fi
            prefix=$(brew --prefix tor 2>/dev/null || echo "/usr/local")
            COOKIE_AUTH_FILE=$(node -p "require('path').resolve('${prefix}/../../var/lib/tor/control_auth_cookie')")
            STOP_CMD="brew services stop tor"
            START_CMD="brew services start tor"
            ;;
        *)
            echo "Unsupported OS" >&2
            exit 1
            ;;
    esac
}

# Stop and start Tor service, wait for cookie
restart_tor() {
    echo "Stopping Tor..." >&2
    $STOP_CMD >/dev/null 2>&1 || echo "Tor was not running or failed to stop" >&2
    sleep 1  # Brief pause to ensure stop completes

    echo "Starting Tor..." >&2
    $START_CMD >/dev/null 2>&1 || {
        echo "Failed to start Tor" >&2
        exit 1
    }

    # Wait for cookie file to appear (up to 10 seconds)
    local wait_time=0
    while ! [ -r "$COOKIE_AUTH_FILE" ] && ! $SUDO test -r "$COOKIE_AUTH_FILE"; do
        if [ "$wait_time" -ge 20 ]; then  # 20 * 0.5s = 10s
            echo "Tor cookie file not found at $COOKIE_AUTH_FILE after 10 seconds" >&2
            exit 1
        fi
        sleep 0.5
        wait_time=$((wait_time + 1))
    done
    echo "Tor started, cookie file detected." >&2
}

# Get Tor bootstrap status via control port
get_tor_status() {
    local cookie_hex=$($SUDO xxd -u -p -c32 "$COOKIE_AUTH_FILE" | tr -d '\n')
    if [ -z "$cookie_hex" ]; then
        echo "Failed to read Tor cookie" >&2
        return 1
    fi

    local cmd=$(printf 'AUTHENTICATE %s\r\nGETINFO status/bootstrap-phase\r\nQUIT\r\n' "$cookie_hex")
    local response=$(echo -e "$cmd" | nc -w 5 127.0.0.1 "$TOR_CONTROL_PORT" 2>/dev/null)

    if [ -z "$response" ]; then
        echo "Control port not responding" >&2
        return 1
    fi

    # Parse bootstrap percentage or "Done" status
    local status_line=$(echo "$response" | grep "250-status/bootstrap-phase=")
    if [ -z "$status_line" ]; then
        echo "Invalid response from Tor control port" >&2
        return 1
    fi

    if echo "$status_line" | grep -q "SUMMARY=\"Done\""; then
        echo "100"
    else
        local progress=$(echo "$status_line" | grep -o "PROGRESS=[0-9]*" | cut -d'=' -f2)
        [ -n "$progress" ] && echo "$progress" || echo "0"
    fi
}

# Draw a 30-character progress bar
draw_progress_bar() {
    local percent=$1
    local bar_width=30
    local filled=$((percent * bar_width / 100))
    local empty=$((bar_width - filled))

    # Build the bar directly in printf to ensure ANSI codes are interpreted
    printf "\rTor Progress: [${LIME_GREEN}"
    for ((i = 0; i < filled; i++)); do printf "█"; done
    printf "${NC}"
    for ((i = 0; i < empty; i++)); do printf " "; done
    printf "] %3d%%" "$percent"
}

# Main function to monitor Tor status with progress bar
monitor_tor_status() {
    local attempts=0
    local counter=0
    local spinner_idx=0
    local percent=0

    echo "Waiting for Tor to connect..." >&2
    while [ $attempts -lt "$MAX_ATTEMPTS" ]; do
        # Update spinner every second
        if [ $((counter % 2)) -eq 0 ]; then
            spinner_idx=$(( (spinner_idx + 1) % 4 ))
            local spinner="${SPINNER_CHARS:$spinner_idx:1}"
        fi

        # Check status every 5 seconds
        if [ $((counter % POLL_INTERVAL)) -eq 0 ]; then
            percent=$(get_tor_status) || percent=0
            attempts=$((attempts + 1))
            if [ "$percent" -eq 100 ]; then
                draw_progress_bar 100
                echo -e "\n${LIME_GREEN}Tor is connected.${NC}" >&2
                return 0
            fi
        fi

        draw_progress_bar "$percent"
        sleep 0.5
        counter=$((counter + 1))
    done

    draw_progress_bar "$percent"
    echo -e "\n${LIME_GREEN}Timeout: Tor failed to connect within 120 seconds.${NC}" >&2
    exit 1
}

# Main execution
main() {
    detect_os
    restart_tor
    monitor_tor_status
}

main
