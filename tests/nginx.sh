#!/usr/bin/env bash
# wildcard_routes.sh
# Cross-platform (Linux + macOS) helper to validate wildcard DNS, obtain Let's Encrypt wildcard cert,
# copy it to ~/sslcerts/, and configure nginx to reverse-proxy 5 adjacent ports via 5 random subdomains.
# Default backend is HTTPS to 127.0.0.1:<port>; optionally HTTP if requested.

#set -euo pipefail
IFS=$'\n\t'

APP_NAME="wildcard-routes"
CONFIG_DIR="${HOME}/.config/${APP_NAME}"
CONFIG_FILE="${CONFIG_DIR}/config.env"
SSL_OUT_DIR="${HOME}/sslcerts"
RETRY_MAX=${RETRY_MAX:-20}
RETRY_SLEEP=${RETRY_SLEEP:-6}
NGINX_SITE_STEM=""  # set later to <mid_fqdn>.conf

# ---- Logging ----
log() { printf '[%s] %s\n' "$APP_NAME" "$*" >&2; }
die() { printf '[%s:error] %s\n' "$APP_NAME" "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

# ---- Global platform detection (run once) ----
OS_KIND=""   # linux|darwin
DIST_ID=""   # ubuntu|debian|rhel|centos|rocky|almalinux|macos|unknown
PKG_MGR=""   # apt-get|dnf|yum|brew|empty
NGINX_ROOT_CONF=""
NGINX_SITES_AVAILABLE=""
NGINX_SITES_ENABLED=""
NGINX_SERVERS_DIR=""
NGINX_CONFD_DIR=""

detect_platform() {
  local uname_s
  uname_s="$(uname -s)"
  if [[ "$uname_s" == "Darwin" ]]; then
    OS_KIND="darwin"; DIST_ID="macos"; PKG_MGR="brew"
    # Determine brew prefix without assuming nginx is installed yet
    local BREW_PREFIX
    BREW_PREFIX="$(brew --prefix 2>/dev/null || true)"
    [[ -n "$BREW_PREFIX" ]] || die "Homebrew is present but 'brew --prefix' failed."

    NGINX_ROOT_CONF="${BREW_PREFIX}/etc/nginx/nginx.conf"
    NGINX_SERVERS_DIR="${BREW_PREFIX}/etc/nginx/servers"
    # Do NOT mkdir or require existence here; ensure_nginx() will handle it after install
  else
    # ... keep your existing Linux block unchanged ...
    OS_KIND="linux"
    if [[ -r /etc/os-release ]]; then
      . /etc/os-release
      DIST_ID="${ID:-unknown}"
    else
      DIST_ID="unknown"
    fi
    if have dnf; then PKG_MGR="dnf"
    elif have yum; then PKG_MGR="yum"
    elif have apt-get; then PKG_MGR="apt-get"
    else PKG_MGR=""
    fi
    if [[ -d /etc/nginx/sites-available && -d /etc/nginx/sites-enabled ]]; then
      NGINX_ROOT_CONF="/etc/nginx/nginx.conf"
      NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
      NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
      mkdir -p "$NGINX_SITES_AVAILABLE" "$NGINX_SITES_ENABLED"
    else
      NGINX_ROOT_CONF="/etc/nginx/nginx.conf"
      NGINX_CONFD_DIR="/etc/nginx/conf.d"
      mkdir -p "$NGINX_CONFD_DIR"
    fi
  fi

  : "${PATH:=${PATH}:/usr/sbin:/sbin:/usr/local/bin}"
}

pkg_install() {
  # $@ = packages (names must match platform)
  [[ -n "$PKG_MGR" ]] || die "No supported package manager found."
  case "$PKG_MGR" in
    apt-get) sudo apt-get update -y && sudo apt-get install -y "$@" ;;
    dnf)     sudo dnf install -y "$@" ;;
    yum)     sudo yum install -y "$@" ;;
    brew)    brew install "$@" ;;
    *)       die "Unsupported package manager: $PKG_MGR" ;;
  esac
}

