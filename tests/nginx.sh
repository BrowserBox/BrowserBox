#!/usr/bin/env bash
# wildcard_routes.sh
# Cross-platform (Linux + macOS) helper to validate wildcard DNS or mkcert, copy certs to ~/sslcerts/,
# and configure nginx to reverse-proxy 5 adjacent ports via 5 random subdomains.
# Default backend is HTTPS to 127.0.0.1:<port>; optionally HTTP if requested.
# set -euo pipefail # (kept disabled per your testing)
set -o errtrace
IFS=$'\n\t'
CORP_NAME="dosyago"
APP_NAME="bbpro"
CONFIG_DIR="${HOME}/.config/${CORP_NAME}/${APP_NAME}"
CONFIG_FILE="${CONFIG_DIR}/hosts.env"
SSL_OUT_DIR="${HOME}/sslcerts"
RETRY_MAX=${RETRY_MAX:-20}
RETRY_SLEEP=${RETRY_SLEEP:-6}
NGINX_SITE_STEM="" # set later to <user>-<mid_fqdn>.conf
# ---- Logging ----
log() { printf '[%s] %s\n' "$APP_NAME" "$*" >&2; }
die() {
  printf '[%s:error] %s\n' "$APP_NAME" "$*" >&2
  { full_cleanup >/dev/null 2>&1 || true; }
  exit 1
}
have() { command -v "$1" >/dev/null 2>&1; }
# ---- Global platform detection (run once) ----
OS_KIND="" # linux|darwin
DIST_ID="" # ubuntu|debian|rhel|centos|rocky|almalinux|macos|unknown
PKG_MGR="" # apt-get|dnf|yum|brew|empty
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
    local BREW_PREFIX
    BREW_PREFIX="$(brew --prefix 2>/dev/null || true)"
    [[ -n "$BREW_PREFIX" ]] || die "Homebrew is present but 'brew --prefix' failed."
    NGINX_ROOT_CONF="${BREW_PREFIX}/etc/nginx/nginx.conf"
    NGINX_SERVERS_DIR="${BREW_PREFIX}/etc/nginx/servers"
  else
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
  [[ -n "$PKG_MGR" ]] || die "No supported package manager found."
  case "$PKG_MGR" in
    apt-get) sudo apt-get update -y 1>&2 && sudo apt-get install -y "$@" 1>&2 ;;
    dnf) sudo dnf install -y "$@" 1>&2 ;;
    yum) sudo yum install -y "$@" 1>&2 ;;
    brew) brew install "$@" 1>&2 ;;
    *) die "Unsupported package manager: $PKG_MGR" ;;
  esac
}
ensure_dep() {
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
    dnf) [[ -n "$dnf_pkg" ]] && pkg_install "$dnf_pkg" ;;
    yum) [[ -n "$yum_pkg" ]] && pkg_install "$yum_pkg" ;;
    brew) [[ -n "$brew_pkg" ]] && pkg_install "$brew_pkg" ;;
  esac
  have "$want" || die "Missing dependency '$want' and failed to install it."
}
ensure_dns_tool() {
  if have dig; then echo "dig"; return 0; fi
  if have host; then echo "host"; return 0; fi
  case "$PKG_MGR" in
    apt-get) pkg_install dnsutils || true ;;
    dnf) pkg_install bind-utils || true ;;
    yum) pkg_install bind-utils || true ;;
    brew) pkg_install bind || true ;;
  esac
  if have dig; then echo "dig"; return 0; fi
  if have host; then echo "host"; return 0; fi
  die "Need a DNS lookup tool (dig or host)."
}
ensure_certbot() {
  have certbot && return 0
  case "$PKG_MGR" in
    apt-get) pkg_install certbot ;;
    dnf) pkg_install certbot ;;
    yum) pkg_install certbot ;;
    brew) pkg_install certbot ;;
    *) die "Cannot install certbot automatically on this system." ;;
  esac
  have certbot || die "certbot installation failed."
}
ensure_nginx() {
  if have nginx; then
    if [[ -n "$NGINX_SERVERS_DIR" ]]; then sudo mkdir -p "$NGINX_SERVERS_DIR"; fi
    if [[ -n "$NGINX_SITES_AVAILABLE" ]]; then sudo mkdir -p "$NGINX_SITES_AVAILABLE"; fi
    if [[ -n "$NGINX_SITES_ENABLED" ]]; then sudo mkdir -p "$NGINX_SITES_ENABLED"; fi
    if [[ -n "$NGINX_CONFD_DIR" ]]; then sudo mkdir -p "$NGINX_CONFD_DIR"; fi
    return 0
  fi
  case "$PKG_MGR" in
    apt-get) pkg_install nginx ;;
    dnf) pkg_install nginx ;;
    yum) pkg_install nginx ;;
    brew) brew install nginx 1>&2 ;;
    *) die "Cannot install nginx automatically on this system." ;;
  esac
  have nginx || die "nginx installation failed."
  if [[ -n "$NGINX_SERVERS_DIR" ]]; then sudo mkdir -p "$NGINX_SERVERS_DIR"; fi
  if [[ -n "$NGINX_SITES_AVAILABLE" ]]; then sudo mkdir -p "$NGINX_SITES_AVAILABLE"; fi
  if [[ -n "$NGINX_SITES_ENABLED" ]]; then sudo mkdir -p "$NGINX_SITES_ENABLED"; fi
  if [[ -n "$NGINX_CONFD_DIR" ]]; then sudo mkdir -p "$NGINX_CONFD_DIR"; fi
}
# ---- Local-mode helpers ----
is_special_tld() { case "$1" in *.local|*.lan|*.home|*.internal|*.test|localhost|*.localhost) return 0;; *) return 1;; esac; }
domain_has_public_a() {
  local d="$1" tool; tool="$(ensure_dns_tool)"
  if [[ "$tool" == "dig" ]]; then
    dig +time=2 +tries=1 +short A "$d" @1.1.1.1 2>/dev/null | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+'
  else
    host "$d" 2>/dev/null | awk '/has address/{print $NF}' | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+'
  fi
}
ensure_mkcert() {
  if have mkcert; then return 0; fi
  case "$PKG_MGR" in
    brew) brew install mkcert 1>&2 ;;
    apt-get) sudo apt-get update -y 1>&2 && sudo apt-get install -y mkcert libnss3-tools 1>&2 ;;
    dnf) { sudo dnf install -y mkcert nss-tools 1>&2 || { have brew && brew install mkcert nss 1>&2 || die "mkcert not available via dnf; install manually."; }; } ;;
    yum) { sudo yum install -y mkcert nss-tools 1>&2 || { have brew && brew install mkcert nss 1>&2 || die "mkcert not available via yum; install manually."; }; } ;;
    *) die "Don't know how to install mkcert on this platform." ;;
  esac
  have mkcert || die "mkcert installation failed."
}
gen_mkcert_into_sslout() {
  local d="$1"
  ensure_mkcert
  mkdir -p "${SSL_OUT_DIR}"
  chmod 700 "${SSL_OUT_DIR}"
  mkcert -install >/dev/null 2>&1 || true
  mkcert -cert-file "${SSL_OUT_DIR}/fullchain.pem" \
         -key-file "${SSL_OUT_DIR}/privkey.pem" \
         "${d}" "*.${d}" >/dev/stderr
  [[ -s "${SSL_OUT_DIR}/fullchain.pem" && -s "${SSL_OUT_DIR}/privkey.pem" ]] || die "mkcert failed to generate cert files"
  chmod 600 "${SSL_OUT_DIR}/fullchain.pem" "${SSL_OUT_DIR}/privkey.pem"
  log "mkcert-generated certs in ${SSL_OUT_DIR}/ (fullchain.pem, privkey.pem)."
}
# ---- /etc/hosts helpers ----
# Parse hostnames from hosts.env (ADDR_<PORT>=<host>)
parse_hosts_from_config() {
  [[ -f "$CONFIG_FILE" ]] || return 0
  awk -F= '/^ADDR_[0-9]+=/ { if ($2 != "") print $2 }' "$CONFIG_FILE" 2>/dev/null
}
# Add /etc/hosts entries (with metadata tag) — tag is informational only
write_hosts_entries() {
  local ip="$1"; shift
  local hosts_file="/etc/hosts"
  local tag="# ${APP_NAME} generated by ${USER}"
  local updated=0
  for h in "$@"; do
    # Remove any existing line containing this hostname as a token
    sudo awk -v RS='\n' -v ORS='\n' -v host="(^|[[:space:]])${h//./\\.}([[:space:]]|\$)" \
      '$0 !~ host' "$hosts_file" | sudo tee "$hosts_file".tmp >/dev/null && sudo mv "$hosts_file".tmp "$hosts_file"
    echo "${ip} ${h} ${tag}" | sudo tee -a "$hosts_file" >/dev/null
    updated=1
  done
  if (( updated )) && [[ "$(uname -s)" == "Darwin" ]]; then
    dscacheutil -flushcache >/dev/null 2>&1 || true
    killall -HUP mDNSResponder >/dev/null 2>&1 || true
  fi
  (( updated )) && log "Added host mappings to ${hosts_file}."
}
# Remove /etc/hosts lines strictly by hostnames found in hosts.env
remove_hosts_entries() {
  # args: list of hostnames; if none given, do nothing
  (("$#")) || return 0
  local hosts_file="/etc/hosts"
  # Build a single extended regex matching any target hostname as a token
  local pat=""
  for h in "$@"; do
    local eh="${h//./\\.}"
    pat+="${pat:+|}(^|[[:space:]])${eh}([[:space:]]|\$)"
  done
  [[ -n "$pat" ]] || return 0
  sudo awk -v RS='\n' -v ORS='\n' -v re="$pat" ' $0 !~ re ' "$hosts_file" | sudo tee "$hosts_file".tmp >/dev/null \
    && sudo mv "$hosts_file".tmp "$hosts_file"
  if [[ "$(uname -s)" == "Darwin" ]]; then
    dscacheutil -flushcache >/dev/null 2>&1 || true
    killall -HUP mDNSResponder >/dev/null 2>&1 || true
  fi
}
# ---- IP discovery ----
public_ip() {
  ensure_dep curl apt:curl dnf:curl yum:curl brew:curl
  local ip
  for url in "https://api.ipify.org" "https://ifconfig.me" "https://ipv4.icanhazip.com" "https://checkip.amazonaws.com"; do
    ip="$(curl -fsS --max-time 3 "$url" || true)"
    ip="${ip//$'\r'/}"; ip="${ip//$'\n'/}"
    if [[ "$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then printf '%s\n' "$ip"; return 0; fi
  done
  return 1
}
first_non_loopback_ipv4() {
  if have ip; then
    ip -4 addr show scope global 2>/dev/null | awk '/inet /{print $2}' | cut -d/ -f1 | head -n1; return 0
  fi
  if have ifconfig; then
    ifconfig 2>/dev/null | awk '/inet[[:space:]]/{print $2}' | grep -E '^[0-9]+\.[0-9]+' | grep -v '^127\.' | head -n1; return 0
  fi
  return 1
}
choose_machine_ip() {
  local ip=""
  if ip="$(public_ip)"; then printf '%s\n' "$ip"; return 0; fi
  log "Public IP not reachable; falling back to first non-loopback local IPv4."
  ip="$(first_non_loopback_ipv4)" || die "Could not determine a non-loopback IPv4."
  printf '%s\n' "$ip"
}
# ---- DNS helpers ----
dns_a_records() {
  local fqdn="$1" tool; tool="$(ensure_dns_tool)"
  if [[ "$tool" == "dig" ]]; then
    dig +short A "$fqdn" 2>/dev/null | grep -E '^[0-9]+\.[0-9]+\.[0-9]+' || true
  else
    host "$fqdn" 2>/dev/null | awk '/has address/{print $NF}' || true
  fi
}
random_label() { LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c 16; }
# ---- sed helper ----
_sed_inplace() { if [[ "$OS_KIND" == "darwin" ]]; then sed -i '' -E "$1" "$2"; else sed -i -E "$1" "$2"; fi; }
# ---- config integrity helpers (preserve non-mapping vars like HTTP_ONLY, DOMAIN, etc.) ----
_cfg_non_mapping_view() {
  [[ -f "$CONFIG_FILE" ]] || return 0
  awk -v app="$APP_NAME" -v user="$USER" '
    $0 ~ "^ADDR_[0-9]+=" { next } # drop numeric ADDR lines
    $0 ~ "^# --- "app":"user" mappings " { next } # drop our stamped header
    { print }
  ' "$CONFIG_FILE"
}
_cfg_fingerprint() {
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256
  elif command -v sha256sum >/dev/null 2>&1; then
    sha256sum
  elif command -v openssl >/dev/null 2>&1; then
    openssl dgst -sha256 | awk '{print $NF}'
  elif command -v md5 >/dev/null 2>&1; then
    md5 | awk '{print $NF}'
  else
    awk '{s+=length($0)} END{print "len:"s}'
  fi
}
# ---- Config mappings writer ----
write_mappings_to_config() {
  local p0="$1" p1="$2" p2="$3" p3="$4" p4="$5"
  local h0="$6" h1="$7" h2="$8" h3="$9" h4="${10}"
  mkdir -p "$CONFIG_DIR"; touch "$CONFIG_FILE"
  # Remove any prior mappings for these ports and the stamped header
  _sed_inplace "/^ADDR_${p0}=.*/d" "$CONFIG_FILE"
  _sed_inplace "/^ADDR_${p1}=.*/d" "$CONFIG_FILE"
  _sed_inplace "/^ADDR_${p2}=.*/d" "$CONFIG_FILE"
  _sed_inplace "/^ADDR_${p3}=.*/d" "$CONFIG_FILE"
  _sed_inplace "/^ADDR_${p4}=.*/d" "$CONFIG_FILE"
  _sed_inplace '/^# --- '"${APP_NAME}"':'"${USER}"' mappings .*/d' "$CONFIG_FILE"
  # Snapshot existing non-mapping content
  local non_mapping_content
  non_mapping_content="$(_cfg_non_mapping_view)"
  # Write new config: non-mapping content + new mappings
  {
    echo "$non_mapping_content"
    echo "# --- ${APP_NAME}:${USER} mappings $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
    # Write non-mapping variables if set
    [[ -n "${DOMAIN:-}" ]] && echo "DOMAIN=${DOMAIN}"
    [[ -n "${EMAIL:-}" ]] && echo "EMAIL=${EMAIL}"
    [[ -n "${HTTP_ONLY:-}" ]] && echo "HTTP_ONLY=${HTTP_ONLY}"
    [[ -n "${CENTER_PORT:-}" ]] && echo "CENTER_PORT=${CENTER_PORT}"
    [[ -n "${BACKEND_SCHEME:-}" ]] && echo "BACKEND_SCHEME=${BACKEND_SCHEME}"
    echo "ADDR_${p0}=${h0}"
    echo "ADDR_${p1}=${h1}"
    echo "ADDR_${p2}=${h2}"
    echo "ADDR_${p3}=${h3}"
    echo "ADDR_${p4}=${h4}"
  } > "$CONFIG_FILE".tmp
  mv "$CONFIG_FILE".tmp "$CONFIG_FILE"
  log "Wrote host mappings and configuration to ${CONFIG_FILE}"
}
# ---- Cleanup (standalone and pre-clean) ----
cleanup_user_nginx() {
  # remove all confs for this user created by this tool (user-prefixed filenames)
  local pattern="${USER}-*.conf"
  local removed=0
  if [[ -n "$NGINX_SERVERS_DIR" && -d "$NGINX_SERVERS_DIR" ]]; then
    mapfile -t files < <(sudo /bin/ls -1 "${NGINX_SERVERS_DIR}/${pattern}" 2>/dev/null || true)
    if ((${#files[@]})); then sudo rm -f "${files[@]}" && removed=1; fi
  fi
  if [[ -n "$NGINX_SITES_AVAILABLE" && -d "$NGINX_SITES_AVAILABLE" ]]; then
    mapfile -t files < <(sudo /bin/ls -1 "${NGINX_SITES_AVAILABLE}/${pattern}" 2>/dev/null || true)
    if ((${#files[@]})); then
      for f in "${files[@]}"; do
        sudo rm -f "$f"
        local bn; bn="$(basename "$f")"
        [[ -n "$NGINX_SITES_ENABLED" && -d "$NGINX_SITES_ENABLED" ]] && sudo rm -f "${NGINX_SITES_ENABLED}/${bn}" 2>/dev/null || true
      done
      removed=1
    fi
  fi
  if [[ -n "$NGINX_CONFD_DIR" && -d "$NGINX_CONFD_DIR" ]]; then
    mapfile -t files < <(sudo /bin/ls -1 "${NGINX_CONFD_DIR}/${pattern}" 2>/dev/null || true)
    if ((${#files[@]})); then sudo rm -f "${files[@]}" && removed=1; fi
  fi
  if (( removed )); then
    sudo nginx -t >/dev/null 2>&1 || true
    if have systemctl; then
      sudo systemctl reload nginx 2>/dev/null || true
    elif [[ "$OS_KIND" == "darwin" ]] && have brew; then
      sudo brew services restart nginx >/dev/null 2>&1 || true
    else
      sudo nginx -s reload 2>/dev/null || true
    fi
    log "Removed existing nginx sites for user ${USER}"
  fi
}
cleanup_user_hosts_and_config() {
  # Primary: read hostnames from config and remove those from /etc/hosts
  mapfile -t hosts < <(parse_hosts_from_config)
  if ((${#hosts[@]})); then
    remove_hosts_entries "${hosts[@]}"
  else
    log "No ADDR_* hostnames found in ${CONFIG_FILE}; skipping /etc/hosts removal."
  fi
  # Remove only ADDR_* lines (numeric) and our stamped header; preserve everything else
  if [[ -f "$CONFIG_FILE" ]]; then
    _sed_inplace '/^ADDR_[0-9]+=.*/d' "$CONFIG_FILE"
    _sed_inplace '/^# --- '"${APP_NAME}"':'"${USER}"' mappings .*/d' "$CONFIG_FILE"
  fi
  log "Cleared ADDR_* mappings for user ${USER} from ${CONFIG_FILE}"
}
full_cleanup() {
  detect_platform
  ensure_nginx
  cleanup_user_nginx
  cleanup_user_hosts_and_config
}
# ---- Nginx writer (user-prefixed filename; standard locations) ----
enable_nginx_site() {
  local config_text="$1"
  local mid_fqdn="$2"
  local filename="${USER}-${mid_fqdn}.conf"
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
  sudo nginx -t >/dev/null 2>&1 || die "nginx config test failed."
  if have systemctl; then
    sudo systemctl reload nginx >/dev/null 2>&1 || die "nginx reload failed."
  elif [[ "$OS_KIND" == "darwin" ]] && have brew; then
    sudo brew services restart nginx >/dev/null 2>&1 || die "nginx restart failed."
  else
    sudo nginx -s reload >/dev/null 2>&1 || die "nginx reload failed."
  fi
  log "Installed nginx site: ${target_file}"
}
# ---- Cert helpers ----
le_live_dir_for_domain() { local d="$1" p="/etc/letsencrypt/live/${d}"; [[ -d "$p" ]] && printf '%s\n' "$p" || true; }
copy_certs_to_home() {
  local live="$1"
  mkdir -p "$SSL_OUT_DIR"; chmod 700 "$SSL_OUT_DIR"
  cp -f "${live}/fullchain.pem" "${SSL_OUT_DIR}/fullchain.pem"
  cp -f "${live}/privkey.pem" "${SSL_OUT_DIR}/privkey.pem"
  chmod 600 "${SSL_OUT_DIR}/fullchain.pem" "${SSL_OUT_DIR}/privkey.pem"
  log "Copied certs to ${SSL_OUT_DIR}/ (fullchain.pem, privkey.pem)."
}
# ---- Main worker ----
# ---- Main worker ----
wildcard_routes() {
  local domain="" email="" center_port=""
  local backend_scheme="" # "https" (default) or "http"
  local WRITE_HOSTS="true" # optional flag
  local DO_CLEANUP_ONLY="false"
  local SKIP_PRECLEAN="false"
  # traps: on INT/TERM, run cleanup to avoid half-config
  trap 'log "Interrupted; running cleanup..."; full_cleanup; exit 130' INT TERM
  while (($#)); do
    case "$1" in
      --cleanup) DO_CLEANUP_ONLY="true"; shift;;
      --no-preclean) SKIP_PRECLEAN="true"; shift;;
      -d|--domain) domain="${2:-}"; shift 2;;
      -e|--email) email="${2:-}"; shift 2;;
      -p|--center-port) center_port="${2:-}"; shift 2;;
      --backend) backend_scheme="${2:-}"; shift 2;; # http|https
      --backend-http|--backend-http-only)
                         backend_scheme="http"; shift;;
      --write-hosts) WRITE_HOSTS="true"; shift;;
      -h|--help)
        cat >&2 <<USAGE
Usage:
  $0 --cleanup
  $0 --domain example.com --email you@example.com --center-port 8080 [--backend https|http] [--no-preclean]
Behavior:
  * Per-user isolation: nginx file is "\$USER-<random>.\$DOMAIN.conf"
  * Pre-clean (default): remove this user's previous nginx sites, /etc/hosts entries (by hosts.env), and ADDR_* lines.
  * Local mode (.local/.lan/.home/.internal/.test/localhost): mkcert; optional /etc/hosts (tagged "# bbpro generated by <user>").
  * Public mode: discover public IP, verify wildcard DNS, run certbot (DNS-01).
  * Writes ADDR_<PORT>=<hostname> lines (no scheme) into:
      ${CONFIG_FILE}
  * Standalone cleanup:
      $0 --cleanup
Notes:
  - We keep tags in /etc/hosts for human clarity but NEVER use them for automated removals.
USAGE
        return 0;;
      *) die "Unknown argument: $1";;
    esac
  done
  mkdir -p "$CONFIG_DIR"
  # Create config file if it doesn't exist, then source it.
  [[ -f "$CONFIG_FILE" ]] || : >"$CONFIG_FILE"
  # Load defaults from hosts.env with explicit precedence:
  # CLI > exported env > config file values
  # shellcheck disable=SC1090
  . "$CONFIG_FILE"
  domain="${domain:-${DOMAIN:-$domain}}"
  email="${email:-${EMAIL:-$email}}"
  center_port="${center_port:-${CENTER_PORT:-$center_port}}"
  backend_scheme="${backend_scheme:-${BACKEND_SCHEME:-$backend_scheme}}"
  if [[ "${HTTP_ONLY:-}" == "true" && -z "${backend_scheme:-}" ]]; then backend_scheme="http"; fi
  WRITE_HOSTS="${WRITE_HOSTS:-${WRITE_HOSTS:-true}}"

  detect_platform
  if [[ "$DO_CLEANUP_ONLY" == "true" ]]; then
    full_cleanup
    log "Cleanup complete."
    return 0
  fi
  [[ -n "${domain:-}" ]] || die "Missing --domain and no DOMAIN in ${CONFIG_FILE}."
  [[ -n "${email:-}" ]] || die "Missing --email and no EMAIL in ${CONFIG_FILE}."
  [[ -n "${center_port:-}" ]] || die "Missing --center-port and no CENTER_PORT in ${CONFIG_FILE}."
  [[ "$center_port" =~ ^[0-9]+$ ]] || die "--center-port must be an integer."
  (( center_port >= 1 && center_port <= 65535 )) || die "Center port out of range 1..65535."
  backend_scheme="${backend_scheme:-https}"
  [[ "$backend_scheme" == "http" || "$backend_scheme" == "https" ]] || die "--backend must be 'http' or 'https'"
  log "Backend scheme: ${backend_scheme^^}"
  ensure_dep curl apt:curl dnf:curl yum:curl brew:curl
  ensure_dns_tool >/dev/null
  ensure_nginx
  # Pre-clean previous run for this user (default)
  if [[ "$SKIP_PRECLEAN" != "true" ]]; then
    log "Pre-cleaning previous ${APP_NAME} config for user ${USER}..."
    cleanup_user_nginx
    # **MODIFICATION**: We no longer need cleanup_user_hosts_and_config because we are overwriting the file.
    # We just need to clear the /etc/hosts entries.
    mapfile -t hosts < <(parse_hosts_from_config)
    if ((${#hosts[@]})); then
      remove_hosts_entries "${hosts[@]}"
    fi
  fi
  # Local/public mode detection
  local LOCAL_MODE=0
  if is_special_tld "$domain"; then
    LOCAL_MODE=1; log "Local mode: '${domain}' special TLD → mkcert."
  elif ! domain_has_public_a "$domain"; then
    LOCAL_MODE=1; log "Local mode: '${domain}' has no public A → mkcert."
  fi
  # Public IP for public mode
  local ip=""
  if (( LOCAL_MODE == 0 )); then ip="$(choose_machine_ip)"; log "Chosen IP: ${ip}"; fi
  # Certs
  local le_dir
  if (( LOCAL_MODE == 0 )); then
    local label fqdn try=1 ok="no"; label="$(random_label)"; fqdn="${label}.${domain}"
    log "Verifying wildcard DNS: expecting ${fqdn} -> ${ip}"
    while (( try <= RETRY_MAX )); do
      mapfile -t addrs < <(dns_a_records "$fqdn")
      if ((${#addrs[@]})) && printf '%s\n' "${addrs[@]}" | grep -Fxq "$ip"; then ok="yes"; break; fi
      if (( try == 1 )); then
        cat >&2 <<GUIDE
Action needed (only if this keeps failing):
  • Ensure wildcard A record: *.${domain} -> ${ip}
  • Ensure apex A record: ${domain} -> ${ip}
  • If using IPv6, use AAAA records accordingly.
GUIDE
      fi
      log "Attempt ${try}/${RETRY_MAX}: not resolved yet; retrying in ${RETRY_SLEEP}s..."
      ((try++)); sleep "$RETRY_SLEEP"
    done
    [[ "$ok" == "yes" ]] || die "Wildcard DNS did not resolve to ${ip} after ${RETRY_MAX} tries."
    ensure_certbot
    le_dir="$(le_live_dir_for_domain "$domain")"
    if [[ -z "$le_dir" ]]; then
      log "Requesting Let's Encrypt wildcard (*.${domain}, ${domain}) via DNS-01..."
      sudo certbot certonly --manual --preferred-challenges dns \
        -d "*.${domain}" -d "${domain}" \
        --agree-tos -m "${email}" --no-eff-email --manual-public-ip-logging-ok 1>&2
      le_dir="$(le_live_dir_for_domain "$domain")"; [[ -d "$le_dir" ]] || die "certbot finished but live dir missing."
    else
      log "Existing LE cert found at ${le_dir}; skipping issuance."
    fi
    copy_certs_to_home "$le_dir"
  else
    log "Generating locally trusted certificate via mkcert."
    gen_mkcert_into_sslout "$domain"
    le_dir="${SSL_OUT_DIR}"
  fi
  # Ports & random hosts
  local p0 p1 p2 p3 p4
  p0=$(( center_port - 2 )); p1=$(( center_port - 1 )); p2=$(( center_port ))
  p3=$(( center_port + 1 )); p4=$(( center_port + 2 ))
  for p in "$p0" "$p1" "$p2" "$p3" "$p4"; do (( p >= 1 && p <= 65535 )) || die "Adjacent port ${p} out of range."; done
  local l0 l1 l2 l3 l4
  l0="$(random_label)"; l1="$(random_label)"; l2="$(random_label)"; l3="$(random_label)"; l4="$(random_label)"
  local h0="${l0}.${domain}" h1="${l1}.${domain}" h2="${l2}.${domain}" h3="${l3}.${domain}" h4="${l4}.${domain}"
  # Optional: /etc/hosts in local mode (tag is informational only)
  if (( LOCAL_MODE == 1 )) && [[ "${WRITE_HOSTS:-}" == "true" ]]; then
    write_hosts_entries "127.0.0.1" "$h0" "$h1" "$h2" "$h3" "$h4"
  fi
  # Nginx config (HTTPS listeners → HTTP/HTTPS backends)
  local cert="${le_dir}/fullchain.pem" key="${le_dir}/privkey.pem" bscheme="$backend_scheme"
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
server { listen 443 ssl; server_name ${h0}; ssl_certificate ${cert}; ssl_certificate_key ${key}; location / { proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto https; ${proxy_ssl_directives} proxy_pass ${bscheme}://127.0.0.1:${p0}; } }
server { listen 443 ssl; server_name ${h1}; ssl_certificate ${cert}; ssl_certificate_key ${key}; location / { proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto https; ${proxy_ssl_directives} proxy_pass ${bscheme}://127.0.0.1:${p1}; } }
server { listen 443 ssl; server_name ${h2}; ssl_certificate ${cert}; ssl_certificate_key ${key}; location / { proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto https; ${proxy_ssl_directives} proxy_pass ${bscheme}://127.0.0.1:${p2}; } }
server { listen 443 ssl; server_name ${h3}; ssl_certificate ${cert}; ssl_certificate_key ${key}; location / { proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto https; ${proxy_ssl_directives} proxy_pass ${bscheme}://127.0.0.1:${p3}; } }
server { listen 443 ssl; server_name ${h4}; ssl_certificate ${cert}; ssl_certificate_key ${key}; location / { proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto https; ${proxy_ssl_directives} proxy_pass ${bscheme}://127.0.0.1:${p4}; } }
EOF
  enable_nginx_site "$NCONF" "$mid_fqdn"

  # **FIX**: Atomically write the new config file, persisting the effective settings.
  {
    echo "DOMAIN=${domain}"
    echo "EMAIL=${email}"
    echo "CENTER_PORT=${center_port}"
    echo "BACKEND_SCHEME=${backend_scheme}"
    echo
    echo "# --- ${APP_NAME}:${USER} mappings $(date -u +'%Y-%m-%dT%H:%M:%SZ')"
    echo "ADDR_${p0}=${h0}"
    echo "ADDR_${p1}=${h1}"
    echo "ADDR_${p2}=${h2}"
    echo "ADDR_${p3}=${h3}"
    echo "ADDR_${p4}=${h4}"
  } > "${CONFIG_FILE}.tmp" && mv "${CONFIG_FILE}.tmp" "${CONFIG_FILE}"
  log "Wrote effective configuration to ${CONFIG_FILE}"

  { # Human-facing summary → STDERR
    echo
    echo "✅ All set."
    echo
    echo "Host → Port mappings (HTTPS listeners → ${bscheme^^} backends):"
    echo " https://${h0} → ${bscheme}://127.0.0.1:${p0}"
    echo " https://${h1} → ${bscheme}://127.0.0.1:${p1}"
    echo " https://${h2} → ${bscheme}://127.0.0.1:${p2}"
    echo " https://${h3} → ${bscheme}://127.0.0.1:${p3}"
    echo " https://${h4} → ${bscheme}://127.0.0.1:${p4}"
    echo
    echo "Config updated: ${CONFIG_FILE}"
    echo
    echo "Certs:"
    echo " • Live (nginx uses): ${le_dir}/fullchain.pem , ${le_dir}/privkey.pem"
    echo " • Copied for user: ${SSL_OUT_DIR}/fullchain.pem , ${SSL_OUT_DIR}/privkey.pem"
  } >&2
  # Machine-facing success: only absolute path on STDOUT
  printf '%s\n' "$(cd "$(dirname "$CONFIG_FILE")" && pwd)/$(basename "$CONFIG_FILE")"
}
# ---- entrypoint ----
main() {
  mkdir -p "$CONFIG_DIR"
  wildcard_routes "$@"
}
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@" || exit $?
fi
