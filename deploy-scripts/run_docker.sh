#!/usr/bin/env bash
set -e # Exit on error
trap 'echo "Error: Bailed! Check output..." >&2' ERR
trap 'echo "Done!" >&2' EXIT
if [[ -n "$BBX_DEBUG" ]]; then
  set -x
fi
# Source the config file if it exists (OG)
CONFIG_DIR="$HOME/.config/dosyago/bbpro"
CONFIG_FILE="$CONFIG_DIR/config"
if [[ -f "$CONFIG_FILE" ]]; then
  echo "Sourcing $CONFIG_FILE..." >&2
  # shellcheck disable=SC1090
  source "$CONFIG_FILE"
else
  echo "No config file found at $CONFIG_FILE. Proceeding without it." >&2
fi
# Vars & Defaults
PORT="${1:-}" # Main port (e.g., 8080)
HOSTNAME="${2:-}" # DNS hostname
EMAIL="${3:-}" # User email
DOCKER_IMAGE_DOSAYGO="dosaygo/browserbox:latest"
DOCKER_IMAGE_GHCR="ghcr.io/browserbox/browserbox:latest"
CERT_DIR="$HOME/sslcerts"
SUDO=$(command -v sudo >/dev/null && echo "sudo -n" || echo "")
OS=$(uname)
branch="${BBX_BRANCH:-main}"
# --- Helpers ---------------------------------------------------------------
have_sudo() { command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; }
# Prefer sudo docker (OG path) if it works; else try plain docker.
pick_docker_cmd() {
  if have_sudo && sudo -n docker info >/dev/null 2>&1; then
    echo "sudo -n docker"; return 0
  fi
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    echo "docker"; return 0
  fi
  # Last resort: if docker exists but info fails, still return docker so errors are surfaced clearly.
  if command -v docker >/dev/null 2>&1; then
    echo "docker"; return 0
  fi
  echo ""; return 1
}
# --- DO NOT hard fail if not root/no sudo. Preserve OG privileged path but allow fallback.
# (OG had: require root or passwordless sudo; we relax this to allow unprivileged runs.)
# Root/Sudo Check (soft)
if [ "$EUID" -ne 0 ] && ! have_sudo; then
  echo "INFO: No root or passwordless sudo; will try unprivileged path where possible." >&2
fi
# License Agreement & Key (OG behavior; still interactive)
echo "BrowserBox v12 Terms: https://dosaygo.com/terms.txt | License: https://github.com/BrowserBox/BrowserBox/blob/main/LICENSE.md | Privacy: https://dosaygo.com/privacy.txt"
[ "${AGREE:-no}" = "yes" ] || read -r -p " Agree? (yes/no): " AGREE
[ "$AGREE" = "yes" ] || { echo "ERROR: Must agree to terms!" >&2; exit 1; }
# LICENSE_KEY (OG)
if [[ -z "$LICENSE_KEY" ]]; then
  echo "LICENSE_KEY is required to proceed." >&2
  while [[ -z "$LICENSE_KEY" ]]; do
    read -r -p "Please enter your LICENSE_KEY (contact sales@dosaygo.com): " LICENSE_KEY
    if [[ -z "$LICENSE_KEY" ]]; then
      echo "ERROR: LICENSE_KEY cannot be empty. Please try again." >&2
    fi
  done
  if [[ -n "$BBX_DEBUG" ]]; then
    echo "LICENSE_KEY set to $LICENSE_KEY." >&2
  else
    echo "LICENSE_KEY captured." >&2
  fi
else
  echo "LICENSE_KEY is already set." >&2
fi
# Args Check (OG)
if [[ -z "$PORT" || -z "$HOSTNAME" || -z "$EMAIL" ]]; then
  echo "ERROR: Usage: $0 <PORT> <HOSTNAME> <EMAIL>" >&2; exit 1
fi
if ! ([[ "$PORT" =~ ^[0-9]+$ ]] && [ "$PORT" -ge 4024 ] && [ "$PORT" -le 65533 ]); then
  echo "ERROR: PORT must be 4024-65533 (5-port range needed)!" >&2
  exit 1
