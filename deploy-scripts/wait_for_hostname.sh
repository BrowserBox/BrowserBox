#!/usr/bin/env bash

hostname=$1
timeout=3600 # Timeout in seconds (e.g., 3600 seconds = 1 hour to set up your DNS)
interval=10 # Interval in seconds to check the hostname

# Function to check if a command exists
command_exists() {
  command -v "$@" > /dev/null 2>&1
}

flush_dns() {
  case "$(uname -s)" in
    Linux*)
      # For Linux systems
      if command -v systemd-resolve &>/dev/null; then
        sudo systemd-resolve --flush-caches
      elif command -v service &>/dev/null && service nscd status; then
        sudo service nscd restart
      elif command -v systemctl &>/dev/null && systemctl is-active --quiet dnsmasq; then
        sudo systemctl restart dnsmasq
      elif [[ -f /etc/init.d/networking ]]; then
        sudo /etc/init.d/networking restart
      else
        echo "DNS flushing method not found for this Linux distribution"
      fi
      ;;
    Darwin*)
      # For macOS
      sudo killall -HUP mDNSResponder
      ;;
    CYGWIN*|MINGW32*|MSYS*|MINGW*)
      # For Windows using Git Bash or similar
      ipconfig /flushdns
      ;;
    *)
      echo "Operating system not supported"
      ;;
  esac
}

install_host_command() {
  if ! command_exists host; then
    echo "The 'host' command is not available. Installing necessary package..."

    # Enhanced distribution detection with lowercase conversion
    if command_exists lsb_release; then
      distro=$(lsb_release -is | tr '[:upper:]' '[:lower:]')
    elif [[ -f /etc/os-release ]]; then
      . /etc/os-release
      distro=$(echo "$ID")
    else
      echo "Cannot determine the distribution. Please install 'host' command manually."
      exit 1
    fi

    case "$distro" in
      centos|fedora|rhel|redhatenterpriseserver|almalinux|rocky|ol|oraclelinux|scientific|amzn)
        echo "Detected Red Hat-based distribution."
        if command_exists dnf; then
          sudo dnf install -y bind-utils
        elif command_exists yum; then
          sudo yum install -y bind-utils
        else
          echo "Package manager (dnf or yum) not found. Cannot install bind-utils."
          exit 1
        fi
      ;;
      debian|ubuntu|linuxmint|pop|elementary|kali|mx|mxlinux|zorinos)
        echo "Detected Debian/Ubuntu-based distribution."
        if command_exists apt; then
          sudo apt-get update
          sudo apt-get install -y dnsutils
        else
          echo "Package manager (apt) not found. Cannot install dnsutils."
          exit 1
        fi
      ;;
      *)
        echo "Unsupported distribution: $distro. Please install 'host' command manually."
        exit 1
        ;;
    esac
  fi
}

# Function to get the current external IPv4 address
get_external_ip() {
  local ip

  # List of services to try
  local services=(
    "https://icanhazip.com"
    "https://ifconfig.me"
    "https://api.ipify.org"
  )

  # Try each service in turn
  for service in "${services[@]}"; do
    ip=$(curl -4s --connect-timeout 5 "$service")
    if [[ -n "$ip" ]]; then
      echo "$ip"
      return
    fi
  done

  echo "Failed to obtain external IP address" >&2
  return 1
}

# Check if hostname is provided
if [[ -z "$hostname" ]]; then
  echo "Requires hostname as first argument" >&2
  exit 1
fi

external_ip=$(get_external_ip)
if [[ -z "$external_ip" ]]; then
  echo "Failed to obtain external IP address" >&2
  exit 1
fi

install_host_command

elapsed=0
while true; do
  resolved_ip=$(host "$hostname" 8.8.8.8 | awk '/has address/ { print $4 }')
  if [[ "$resolved_ip" == "$external_ip" ]]; then
    echo "Hostname resolved to current IP: $hostname -> $resolved_ip" >&2
    exit 0
  else
    echo "Waiting for hostname to resolve to current IP ($external_ip)..." >&2
    flush_dns
    sleep "$interval"
    elapsed=$((elapsed + interval))
    if [ "$elapsed" -ge "$timeout" ]; then
      echo "Timeout reached. Hostname not resolved or not matching current IP: $hostname" >&2
      exit 1
    fi
  fi
done

