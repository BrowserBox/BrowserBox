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
echo "BrowserBox v10 Terms: https://dosaygo.com/terms.txt | License: https://github.com/BrowserBox/BrowserBox/blob/main/LICENSE.md | Privacy: https://dosaygo.com/privacy.txt"
[ "${AGREE:-no}" = "yes" ] || read -p " Agree? (yes/no): " AGREE
[ "$AGREE" = "yes" ] || { echo "ERROR: Must agree to terms!" >&2; exit 1; }
[ -n "$LICENSE_KEY" ] || read -p "Enter License Key (sales@dosaygo.com): " LICENSE_KEY
[ -n "$LICENSE_KEY" ] || { echo "ERROR: License key required!" >&2; exit 1; }

# Args Check
[ -z "$PORT" ] || [ -z "$HOSTNAME" ] || [ -z "$EMAIL" ] && {
  echo "ERROR: Usage: $0 <PORT> <HOSTNAME> <EMAIL>" >&2
  exit 1
}
[[ "$PORT" =~ ^[0-9]+$ ]] && [ "$PORT" -ge 4024 ] && [ "$PORT" -le 65533 ] || {
  echo "ERROR: PORT must be 4024-65533 (5-port range needed)!" >&2
  exit 1
}

# Check if hostname is local (copied from bbx.sh)
is_local_hostname() {
    local hostname="$1"
    local resolved_ip=$(dig +short "$hostname" A | grep -v '\.$' | head -n1)
    if [[ "$hostname" == "localhost" || "$hostname" =~ \.local$ || "$resolved_ip" =~ ^(127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1) ]]; then
        return 0  # Local
    else
        if command -v getent >/dev/null; then
            resolved_ip=$(getent hosts "$hostname" | tail -n1)
            if [[ "$resolved_ip" =~ ^(127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1) ]]; then
                return 0
            fi
        fi
        return 1  # Not local
    fi
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
    mkdir -p "$CERT_DIR"
    if [ ! -f "$CERT_DIR/fullchain.pem" ] || [ ! -f "$CERT_DIR/privkey.pem" ] || [ "$(openssl x509 -in "$CERT_DIR/fullchain.pem" -noout -subject | grep -o "$HOSTNAME")" != "$HOSTNAME" ]; then
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
    $SUDO chown "${SUDO_USER:-$USER}:${SUDO_USER:-$USER} "$CERT_DIR"/*.pem
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
    $SUDO docker pull "$DOCKER_IMAGE_DOSAYGO" && DOCKER_IMAGE="$DOCKER_IMAGE_DOSAYGO" || {
        echo "Falling back to $DOCKER_IMAGE_GHCR..." >&2
        $SUDO docker pull "$DOCKER_IMAGE_GHCR" || { echo "ERROR: Failed to pull image!" >&2; exit 1; }
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