fi
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
# Check if hostname is local (OG)
is_local_hostname() {
  local hostname="$1"
  local resolved_ips ip
  local public_dns_servers=("8.8.8.8" "1.1.1.1" "208.67.222.222")
  local has_valid_result=0
  for dns in "${public_dns_servers[@]}"; do
    resolved_ips=$(command -v dig >/dev/null 2>&1 && dig +short "$hostname" A @"$dns" || echo "")
    if [[ -n "$resolved_ips" ]]; then
      has_valid_result=1
      while IFS= read -r ip; do
        ip="${ip%.}"
        # Public if NOT in known private ranges
        if [[ ! "$ip" =~ ^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1$|fe80:) ]]; then
          return 1 # Public
        fi
      done <<< "$resolved_ips"
    fi
  done
  # If all results were private or none resolved, treat as local
  if [[ "$has_valid_result" -eq 1 ]]; then
    return 0 # All IPs private => local
  fi
  # Fallback: check /etc/hosts (or similar)
  if command -v getent &>/dev/null; then
    ip=$(getent hosts "$hostname" | awk '{print $1}' | head -n1)
    if [[ "$ip" =~ ^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1$|fe80:) ]]; then
      return 0 # Local
    fi
  fi
  return 0 # Unresolvable => local
}
# Port Availability (preserve OG order: sudo path first, then non-sudo fallback)
check_port() {
  local p=$1
  if [[ "$OS" = "Darwin" ]]; then
    # lsof usually works unprivileged for LISTEN; try it; fallback to netstat/ss
    if command -v lsof >/dev/null 2>&1; then
      lsof -iTCP -P -n 2>/dev/null | grep -q "LISTEN.*:$p" && { echo "ERROR: Port $p in use!" >&2; return 1; } || return 0
    elif command -v netstat >/dev/null 2>&1; then
      netstat -anv -p tcp 2>/dev/null | grep -q "\.$p .*LISTEN" && { echo "ERROR: Port $p in use!" >&2; return 1; } || return 0
    elif command -v ss >/dev/null 2>&1; then
      ss -ltn 2>/dev/null | awk '{print $4}' | grep -q ":$p\$" && { echo "ERROR: Port $p in use!" >&2; return 1; } || return 0
    else
      # Fallback: /dev/tcp probe (no sudo needed)
      bash -c "exec 6<>/dev/tcp/127.0.0.1/$p" 2>/dev/null && { exec 6>&- 2>/dev/null || true; exec 6<&- 2>/dev/null || true; echo "ERROR: Port $p in use!" >&2; return 1; } || return 0
    fi
  else
    # Linux: try OG sudo path first, then unprivileged fallbacks
    if have_sudo; then
      $SUDO bash -c "exec 6<>/dev/tcp/127.0.0.1/$p" 2>/dev/null && { echo "ERROR: Port $p in use!" >&2; return 1; } || return 0
    fi
    # Non-sudo fallbacks: ss -> /dev/tcp
    if command -v ss >/dev/null 2>&1; then
      ss -ltn 2>/dev/null | awk '{print $4}' | grep -q ":$p\$" && { echo "ERROR: Port $p in use!" >&2; return 1; } || return 0
    fi
    bash -c "exec 6<>/dev/tcp/127.0.0.1/$p" 2>/dev/null && { exec 6>&- 2>/dev/null || true; exec 6<&- 2>/dev/null || true; echo "ERROR: Port $p in use!" >&2; return 1; } || return 0
  fi
}
for p in $(seq $((PORT-2)) $((PORT+2))); do
  check_port "$p" || exit 1
done
# Firewall Open (preserve OG sudo first; warn if not possible)
open_ports() {
  local start=$1 end=$2
  if [[ "$OS" = "Darwin" ]]; then
    if have_sudo; then
      echo "pass in proto tcp from any to any port $start:$end" | $SUDO pfctl -ef - 2>/dev/null || echo "WARNING: Firewall tweak failed - open $start-$end/tcp manually!" >&2
    else
      echo "WARNING: No sudo; cannot adjust macOS pf. Open $start-$end/tcp manually if needed." >&2
    fi
  elif command -v firewall-cmd >/dev/null 2>&1; then
    if have_sudo; then
      $SUDO firewall-cmd --permanent --add-port="$start-$end/tcp" && $SUDO firewall-cmd --reload || echo "WARNING: firewalld failed - open $start-$end/tcp manually!" >&2
    else
      echo "WARNING: No sudo; cannot adjust firewalld. Open $start-$end/tcp manually if needed." >&2
    fi
  elif command -v ufw >/dev/null 2>&1; then
    if have_sudo; then
      $SUDO ufw allow "$start:$end/tcp" || echo "WARNING: ufw failed - open $start-$end/tcp manually!" >&2
    else
      echo "WARNING: No sudo; cannot adjust ufw. Open $start-$end/tcp manually if needed." >&2
    fi
  else
    echo "WARNING: No firewall tool found‚Äîensure $start-$end/tcp are open if needed." >&2
  fi
}
! is_local_hostname "$HOSTNAME" && open_ports 80 80
open_ports $((PORT-2)) $((PORT+2))
# External IP (OG)
get_ip() {
  curl -4s --connect-timeout 5 "https://icanhazip.com" || curl -4s --connect-timeout 5 "https://ifconfig.me" || {
    echo "ERROR: Can't fetch IP‚Äîcheck network!" >&2
    exit 1
  }
}
# Certs Fetch (preserve OG sudo path; fallback to non-sudo)
fetch_certs() {
  mkdir -p "$CERT_DIR" || { have_sudo && $SUDO mkdir -p "$CERT_DIR"; }
  # Prefer sudo-based checks (OG); else non-sudo checks
  local full="$CERT_DIR/fullchain.pem"
  local key="$CERT_DIR/privkey.pem"
  local have_match=1
  if have_sudo && $SUDO test -f "$full" && $SUDO test -f "$key"; then
    subj="$($SUDO openssl x509 -in "$full" -noout -subject 2>/dev/null || true)"
    [[ "$subj" == *"$HOSTNAME"* ]] && have_match=0
  elif [[ -f "$full" && -f "$key" ]]; then
    subj="$(openssl x509 -in "$full" -noout -subject 2>/dev/null || true)"
    [[ "$subj" == *"$HOSTNAME"* ]] && have_match=0
  fi
  if [[ $have_match -ne 0 ]]; then
    if ! is_local_hostname "$HOSTNAME"; then
      echo "Fetching certs for $HOSTNAME (DNS A record to $(get_ip) required)..." >&2
      bash <(curl -s "https://raw.githubusercontent.com/BrowserBox/BrowserBox/${branch}/deploy-scripts/wait_for_hostname.sh") "$HOSTNAME" || {
        echo "ERROR: Hostname $HOSTNAME not resolving!" >&2
        exit 1
      }
    fi
    # tls helper writes into $CERT_DIR as current user
    BB_USER_EMAIL="$EMAIL" CERT_DIR="$CERT_DIR" bash <(curl -s "https://raw.githubusercontent.com/BrowserBox/BrowserBox/${branch}/deploy-scripts/tls") "$HOSTNAME" || {
      echo "ERROR: Cert fetch failed!" >&2
      exit 1
    }
  fi
  # Permissions: prefer sudo; else try without
  if have_sudo; then
    $SUDO chmod 600 "$CERT_DIR"/*.pem || true
    # GUSER="$(id -g)"
    # $SUDO chown "${SUDO_USER:-$USER}:${SUDO_USER:-$GUSER}" "$CERT_DIR"/*.pem || true
    PGROUP_NAME="$(id -gn 2>/dev/null || true)"
    PGROUP="${PGROUP_NAME:-$(id -g)}"
    OWNER="${SUDO_USER:-$USER}"
    $SUDO chown "$OWNER:$PGROUP" "$CERT_DIR"/*.pem || true
  else
    chmod 600 "$CERT_DIR"/*.pem 2>/dev/null || true
  fi
}
fetch_certs
# Encode certs for injection (avoids mount/perms issues)
# robust no-wrap base64 encode of a file (GNU/BSD/OpenSSL fallbacks)
b64_encode_nowrap() {
  local f="$1"
  # Try GNU: --wrap=0 / -w 0
  base64 --wrap=0 "$f" 2>/dev/null && return 0
  base64 -w 0 "$f" 2>/dev/null && return 0
  # Try BSD: stdin redirect to handle file input portably
  base64 < "$f" 2>/dev/null | tr -d '\n' && return 0
  # Fallback: OpenSSL
  openssl base64 -A -in "$f"
}
FULLCHAIN_PEM="$(b64_encode_nowrap "$CERT_DIR/fullchain.pem")"
PRIVKEY_PEM="$(b64_encode_nowrap "$CERT_DIR/privkey.pem")"
# Docker command (prefer sudo first to preserve OG behavior)
DOCKER_CMD="$(pick_docker_cmd || true)"
if [[ -z "$DOCKER_CMD" ]]; then
  echo "ERROR: Docker is not available. Install docker and/or add your user to the 'docker' group, or configure passwordless sudo for docker." >&2
  exit 1
fi
# Docker Image Pull (preserve OG: sudo path first via DOCKER_CMD)
DOCKER_IMAGE=""
if ${DOCKER_CMD} images --format '{{.Repository}}:{{.Tag}}' | grep -q "^$DOCKER_IMAGE_DOSAYGO$"; then
  DOCKER_IMAGE="$DOCKER_IMAGE_DOSAYGO"
  echo "Found $DOCKER_IMAGE locally - using it!" >&2
elif ${DOCKER_CMD} images --format '{{.Repository}}:{{.Tag}}' | grep -q "^$DOCKER_IMAGE_GHCR$"; then
  DOCKER_IMAGE="$DOCKER_IMAGE_GHCR"
  echo "Found $DOCKER_IMAGE locally - using it!" >&2
else
  echo "Pulling latest $DOCKER_IMAGE_DOSAYGO..." >&2
  if ${DOCKER_CMD} pull --platform "$PLATFORM" "$DOCKER_IMAGE_DOSAYGO"; then
    DOCKER_IMAGE="$DOCKER_IMAGE_DOSAYGO"
  else
    echo "Falling back to $DOCKER_IMAGE_GHCR..." >&2
    ${DOCKER_CMD} pull --platform "$PLATFORM" "$DOCKER_IMAGE_GHCR" || {
      echo "ERROR: Failed to pull image!" >&2; exit 1; }
    DOCKER_IMAGE="$DOCKER_IMAGE_GHCR"
  fi
fi
# Docker Run (main container as default non-root user; inject certs via env)
echo "Starting BrowserBox on $HOSTNAME:$PORT..." >&2
CONTAINER_ID="$(
  ${DOCKER_CMD} run --cap-add=SYS_NICE -d \
    -p "$PORT:$PORT" \
    -p "$((PORT-2)):$((PORT-2))" \
    -p "$((PORT-1)):$((PORT-1))" \
    -p "$((PORT+1)):$((PORT+1))" \
    -p "$((PORT+2)):$((PORT+2))" \
    -e "LICENSE_KEY=$LICENSE_KEY" -e "FULLCHAIN_PEM=$FULLCHAIN_PEM" -e "PRIVKEY_PEM=$PRIVKEY_PEM" \
    "$DOCKER_IMAGE" bash -c "mkdir -p ~/sslcerts; echo \"\$FULLCHAIN_PEM\" | base64 -d > ~/sslcerts/fullchain.pem; echo \"\$PRIVKEY_PEM\" | base64 -d > ~/sslcerts/privkey.pem; chmod 600 ~/sslcerts/*.pem; cd ~/bbpro && setup_bbpro --port $PORT > login_link.txt && bbcertify && bbpro && ./deploy-scripts/drun.sh"
)" || {
  echo "ERROR: Docker run failed!" >&2
  exit 1
}
# Login Link (OG with DOCKER_CMD)
sleep 5
${DOCKER_CMD} cp "$CONTAINER_ID:/home/bbpro/bbpro/login_link.txt" ./login_link.txt 2>/dev/null || {
  echo "WARNING: Login link not ready - check logs with: ${DOCKER_CMD} logs $CONTAINER_ID" >&2
  LOGIN_LINK="https://$HOSTNAME:$PORT/login?token=<check_logs>"
}
[ -f "login_link.txt" ] && LOGIN_LINK=$(cat login_link.txt | sed "s/localhost/$HOSTNAME/") || LOGIN_LINK="https://$HOSTNAME:$PORT/login?token=<check_logs>"
# Output (OG text; hint real command uses DOCKER_CMD)
echo "===========================================" >&2
echo "Login Link: $LOGIN_LINK" >&2
echo "Container ID: $CONTAINER_ID" >&2
echo "Stop: ${DOCKER_CMD} stop $CONTAINER_ID" >&2
echo "Shell: ${DOCKER_CMD} exec -it $CONTAINER_ID bash" >&2
echo "===========================================" >&2
# Cleanup Choice (OG; use DOCKER_CMD)
read -p "Keep running? (n/no to stop, else continues): " KEEP
[[ "$KEEP" = "n" || "$KEEP" = "no" ]] && ${DOCKER_CMD} stop --time 3 "$CONTAINER_ID" && echo "Stopped!" >&2
exit 0
