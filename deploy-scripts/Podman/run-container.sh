#!/usr/bin/env bash
set -e
trap 'echo "Error: Bailed! Check output..." >&2' ERR
trap 'echo "Done!" >&2' EXIT
[[ -n "$BBX_DEBUG" ]] && set -x

# Source config (unchanged)
CONFIG_DIR="$HOME/.config/dosyago/bbpro"
CONFIG_FILE="$CONFIG_DIR/config"
[[ -f "$CONFIG_FILE" ]] && { echo "Sourcing $CONFIG_FILE..." >&2; source "$CONFIG_FILE"; } || echo "No config at $CONFIG_FILE" >&2

PORT="${1:-}"      # required
HOSTNAME="${2:-}"  # required
EMAIL="${3:-}"     # required

IMG_DOCKER_HUB="dosaygo/browserbox:latest"
IMG_GHCR="ghcr.io/browserbox/browserbox:latest"
CERT_DIR="$HOME/sslcerts"

have_sudo() { command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; }

# Prefer podman, then docker
pick_ctrcmd() {
  if command -v podman >/dev/null 2>&1 && podman info >/dev/null 2>&1; then
    echo "podman"; return 0
  fi
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    echo "docker"; return 0
  fi
  if command -v podman >/dev/null 2>&1; then echo "podman"; return 0; fi
  if command -v docker  >/dev/null 2>&1; then echo "docker";  return 0; fi
  return 1
}

CTR="$(pick_ctrcmd || true)"
[[ -z "$CTR" ]] && { echo "ERROR: Need podman or docker installed." >&2; exit 1; }

OS="$(uname)"
branch="${BBX_BRANCH:-main}"

echo "BrowserBox v13 Terms: https://dosaygo.com/terms.txt | License: https://github.com/BrowserBox/BrowserBox/blob/main/LICENSE.md | Privacy: https://dosaygo.com/privacy.txt"
[ "${AGREE:-no}" = "yes" ] || read -r -p " Agree? (yes/no): " AGREE
[ "$AGREE" = "yes" ] || { echo "ERROR: Must agree to terms!" >&2; exit 1; }

# LICENSE_KEY prompt (unchanged)
if [[ -z "${LICENSE_KEY:-}" ]]; then
  while [[ -z "${LICENSE_KEY:-}" ]]; do
    read -r -p "Please enter your LICENSE_KEY: " LICENSE_KEY
  done
fi

# Args
if [[ -z "$PORT" || -z "$HOSTNAME" || -z "$EMAIL" ]]; then
  echo "ERROR: Usage: $0 <PORT> <HOSTNAME> <EMAIL>" >&2; exit 1
fi
if ! ([[ "$PORT" =~ ^[0-9]+$ ]] && [ "$PORT" -ge 4024 ] && [ "$PORT" -le 65533 ]); then
  echo "ERROR: PORT must be 4024-65533 (5-port range needed)!" >&2
  exit 1
fi

# Arch detect for pulls (podman and docker accept --platform)
detect_platform() {
  local os arch
  os=$(uname -s | tr '[:upper:]' '[:lower:]')
  arch=$(uname -m)
  case "$arch" in
    x86_64) arch="amd64" ;;
    aarch64|arm64) arch="arm64" ;;
    armv7l) arch="arm/v7" ;;
    armv6l) arch="arm/v6" ;;
    *) arch="amd64" ;;
  esac
  [[ "$os" = "darwin" ]] && os="linux"
  echo "$os/$arch"
}
PLATFORM="$(detect_platform)"

# Port checks (unchanged core)
check_port() {
  local p=$1
  if [[ "$OS" = "Darwin" ]]; then
    command -v lsof >/dev/null 2>&1 && { lsof -iTCP:$p -P -n -sTCP:LISTEN && return 1 || return 0; }
    command -v netstat >/dev/null 2>&1 && { netstat -anv -p tcp | grep -q "\.$p .*LISTEN" && return 1 || return 0; }
    command -v ss >/dev/null 2>&1 && { ss -ltn | awk '{print $4}' | grep -q ":$p\$" && return 1 || return 0; }
    bash -c "exec 6<>/dev/tcp/127.0.0.1/$p" 2>/dev/null && return 1 || return 0
  else
    command -v ss >/dev/null 2>&1 && { ss -ltn | awk '{print $4}' | grep -q ":$p\$" && return 1 || return 0; }
    bash -c "exec 6<>/dev/tcp/127.0.0.1/$p" 2>/dev/null && return 1 || return 0
  fi
}
for p in $(seq $((PORT-2)) $((PORT+2))); do check_port "$p" || { echo "ERROR: Port $p in use!" >&2; exit 1; }; done

is_local_hostname() {
  local hostname="$1"
  local resolved_ips ip
  local public_dns_servers=("8.8.8.8" "1.1.1.1" "208.67.222.222")
  local has_valid_result=0
  for dns in "${public_dns_servers[@]}"; do
    resolved_ips=$(command -v dig >/dev/null 2>&1 && dig +short "$hostname" A @"$dns")
    if [[ "$?" -eq 0 && -n "$resolved_ips" ]]; then
      has_valid_result=1
      while IFS= read -r ip; do
        ip="${ip%.}"
        [[ ! "$ip" =~ ^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1$|fe80:) ]] && return 1
      done <<< "$resolved_ips"
    fi
  done
  [[ "$has_valid_result" -eq 1 ]] && return 0
  if command -v getent &>/dev/null; then
    ip=$(getent hosts "$hostname" | awk '{print $1}' | head -n1)
    [[ "$ip" =~ ^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|::1$|fe80:) ]] && return 0
  fi
  return 0
}

