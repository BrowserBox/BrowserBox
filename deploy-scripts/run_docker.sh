#!/usr/bin/env bash
set -e  # Exit on error
trap 'echo "Error: Bailed! Check output..." >&2' ERR
trap 'echo "Done!" >&2' EXIT

if [[ -n "$BBX_DEBUG" ]]; then
  set -x
fi

# Vars & Defaults
PORT="${1:-}"         # Main port (e.g., 8080)
HOSTNAME="${2:-}"     # DNS hostname
EMAIL="${3:-}"        # User email
DOCKER_IMAGE_DOSAYGO="dosaygo/browserbox:latest"
DOCKER_IMAGE_GHCR="ghcr.io/browserbox/browserbox:latest"
CERT_DIR="$HOME/sslcerts"
OS="$(uname -s)"
branch="${BBX_BRANCH:-main}"

# Choose a docker command that works without sudo if possible
pick_docker_cmd() {
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    echo "docker"
    return 0
  fi
  if command -v sudo >/dev/null 2>&1 && sudo -n docker info >/dev/null 2>&1; then
    echo "sudo -n docker"
    return 0
  fi
  # Final attempt: docker exists but requires sudo (passworded). We won’t block; we’ll try plain docker and surface errors later.
  if command -v docker >/dev/null 2>&1; then
    echo "docker"
    return 0
  fi
  echo ""
  return 1
}

DOCKER_CMD="$(pick_docker_cmd || true)"
if [[ -z "$DOCKER_CMD" ]]; then
  echo "ERROR: Docker is not available. Install docker and/or add your user to the 'docker' group, or configure passwordless sudo for docker." >&2
  exit 1
fi

# License Agreement & Key (non-interactive safe: only prompt if TTY)
echo "BrowserBox v11 Terms: https://dosaygo.com/terms.txt | License: https://github.com/BrowserBox/BrowserBox/blob/main/LICENSE.md | Privacy: https://dosaygo.com/privacy.txt"
if [[ "${AGREE:-}" != "yes" ]]; then
  if [ -t 0 ]; then
    read -p " Agree? (yes/no): " AGREE
  else
    AGREE="yes"  # assume agree in non-interactive environments
  fi
fi
[[ "$AGREE" = "yes" ]] || { echo "ERROR: Must agree to terms!" >&2; exit 1; }

# Source config (optional)
CONFIG_DIR="$HOME/.config/dosyago/bbpro"
CONFIG_FILE="$CONFIG_DIR/config"
if [[ -f "$CONFIG_FILE" ]]; then
  echo "Sourcing $CONFIG_FILE..." >&2
  # shellcheck disable=SC1090
  source "$CONFIG_FILE"
else
  echo "No config file found at $CONFIG_FILE. Proceeding without it." >&2
fi

# LICENSE_KEY
if [[ -z "$LICENSE_KEY" ]]; then
  if [ -t 0 ]; then
    while [[ -z "$LICENSE_KEY" ]]; do
      read -p "Please enter your LICENSE_KEY (contact sales@dosaygo.com): " LICENSE_KEY
      [[ -n "$LICENSE_KEY" ]] || echo "ERROR: LICENSE_KEY cannot be empty. Please try again." >&2
    done
  else
    echo "ERROR: LICENSE_KEY is required (set env LICENSE_KEY) in non-interactive mode." >&2
    exit 1
  fi
else
  echo "LICENSE_KEY is already set." >&2
fi

# Args Check
if [[ -z "$PORT" || -z "$HOSTNAME" || -z "$EMAIL" ]]; then
  echo "ERROR: Usage: $0 <PORT> <HOSTNAME> <EMAIL>" >&2
  exit 1
fi
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
PLATFORM="$(detect_platform)"

# Check if hostname is local (unchanged logic)
is_local_hostname() {
  local hostname="$1"
  local resolved_ips ip
  local public_dns_servers=("8.8.8.8" "1.1.1.1" "208.67.222.222")
  local has_valid_result=0

  for dns in "${public_dns_servers[@]}"; do
    if command -v dig >/dev/null 2>&1; then
      resolved_ips=$(dig +short "$hostname" A @"$dns")
    else
      resolved_ips=""
    fi
    if [[ -n "$resolved_ips" ]]; then
      has_valid_result=1
      while IFS= read -r ip; do
        ip="${ip%.}"
        if [[ ! "$ip" =~ ^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1$|fe80:) ]]; then
          return 1  # Public
        fi
      done <<< "$resolved_ips"
    fi
  done

  if [[ "$has_valid_result" -eq 1 ]]; then
    return 0  # All resolved IPs were private
  fi

  if command -v getent &>/dev/null; then
    ip=$(getent hosts "$hostname" | awk '{print $1}' | head -n1)
    if [[ "$ip" =~ ^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1$|fe80:) ]]; then
      return 0
    fi
  fi

  return 0  # Treat unresolvable as local
}

