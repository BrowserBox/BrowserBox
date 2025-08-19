#!/usr/bin/env bash
set -e  # Exit on error
trap 'echo "Error: Bailed! Check output..." >&2' ERR
trap 'echo "Done!" >&2' EXIT

if [[ -n "$BBX_DEBUG" ]]; then
  set -x
fi

# Vars & Defaults
PORT="${1:-}"  # Main port (e.g., 8080)
HOSTNAME="${2:-}"  # DNS hostname
EMAIL="${3:-}"  # User email
DOCKER_IMAGE_DOSAYGO="dosaygo/browserbox:latest"
DOCKER_IMAGE_GHCR="ghcr.io/browserbox/browserbox:latest"
CERT_DIR="$HOME/sslcerts"
SUDO=$(command -v sudo >/dev/null && echo "sudo -n" || echo "")
OS=$(uname)
branch="${BBX_BRANCH:-main}"

# Root/Sudo Check (Cross-Platform)
if [ "$EUID" -ne 0 ] && ! $SUDO true 2>/dev/null; then
  echo "ERROR: Needs root or passwordless sudo (edit /etc/sudoers with visudo)." >&2
  exit 1
fi

# License Agreement & Key
echo "BrowserBox v11 Terms: https://dosaygo.com/terms.txt | License: https://github.com/BrowserBox/BrowserBox/blob/main/LICENSE.md | Privacy: https://dosaygo.com/privacy.txt"
[ "${AGREE:-no}" = "yes" ] || read -p " Agree? (yes/no): " AGREE
[ "$AGREE" = "yes" ] || { echo "ERROR: Must agree to terms!" >&2; exit 1; }

# Source the config file if it exists
CONFIG_DIR="$HOME/.config/dosyago/bbpro"
CONFIG_FILE="$CONFIG_DIR/config"
if [[ -f "$CONFIG_FILE" ]]; then
  echo "Sourcing $CONFIG_FILE..." >&2
  source "$CONFIG_FILE"
else
  echo "No config file found at $CONFIG_FILE. Proceeding without it." >&2
fi

# Check for LICENSE_KEY and prompt if not set
if [[ -z "$LICENSE_KEY" ]]; then
  echo "LICENSE_KEY is required to proceed." >&2
  while [[ -z "$LICENSE_KEY" ]]; do
    read -p "Please enter your LICENSE_KEY (contact sales@dosaygo.com): " LICENSE_KEY
    if [[ -z "$LICENSE_KEY" ]]; then
      echo "ERROR: LICENSE_KEY cannot be empty. Please try again." >&2
    fi
  done
  echo "LICENSE_KEY set to $LICENSE_KEY." >&2
else
  echo "LICENSE_KEY is already set." >&2
fi

# Args Check
[ -z "$PORT" ] || [ -z "$HOSTNAME" ] || [ -z "$EMAIL" ] && {
  echo "ERROR: Usage: $0 <PORT> <HOSTNAME> <EMAIL>" >&2
  exit 1
}
[[ "$PORT" =~ ^[0-9]+$ ]] && [ "$PORT" -ge 4024 ] && [ "$PORT" -le 65533 ] || {
  echo "ERROR: PORT must be 4024-65533 (5-port range needed)!" >&2
  exit 1
}

detect_platform() {
    local os arch
    os=$(uname -s | tr '[:upper:]' '[:lower:]')
    arch=$(uname -m)

    case "$arch" in
        x86_64) arch="amd64" ;;
        aarch64|arm64) arch="arm64" ;;
        armv7l) arch="arm/v7" ;;
        armv6l) arch="arm/v6" ;;
        *) echo "WARNING: Unknown arch $arch, defaulting to amd64" >&2; arch="amd64" ;;
    esac

    # macOS always uses Linux images via Docker Desktop
    if [[ "$os" = "darwin" ]]; then
        os="linux"
    fi

    echo "$os/$arch"
}

PLATFORM=$(detect_platform)