ensure_dep() {
  # ensure command exists; if not, install using provided per-PM names
  # Usage: ensure_dep <cmd> apt:<pkg> dnf:<pkg> yum:<pkg> brew:<pkg>
  local want="$1"; shift
  have "$want" && return 0
  local apt_pkg="" dnf_pkg="" yum_pkg="" brew_pkg=""
  while (($#)); do
    case "$1" in
      apt:*) apt_pkg="${1#apt:}";;
      dnf:*) dnf_pkg="${1#dnf:}";;
      yum:*) yum_pkg="${1#yum:}";;
      brew:*) brew_pkg="${1#brew:}";;
    esac; shift
  done
  case "$PKG_MGR" in
    apt-get) [[ -n "$apt_pkg" ]] && pkg_install "$apt_pkg" ;;
    dnf)     [[ -n "$dnf_pkg" ]] && pkg_install "$dnf_pkg" ;;
    yum)     [[ -n "$yum_pkg" ]] && pkg_install "$yum_pkg" ;;
    brew)    [[ -n "$brew_pkg" ]] && pkg_install "$brew_pkg" ;;
  esac
  have "$want" || die "Missing dependency '$want' and failed to install it."
}

ensure_dns_tool() {
  if have dig; then echo "dig"; return 0; fi
  if have host; then echo "host"; return 0; fi
  # install one
  case "$PKG_MGR" in
    apt-get) pkg_install dnsutils || true ;;
    dnf)     pkg_install bind-utils || true ;;
    yum)     pkg_install bind-utils || true ;;
    brew)    pkg_install bind || true ;; # 'bind' provides dig on macOS
  esac
  if have dig; then echo "dig"; return 0; fi
  if have host; then echo "host"; return 0; fi
  die "Need a DNS lookup tool (dig or host)."
}

ensure_certbot() {
  have certbot && return 0
  case "$PKG_MGR" in
    apt-get) pkg_install certbot ;;
    dnf)     pkg_install certbot ;;
    yum)     pkg_install certbot ;;
    brew)    pkg_install certbot ;;
    *)       die "Cannot install certbot automatically on this system." ;;
  esac
  have certbot || die "certbot installation failed."
}

ensure_nginx() {
  if have nginx; then
    # Make sure dirs exist post-install too
    if [[ -n "$NGINX_SERVERS_DIR" ]]; then sudo mkdir -p "$NGINX_SERVERS_DIR"; fi
    if [[ -n "$NGINX_SITES_AVAILABLE" ]]; then sudo mkdir -p "$NGINX_SITES_AVAILABLE"; fi
    if [[ -n "$NGINX_SITES_ENABLED" ]]; then sudo mkdir -p "$NGINX_SITES_ENABLED"; fi
    if [[ -n "$NGINX_CONFD_DIR" ]]; then sudo mkdir -p "$NGINX_CONFD_DIR"; fi
    return 0
  fi

  case "$PKG_MGR" in
    apt-get) pkg_install nginx ;;
    dnf)     pkg_install nginx ;;
    yum)     pkg_install nginx ;;
    brew)    brew install nginx ;;
    *)       die "Cannot install nginx automatically on this system." ;;
  esac

  have nginx || die "nginx installation failed."

  # Now that nginx is installed, ensure expected include dirs exist
  if [[ -n "$NGINX_SERVERS_DIR" ]]; then sudo mkdir -p "$NGINX_SERVERS_DIR"; fi
  if [[ -n "$NGINX_SITES_AVAILABLE" ]]; then sudo mkdir -p "$NGINX_SITES_AVAILABLE"; fi
  if [[ -n "$NGINX_SITES_ENABLED" ]]; then sudo mkdir -p "$NGINX_SITES_ENABLED"; fi
  if [[ -n "$NGINX_CONFD_DIR" ]]; then sudo mkdir -p "$NGINX_CONFD_DIR"; fi
}