# Port availability (non-privileged)
check_port() {
  local p=$1
  if [[ "$OS" = "Darwin" ]]; then
    if command -v lsof >/dev/null 2>&1 && lsof -iTCP -P -n | grep -q "LISTEN.*:$p"; then
      echo "ERROR: Port $p in use!" >&2; return 1
    fi
  else
    # Try /dev/tcp check (no sudo)
    if bash -c "exec 6<>/dev/tcp/127.0.0.1/$p" 2>/dev/null; then
      exec 6>&- 2>/dev/null || true
      exec 6<&- 2>/dev/null || true
      echo "ERROR: Port $p in use!" >&2; return 1
    fi
  fi
  return 0
}
for p in $(seq $((PORT-2)) $((PORT+2))); do
  check_port "$p" || exit 1
done

# Firewall (best-effort; skip without sudo)
open_ports() {
  local start=$1 end=$2
  if [[ "$OS" = "Darwin" ]]; then
    if command -v sudo >/dev/null 2>&1; then
      echo "pass in proto tcp from any to any port $start:$end" | sudo -n pfctl -ef - 2>/dev/null || \
        echo "WARNING: macOS firewall tweak failed—open $start-$end/tcp manually!" >&2
    else
      echo "WARNING: No sudo; cannot adjust macOS pf firewall. Open $start-$end/tcp manually if needed." >&2
    fi
  elif command -v firewall-cmd >/dev/null 2>&1; then
    if command -v sudo >/dev/null 2>&1; then
      sudo -n firewall-cmd --permanent --add-port="$start-$end/tcp" && sudo -n firewall-cmd --reload || \
        echo "WARNING: firewalld failed—open $start-$end/tcp manually!" >&2
    else
      echo "WARNING: No sudo; cannot adjust firewalld. Open $start-$end/tcp manually if needed." >&2
    fi
  elif command -v ufw >/dev/null 2>&1; then
    if command -v sudo >/dev/null 2>&1; then
      sudo -n ufw allow "$start:$end/tcp" || echo "WARNING: ufw failed—open $start-$end/tcp manually!" >&2
    else
      echo "WARNING: No sudo; cannot adjust ufw. Open $start-$end/tcp manually if needed." >&2
    fi
  else
    echo "WARNING: No firewall tool found—ensure $start-$end/tcp are open if needed." >&2
  fi
}
! is_local_hostname "$HOSTNAME" && open_ports 80 80
open_ports $((PORT-2)) $((PORT+2))

# External IP (best-effort)
get_ip() {
  curl -4s --connect-timeout 5 "https://icanhazip.com" || \
  curl -4s --connect-timeout 5 "https://ifconfig.me" || \
  { echo "ERROR: Can't fetch public IP—check network!" >&2; exit 1; }
}

# Certs
fetch_certs() {
  mkdir -p "$CERT_DIR"

  local full="$CERT_DIR/fullchain.pem"
  local key="$CERT_DIR/privkey.pem"

  # If both files exist and subject matches HOSTNAME, keep them
  if [[ -f "$full" && -f "$key" ]]; then
    if openssl x509 -in "$full" -noout -subject 2>/dev/null | grep -q "$HOSTNAME"; then
      return 0
    fi
  fi

  # If HOSTNAME is public, try the upstream tls helper (may require port 80 reachability)
  if ! is_local_hostname "$HOSTNAME"; then
    echo "Attempting ACME cert fetch for $HOSTNAME (DNS A must point to $(get_ip))..." >&2
    if bash <(curl -fsSL "https://raw.githubusercontent.com/BrowserBox/BrowserBox/${branch}/deploy-scripts/wait_for_hostname.sh") "$HOSTNAME"; then
      if BB_USER_EMAIL="$EMAIL" CERT_DIR="$CERT_DIR" bash <(curl -fsSL "https://raw.githubusercontent.com/BrowserBox/BrowserBox/${branch}/deploy-scripts/tls") "$HOSTNAME"; then
        if [[ -f "$full" && -f "$key" ]]; then
          chmod 600 "$full" "$key" || true
          return 0
        fi
        echo "WARNING: TLS helper ran but certs not found—falling back to self-signed." >&2
      else
        echo "WARNING: TLS helper failed—falling back to self-signed." >&2
      fi
    else
      echo "WARNING: Hostname $HOSTNAME not resolving correctly—falling back to self-signed." >&2
    fi
  else
    echo "INFO: Local hostname—generating self-signed cert." >&2
  fi

  # Self-signed fallback
  echo "Generating self-signed cert for $HOSTNAME..." >&2
  openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
    -keyout "$key" -out "$full" \
    -subj "/CN=$HOSTNAME" >/dev/null 2>&1 || {
      echo "ERROR: Failed to generate self-signed certs." >&2
      exit 1
    }
  chmod 600 "$full" "$key" || true
}
fetch_certs

# Pick image (prefer existing)
DOCKER_IMAGE=""
if ${DOCKER_CMD} images --format '{{.Repository}}:{{.Tag}}' | grep -q "^$DOCKER_IMAGE_DOSAYGO$"; then
  DOCKER_IMAGE="$DOCKER_IMAGE_DOSAYGO"
  echo "Found $DOCKER_IMAGE locally—using it!" >&2
elif ${DOCKER_CMD} images --format '{{.Repository}}:{{.Tag}}' | grep -q "^$DOCKER_IMAGE_GHCR$"; then
  DOCKER_IMAGE="$DOCKER_IMAGE_GHCR"
  echo "Found $DOCKER_IMAGE locally—using it!" >&2
else
  echo "Pulling latest $DOCKER_IMAGE_DOSAYGO..." >&2
  if ${DOCKER_CMD} pull --platform "$PLATFORM" "$DOCKER_IMAGE_DOSAYGO"; then
    DOCKER_IMAGE="$DOCKER_IMAGE_DOSAYGO"
  else
    echo "Falling back to $DOCKER_IMAGE_GHCR..." >&2
    ${DOCKER_CMD} pull --platform "$PLATFORM" "$DOCKER_IMAGE_GHCR" || {
      echo "ERROR: Failed to pull image from both registries!" >&2
      exit 1
    }
    DOCKER_IMAGE="$DOCKER_IMAGE_GHCR"
  fi
fi

# Run container (avoid sudo inside container)
echo "Starting BrowserBox on $HOSTNAME:$PORT..." >&2
CONTAINER_ID="$(
  ${DOCKER_CMD} run --cap-add=SYS_NICE -d \
    -p "$PORT:$PORT" \
    -p "$((PORT-2)):$((PORT-2))" \
    -p "$((PORT-1)):$((PORT-1))" \
    -p "$((PORT+1)):$((PORT+1))" \
    -p "$((PORT+2)):$((PORT+2))" \
    -v "$CERT_DIR:/home/bbpro/sslcerts" \
    -e "LICENSE_KEY=$LICENSE_KEY" \
    "$DOCKER_IMAGE" bash -lc '
      set -e
      cd /home/bbpro/sslcerts
      chown bbpro:bbpro *.pem 2>/dev/null || true
      cd /home/bbpro/bbpro
      setup_bbpro --port '"$PORT"' > login_link.txt
      bbcertify
      bbpro
      ./deploy-scripts/drun.sh
    ' 2>/dev/null
)" || {
  echo "ERROR: Docker run failed!" >&2
  exit 1
}

# Login link (best-effort)
sleep 5
if ! ${DOCKER_CMD} cp "$CONTAINER_ID:/home/bbpro/bbpro/login_link.txt" ./login_link.txt 2>/dev/null; then
  echo "WARNING: Login link not ready—check logs with: ${DOCKER_CMD} logs $CONTAINER_ID" >&2
  LOGIN_LINK="https://$HOSTNAME:$PORT/login?token=<check_logs>"
else
  LOGIN_LINK="$(sed "s/localhost/$HOSTNAME/" < login_link.txt)"
fi

# Output
echo "===========================================" >&2
echo "Login Link: $LOGIN_LINK" >&2
echo "Container ID: $CONTAINER_ID" >&2
echo "Stop: ${DOCKER_CMD} stop $CONTAINER_ID" >&2
echo "Shell: ${DOCKER_CMD} exec -it $CONTAINER_ID bash" >&2
echo "===========================================" >&2

# Cleanup choice (only prompt if TTY)
if [ -t 0 ]; then
  read -p "Keep running? (n/no to stop, else continues): " KEEP
  if [[ "$KEEP" = "n" || "$KEEP" = "no" ]]; then
    ${DOCKER_CMD} stop --time 3 "$CONTAINER_ID" && echo "Stopped!" >&2
  fi
fi

exit 0