# Check if hostname is local
is_local_hostname() {
  local hostname="$1"
  local resolved_ips ip
  local public_dns_servers=("8.8.8.8" "1.1.1.1" "208.67.222.222")
  local has_valid_result=0
  local all_private=1

  for dns in "${public_dns_servers[@]}"; do
    resolved_ips=$(dig +short "$hostname" A @"$dns")
    if [[ -n "$resolved_ips" ]]; then
      has_valid_result=1
      while IFS= read -r ip; do
        ip="${ip%.}"
        # Public if NOT in known private ranges
        if [[ ! "$ip" =~ ^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1$|fe80:) ]]; then
          return 1  # Public
        fi
      done <<< "$resolved_ips"
    fi
  done

  # If all results were private or none resolved, treat as local
  if [[ "$has_valid_result" -eq 1 ]]; then
    return 0  # All IPs private => local
  fi

  # Fallback: check /etc/hosts (or similar)
  if command -v getent &>/dev/null; then
    ip=$(getent hosts "$hostname" | awk '{print $1}' | head -n1)
    if [[ "$ip" =~ ^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1$|fe80:) ]]; then
      return 0  # Local
    fi
  fi

  return 0  # Unresolvable or garbage → treat as local
}

# Port Availability (Cross-Platform)
check_port() {
    local p=$1
    if [[ "$OS" = "Darwin" ]]; then
        lsof -iTCP -P -n | grep -q "LISTEN.*:$p" && { echo "ERROR: Port $p in use!" >&2; return 1; } || return 0
    else
        $SUDO bash -c "exec 6<>/dev/tcp/127.0.0.1/$p" 2>/dev/null && { echo "ERROR: Port $p in use!" >&2; return 1; } || return 0
    fi
}
for p in $(seq $((PORT-2)) $((PORT+2))); do
    check_port "$p" || exit 1
done

# Firewall Open (Cross-Platform)
open_ports() {
    local start=$1 end=$2
    if [[ "$OS" = "Darwin" ]]; then
        echo "pass in proto tcp from any to any port $start:$end" | $SUDO pfctl -ef - 2>/dev/null || echo "WARNING: Firewall tweak failed—open $start-$end/tcp manually!" >&2
    elif command -v firewall-cmd >/dev/null; then
        $SUDO firewall-cmd --permanent --add-port="$start-$end/tcp" && $SUDO firewall-cmd --reload || echo "WARNING: firewalld failed—open $start-$end/tcp manually!" >&2
    elif command -v ufw >/dev/null; then
        $SUDO ufw allow "$start:$end/tcp" || echo "WARNING: ufw failed—open $start-$end/tcp manually!" >&2
    else
        echo "WARNING: No firewall tool found—open $start-$end/tcp manually!" >&2
    fi
}
! is_local_hostname "$HOSTNAME" && open_ports 80 80
open_ports $((PORT-2)) $((PORT+2))

# External IP (Cross-Platform)
get_ip() {
    curl -4s --connect-timeout 5 "https://icanhazip.com" || curl -4s --connect-timeout 5 "https://ifconfig.me" || {
        echo "ERROR: Can’t fetch IP—check network!" >&2
        exit 1
    }
}

# Certs Fetch (Cross-Platform)
fetch_certs() {
    mkdir -p "$CERT_DIR" || $SUDO mkdir -p "$CERT_DIR"
    if ! $SUDO test -f "$CERT_DIR/fullchain.pem" || ! $SUDO test -f "$CERT_DIR/privkey.pem" || [ "$($SUDO openssl x509 -in "$CERT_DIR/fullchain.pem" -noout -subject | grep -o "$HOSTNAME")" != "$HOSTNAME" ]; then
        if ! is_local_hostname "$HOSTNAME"; then
          echo "Fetching certs for $HOSTNAME (DNS A record to $(get_ip) required)..." >&2
          bash <(curl -s "https://raw.githubusercontent.com/BrowserBox/BrowserBox/${branch}/deploy-scripts/wait_for_hostname.sh") "$HOSTNAME" || {
              echo "ERROR: Hostname $HOSTNAME not resolving!" >&2
              exit 1
          }
        fi
        BB_USER_EMAIL="$EMAIL" bash <(curl -s "https://raw.githubusercontent.com/BrowserBox/BrowserBox/${branch}/deploy-scripts/tls") "$HOSTNAME" || {
            echo "ERROR: Cert fetch failed!" >&2
            exit 1
        }
    fi
    $SUDO chmod 600 "$CERT_DIR"/*.pem
    GUSER="$(id -g)"
    $SUDO chown "${SUDO_USER:-$USER}:${SUDO_USER:-$GUSER}" "$CERT_DIR"/*.pem
}

fetch_certs

# Docker Image Pull (Check Both Repos)
DOCKER_IMAGE=""
if $SUDO docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^$DOCKER_IMAGE_DOSAYGO$"; then
    DOCKER_IMAGE="$DOCKER_IMAGE_DOSAYGO"
    echo "Found $DOCKER_IMAGE locally—using it!" >&2
elif $SUDO docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^$DOCKER_IMAGE_GHCR$"; then
    DOCKER_IMAGE="$DOCKER_IMAGE_GHCR"
    echo "Found $DOCKER_IMAGE locally—using it!" >&2
else
    echo "Pulling latest $DOCKER_IMAGE_DOSAYGO..." >&2
    $SUDO docker pull --platform "$PLATFORM" "$DOCKER_IMAGE_DOSAYGO" \
      && DOCKER_IMAGE="$DOCKER_IMAGE_DOSAYGO" || {
        echo "Falling back to $DOCKER_IMAGE_GHCR..." >&2
        $SUDO docker pull --platform "$PLATFORM" "$DOCKER_IMAGE_GHCR" || {
          echo "ERROR: Failed to pull image!" >&2; exit 1; }
        DOCKER_IMAGE="$DOCKER_IMAGE_GHCR"
    }
fi

# Docker Run (Capture setup_bbpro Output)
echo "Starting BrowserBox on $HOSTNAME:$PORT..." >&2
CONTAINER_ID=$($SUDO docker run --cap-add=SYS_NICE -d \
    -p "$PORT:$PORT" -p "$((PORT-2)):$((PORT-2))" -p "$((PORT-1)):$((PORT-1))" \
    -p "$((PORT+1)):$((PORT+1))" -p "$((PORT+2)):$((PORT+2))" \
    -v "$CERT_DIR:/home/bbpro/sslcerts" -e "LICENSE_KEY=$LICENSE_KEY" \
    "$DOCKER_IMAGE" bash -c "cd; cd sslcerts; sudo chown bbpro:bbpro *.pem; cd; cd bbpro; setup_bbpro --port $PORT > login_link.txt && bbcertify && bbpro && ./deploy-scripts/drun.sh") || {
    echo "ERROR: Docker run failed!" >&2
    exit 1
}

# Login Link
sleep 5
$SUDO docker cp "$CONTAINER_ID:/home/bbpro/bbpro/login_link.txt" ./login_link.txt 2>/dev/null || {
    echo "WARNING: Login link not ready—check logs with: docker logs $CONTAINER_ID" >&2
    LOGIN_LINK="https://$HOSTNAME:$PORT/login?token=<check_logs>"
}
[ -f "login_link.txt" ] && LOGIN_LINK=$(cat login_link.txt | sed "s/localhost/$HOSTNAME/") || LOGIN_LINK="https://$HOSTNAME:$PORT/login?token=<check_logs>"

# Output
echo "===========================================" >&2
echo "Login Link: $LOGIN_LINK" >&2
echo "Container ID: $CONTAINER_ID" >&2
echo "Stop: docker stop $CONTAINER_ID" >&2
echo "Shell: docker exec -it $CONTAINER_ID bash" >&2
echo "===========================================" >&2

# Cleanup Choice
read -p "Keep running? (n/no to stop, else continues): " KEEP
[[ "$KEEP" = "n" || "$KEEP" = "no" ]] && $SUDO docker stop --time 3 "$CONTAINER_ID" && echo "Stopped!" >&2
exit 0