open_ports() {
  local start=$1 end=$2
  # Podman rootless can map high ports without firewall tweaks; keep your original best-effort hints:
  if command -v firewall-cmd >/dev/null 2>&1 && have_sudo; then
    sudo firewall-cmd --permanent --add-port="${start}-${end}/tcp" || true
    sudo firewall-cmd --reload || true
  elif command -v ufw >/dev/null 2>&1 && have_sudo; then
    sudo ufw allow "${start}:${end}/tcp" || true
  fi
}
! is_local_hostname "$HOSTNAME" && open_ports 80 80
open_ports $((PORT-2)) $((PORT+2))

get_ip() {
  curl -4s --connect-timeout 5 https://icanhazip.com || curl -4s --connect-timeout 5 https://ifconfig.me
}

# Fetch certs (unchanged logic – userland; no root required)
fetch_certs() {
  mkdir -p "$CERT_DIR"
  local full="$CERT_DIR/fullchain.pem" key="$CERT_DIR/privkey.pem"
  local have_match=1
  if [[ -f "$full" && -f "$key" ]]; then
    subj="$(openssl x509 -in "$full" -noout -subject 2>/dev/null || true)"
    [[ "$subj" == *"$HOSTNAME"* ]] && have_match=0
  fi
  if [[ $have_match -ne 0 ]]; then
    if ! is_local_hostname "$HOSTNAME"; then
      echo "Fetching certs for $HOSTNAME (must resolve to $(get_ip))..." >&2
      bash <(curl -s "https://raw.githubusercontent.com/BrowserBox/BrowserBox/${branch}/deploy-scripts/wait_for_hostname.sh") "$HOSTNAME"
    fi
    BB_USER_EMAIL="$EMAIL" CERT_DIR="$CERT_DIR" \
      bash <(curl -s "https://raw.githubusercontent.com/BrowserBox/BrowserBox/${branch}/deploy-scripts/tls") "$HOSTNAME"
  fi
  chmod 600 "$CERT_DIR"/*.pem 2>/dev/null || true
}
fetch_certs

b64_encode_nowrap() {
  base64 --wrap=0 "$1" 2>/dev/null || base64 -w 0 "$1" 2>/dev/null || ( base64 < "$1" | tr -d '\n' ) || openssl base64 -A -in "$1"
}
FULLCHAIN_PEM="$(b64_encode_nowrap "$CERT_DIR/fullchain.pem")"
PRIVKEY_PEM="$(b64_encode_nowrap "$CERT_DIR/privkey.pem")"

# Pull image: prefer Docker Hub then GHCR (works with podman too)
IMAGE=""
if $CTR images --format '{{.Repository}}:{{.Tag}}' | grep -q "^$IMG_DOCKER_HUB$"; then
  IMAGE="$IMG_DOCKER_HUB"
elif $CTR images --format '{{.Repository}}:{{.Tag}}' | grep -q "^$IMG_GHCR$"; then
  IMAGE="$IMG_GHCR"
else
  if $CTR pull --platform "$PLATFORM" "$IMG_DOCKER_HUB"; then
    IMAGE="$IMG_DOCKER_HUB"
  else
    $CTR pull --platform "$PLATFORM" "$IMG_GHCR"
    IMAGE="$IMG_GHCR"
  fi
fi

echo "Starting BrowserBox on $HOSTNAME:$PORT using $CTR ..." >&2
CONTAINER_ID="$(
  $CTR run --cap-add=SYS_NICE -d \
    -p "$PORT:$PORT" \
    -p "$((PORT-2)):$((PORT-2))" \
    -p "$((PORT-1)):$((PORT-1))" \
    -p "$((PORT+1)):$((PORT+1))" \
    -p "$((PORT+2)):$((PORT+2))" \
    -e "LICENSE_KEY=$LICENSE_KEY" \
    -e "FULLCHAIN_PEM=$FULLCHAIN_PEM" \
    -e "PRIVKEY_PEM=$PRIVKEY_PEM" \
    "$IMAGE" bash -lc 'mkdir -p ~/sslcerts; echo "$FULLCHAIN_PEM" | base64 -d > ~/sslcerts/fullchain.pem; echo "$PRIVKEY_PEM" | base64 -d > ~/sslcerts/privkey.pem; chmod 600 ~/sslcerts/*.pem; cd ~/bbpro && setup_bbpro --port '"$PORT"' > login_link.txt && bbcertify && bbpro && ./deploy-scripts/drun.sh'
)" || { echo "ERROR: Container run failed!" >&2; exit 1; }

sleep 5
$CTR cp "$CONTAINER_ID:/home/bbpro/bbpro/login_link.txt" ./login_link.txt 2>/dev/null || true
if [[ -f login_link.txt ]]; then
  LOGIN_LINK="$(sed "s/localhost/$HOSTNAME/" login_link.txt)"
else
  LOGIN_LINK="https://${HOSTNAME}:${PORT}/login?token=<check_logs>"
  echo "Login link not ready; check logs with: $CTR logs $CONTAINER_ID" >&2
fi

echo "===========================================" >&2
echo "Login Link: $LOGIN_LINK" >&2
echo "Container ID: $CONTAINER_ID" >&2
echo "Stop: $CTR stop $CONTAINER_ID" >&2
echo "Shell: $CTR exec -it $CONTAINER_ID bash" >&2
echo "===========================================" >&2

read -p "Keep running? (n/no to stop): " KEEP
[[ "$KEEP" = "n" || "$KEEP" = "no" ]] && $CTR stop --time 3 "$CONTAINER_ID" && echo "Stopped!" >&2