# ---- IP discovery ----
public_ip() {
  ensure_dep curl apt:curl dnf:curl yum:curl brew:curl
  local ip
  for url in \
    "https://api.ipify.org" \
    "https://ifconfig.me" \
    "https://ipv4.icanhazip.com" \
    "https://checkip.amazonaws.com"
  do
    ip="$(curl -fsS --max-time 3 "$url" || true)"
    ip="${ip//$'\r'/}"; ip="${ip//$'\n'/}"
    if [[ "$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
      printf '%s\n' "$ip"; return 0
    fi
  done
  return 1
}

first_non_loopback_ipv4() {
  if have ip; then
    ip -4 addr show scope global 2>/dev/null \
      | awk '/inet /{print $2}' | cut -d/ -f1 | head -n1
    return 0
  fi
  if have ifconfig; then
    ifconfig 2>/dev/null \
      | awk '/inet[[:space:]]/{print $2}' \
      | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' \
      | grep -v '^127\.' | head -n1
    return 0
  fi
  return 1
}

choose_machine_ip() {
  local ip=""
  if ip="$(public_ip)"; then
    printf '%s\n' "$ip"; return 0
  fi
  log "Public IP not reachable; falling back to first non-loopback local IPv4."
  ip="$(first_non_loopback_ipv4)" || die "Could not determine a non-loopback IPv4."
  printf '%s\n' "$ip"
}

# ---- DNS helpers ----
dns_a_records() {
  local fqdn="$1" tool
  tool="$(ensure_dns_tool)"
  if [[ "$tool" == "dig" ]]; then
    dig +short A "$fqdn" 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' || true
  else
    host "$fqdn" 2>/dev/null | awk '/has address/{print $NF}' || true
  fi
}
random_label() { LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c 16; }

# ---- Nginx writer (standard locations; file named by mid FQDN) ----
enable_nginx_site() {
  # $1: config_text
  # $2: mid_fqdn (used as filename stem <mid_fqdn>.conf)
  local config_text="$1"
  local mid_fqdn="$2"
  local filename="${mid_fqdn}.conf"
  NGINX_SITE_STEM="$filename"

  ensure_nginx

  local target_file=""
  if [[ -n "$NGINX_SERVERS_DIR" ]]; then
    sudo mkdir -p "$NGINX_SERVERS_DIR"
    target_file="${NGINX_SERVERS_DIR}/${filename}"
    printf '%s\n' "$config_text" | sudo tee "$target_file" >/dev/null

  elif [[ -n "$NGINX_SITES_AVAILABLE" && -n "$NGINX_SITES_ENABLED" ]]; then
    target_file="${NGINX_SITES_AVAILABLE}/${filename}"
    printf '%s\n' "$config_text" | sudo tee "$target_file" >/dev/null
    local link="${NGINX_SITES_ENABLED}/${filename}"
    [[ -e "$link" ]] || sudo ln -s "$target_file" "$link"

  else
    target_file="${NGINX_CONFD_DIR}/${filename}"
    printf '%s\n' "$config_text" | sudo tee "$target_file" >/dev/null
  fi

  sudo nginx -t
  if have systemctl; then
    sudo systemctl reload nginx
  elif [[ "$OS_KIND" == "darwin" ]] && have brew; then
    brew services start nginx >/dev/null 2>&1 || true
    brew services restart nginx
  else
    sudo nginx -s reload
  fi
  log "Installed nginx site: ${target_file}"
}

# ---- Cert helpers ----
le_live_dir_for_domain() {
  local d="$1" p="/etc/letsencrypt/live/${d}"
  [[ -d "$p" ]] && printf '%s\n' "$p" || true
}
copy_certs_to_home() {
  local live="$1"
  mkdir -p "$SSL_OUT_DIR"
  chmod 700 "$SSL_OUT_DIR"
  cp -f "${live}/fullchain.pem" "${SSL_OUT_DIR}/fullchain.pem"
  cp -f "${live}/privkey.pem"   "${SSL_OUT_DIR}/privkey.pem"
  chmod 600 "${SSL_OUT_DIR}/fullchain.pem" "${SSL_OUT_DIR}/privkey.pem"
  log "Copied certs to ${SSL_OUT_DIR}/ (fullchain.pem, privkey.pem)."
}

# ---- Main worker ----
wildcard_routes() {
  local domain="" email="" center_port=""
  local backend_scheme=""  # "https" (default) or "http"

  while (($#)); do
    case "$1" in
      -d|--domain)       domain="${2:-}"; shift 2;;
      -e|--email)        email="${2:-}"; shift 2;;
      -p|--center-port)  center_port="${2:-}"; shift 2;;
      --backend)         backend_scheme="${2:-}"; shift 2;;   # http|https
      --backend-http|--backend-http-only)
                         backend_scheme="http"; shift;;
      -h|--help)
        cat <<USAGE
Usage: $0 --domain example.com --email you@example.com --center-port 8080 [--backend https|http]
Reads defaults from ${CONFIG_FILE} if present:
  DOMAIN=example.com
  EMAIL=you@example.com
  CENTER_PORT=8080
  # Backend scheme (default https)
  BACKEND_SCHEME=https          # or "http"
  # Compatibility toggle:
  HTTP_ONLY=true                # sets BACKEND_SCHEME=http

Behavior:
  * Discover public IP (fallback to first non-loopback IPv4)
  * Verify wildcard DNS by resolving a random subdomain to that IP (with retries)
  * Run 'certbot certonly --manual' for *.\$DOMAIN and \$DOMAIN (interactive DNS-01)
  * Copy certs to ${SSL_OUT_DIR}/ (fullchain.pem, privkey.pem)
  * Install nginx (if needed) and add HTTPS vhosts for 5 adjacent ports (P-2..P+2)
  * Proxy to backend over HTTPS by default; switch to HTTP with --backend http or HTTP_ONLY=true
USAGE
        return 0;;
      *) die "Unknown argument: $1";;
    esac
  done

  # Config file (optional)
  if [[ -f "$CONFIG_FILE" ]]; then
    # shellcheck disable=SC1090
    . "$CONFIG_FILE"
    domain="${domain:-${DOMAIN:-}}"
    email="${email:-${EMAIL:-}}"
    center_port="${center_port:-${CENTER_PORT:-}}"
    backend_scheme="${backend_scheme:-${BACKEND_SCHEME:-}}"
    if [[ "${HTTP_ONLY:-}" == "true" && -z "${backend_scheme:-}" ]]; then
      backend_scheme="http"
    fi
  fi

  [[ -n "${domain:-}" ]] || die "Missing --domain and no DOMAIN in ${CONFIG_FILE}."
  [[ -n "${email:-}"  ]] || die "Missing --email and no EMAIL in ${CONFIG_FILE}."
  [[ -n "${center_port:-}" ]] || die "Missing --center-port and no CENTER_PORT in ${CONFIG_FILE}."
  [[ "$center_port" =~ ^[0-9]+$ ]] || die "--center-port must be an integer."
  (( center_port >= 1 && center_port <= 65535 )) || die "Center port out of range 1..65535."

  # Default backend scheme = HTTPS
  backend_scheme="${backend_scheme:-https}"
  if [[ "$backend_scheme" != "http" && "$backend_scheme" != "https" ]]; then
    die "--backend must be 'http' or 'https'"
  fi
  log "Backend scheme: ${backend_scheme^^}"

  # Deps
  ensure_dep curl apt:curl dnf:curl yum:curl brew:curl
  ensure_dns_tool >/dev/null
  ensure_certbot
  ensure_nginx

  # IP
  local ip
  ip="$(choose_machine_ip)"
  log "Chosen IP: ${ip}"

  # Wildcard DNS verify
  local label fqdn try=1 ok="no"
  label="$(random_label)"
  fqdn="${label}.${domain}"
  log "Verifying wildcard DNS: expecting ${fqdn} -> ${ip}"
  while (( try <= RETRY_MAX )); do
    mapfile -t addrs < <(dns_a_records "$fqdn")
    if ((${#addrs[@]})); then
      if printf '%s\n' "${addrs[@]}" | grep -Fxq "$ip"; then ok="yes"; break; fi
    fi
    if (( try == 1 )); then
      cat >&2 <<GUIDE
Action needed (only if this keeps failing):
  • Ensure wildcard A record:  *.${domain} -> ${ip}
  • Ensure apex A record:      ${domain} -> ${ip}
  • If using IPv6, use AAAA records accordingly.
GUIDE
    fi
    log "Attempt ${try}/${RETRY_MAX}: not resolved yet; retrying in ${RETRY_SLEEP}s..."
    ((try++)); sleep "$RETRY_SLEEP"
  done
  [[ "$ok" == "yes" ]] || die "Wildcard DNS did not resolve to ${ip} after ${RETRY_MAX} tries."

  # Certs
  local le_dir
  le_dir="$(le_live_dir_for_domain "$domain")"
  if [[ -z "$le_dir" ]]; then
    log "Requesting Let's Encrypt wildcard certificate for *.${domain} and ${domain} (manual DNS-01)..."
    log "You'll be prompted to create TXT records. Keep this terminal open."
    sudo certbot certonly \
      --manual --preferred-challenges dns \
      -d "*.${domain}" -d "${domain}" \
      --agree-tos -m "${email}" --no-eff-email \
      --manual-public-ip-logging-ok
    le_dir="$(le_live_dir_for_domain "$domain")"
    [[ -d "$le_dir" ]] || die "Certbot completed but live dir not found for ${domain}."
  else
    log "Existing cert found at ${le_dir}; skipping issuance."
  fi
  copy_certs_to_home "$le_dir"

  # Ports & random hosts
  local p0 p1 p2 p3 p4
  p0=$(( center_port - 2 ))
  p1=$(( center_port - 1 ))
  p2=$(( center_port     ))
  p3=$(( center_port + 1 ))
  p4=$(( center_port + 2 ))
  for p in "$p0" "$p1" "$p2" "$p3" "$p4"; do
    (( p >= 1 && p <= 65535 )) || die "Computed adjacent port ${p} out of range."
  done
  local l0 l1 l2 l3 l4
  l0="$(random_label)"; l1="$(random_label)"; l2="$(random_label)"; l3="$(random_label)"; l4="$(random_label)"
  local h0="${l0}.${domain}"
  local h1="${l1}.${domain}"
  local h2="${l2}.${domain}"   # middle → filename key
  local h3="${l3}.${domain}"
  local h4="${l4}.${domain}"

  # Nginx config (HTTPS listeners; proxy to HTTP/HTTPS backend)
  local cert="${le_dir}/fullchain.pem"
  local key="${le_dir}/privkey.pem"

  # backend URL scheme
  local bscheme="$backend_scheme"
  # If HTTPS backend, we usually talk to self-signed localhost; skip verify to keep it simple.
  local proxy_ssl_directives=""
  if [[ "$bscheme" == "https" ]]; then
    read -r -d '' proxy_ssl_directives <<'PSL'
        proxy_ssl_server_name on;
        proxy_ssl_verify off;
PSL
  fi

  local mid_fqdn="${h2}"
  read -r -d '' NCONF <<EOF
# Auto-generated by ${APP_NAME}
# Owner: ${USER}
# Domain: ${domain}
# Primary (filename key): ${mid_fqdn}
# Created: $(date -u +'%Y-%m-%dT%H:%M:%SZ')
# Backend scheme: ${bscheme}
# Notes:
#  - One unit = 5 adjacent ports (P-2..P+2), 5 server blocks in this file.
#  - Filename is ${mid_fqdn}.conf to avoid collisions across users.
#  - Managed by ${APP_NAME}; safe to remove if you retire these routes.

server {
    listen 443 ssl;
    server_name ${h0};
    ssl_certificate     ${cert};
    ssl_certificate_key ${key};
    location / {
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
${proxy_ssl_directives}
        proxy_pass ${bscheme}://127.0.0.1:${p0};
    }
}

server {
    listen 443 ssl;
    server_name ${h1};
    ssl_certificate     ${cert};
    ssl_certificate_key ${key};
    location / {
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
${proxy_ssl_directives}
        proxy_pass ${bscheme}://127.0.0.1:${p1};
    }
}

server {
    listen 443 ssl;
    server_name ${h2};
    ssl_certificate     ${cert};
    ssl_certificate_key ${key};
    location / {
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
${proxy_ssl_directives}
        proxy_pass ${bscheme}://127.0.0.1:${p2};
    }
}

server {
    listen 443 ssl;
    server_name ${h3};
    ssl_certificate     ${cert};
    ssl_certificate_key ${key};
    location / {
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
${proxy_ssl_directives}
        proxy_pass ${bscheme}://127.0.0.1:${p3};
    }
}

server {
    listen 443 ssl;
    server_name ${h4};
    ssl_certificate     ${cert};
    ssl_certificate_key ${key};
    location / {
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
${proxy_ssl_directives}
        proxy_pass ${bscheme}://127.0.0.1:${p4};
    }
}
EOF

  enable_nginx_site "$NCONF" "$mid_fqdn"

  cat <<DONE

✅ All set.

Host → Port mappings (HTTPS listeners → ${bscheme^^} backends):
  https://${h0}  →  ${bscheme}://127.0.0.1:${p0}
  https://${h1}  →  ${bscheme}://127.0.0.1:${p1}
  https://${h2}  →  ${bscheme}://127.0.0.1:${p2}
  https://${h3}  →  ${bscheme}://127.0.0.1:${p3}
  https://${h4}  →  ${bscheme}://127.0.0.1:${p4}

Certs:
  • Live (nginx uses): ${le_dir}/fullchain.pem , ${le_dir}/privkey.pem
  • Copied for user:   ${SSL_OUT_DIR}/fullchain.pem , ${SSL_OUT_DIR}/privkey.pem
DONE
}

# ---- entrypoint ----
main() {
  mkdir -p "$CONFIG_DIR"
  detect_platform
  wildcard_routes "$@"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi

