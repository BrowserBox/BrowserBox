# other funcs ....
# other funcs ....


ensure_setup_tor() {
    local user="$1"
    local tor_is_running=false
    if [[ "$(uname -s)" == "Darwin" ]]; then
        brew services list | grep -q "tor.*started" && tor_is_running=true
    else
        systemctl is-active tor >/dev/null 2>&1 && tor_is_running=true
    fi
    if ! $tor_is_running || ! command -v tor >/dev/null 2>&1; then
        printf "${YELLOW}Setting up Tor for user $user...${NC}\n"
        $SUDO bash -c "PATH=/usr/local/bin:\$PATH setup_tor '$user'" || { printf "${RED}Failed to setup Tor for $user${NC}\n"; exit 1; }
    fi
}

install() {
    banner
    check_agreement
    pre_install || return 0
    load_config
    ensure_deps
    printf "${GREEN}Installing BrowserBox CLI (bbx)...${NC}\n"
    mkdir -p "$BBX_HOME/BrowserBox" || { printf "${RED}Failed to create $BBX_HOME/BrowserBox${NC}\n"; exit 1; }
    printf "${YELLOW}Fetching BrowserBox repository...${NC}\n"
    $SUDO rm -rf $BBX_HOME/BrowserBox*
    curl -sL "$REPO_URL/archive/refs/heads/${branch}.zip" -o "$BBX_HOME/BrowserBox.zip" || { printf "${RED}Failed to download BrowserBox repo${NC}\n"; exit 1; }
    unzip -o -q "$BBX_HOME/BrowserBox.zip" -d "$BBX_HOME/BrowserBox-zip" || { printf "${RED}Failed to extract BrowserBox repo${NC}\n"; exit 1; }
    mv $BBX_HOME/BrowserBox-zip/BrowserBox-${branch} $BBX_HOME/BrowserBox 
    $SUDO rm -rf $BBX_HOME/BrowserBox-zip
    $SUDO rm -f $BBX_HOME/BrowserBox.zip
    chmod +x "$BBX_HOME/BrowserBox/deploy-scripts/global_install.sh" || { printf "${RED}Failed to make global_install.sh executable${NC}\n"; exit 1; }
    local default_hostname=$(get_system_hostname)

    if [ -z "$BBX_HOSTNAME" ]; then
      if [[ -n "$BBX_TEST_AGREEMENT" ]]; then 
        BBX_HOSTNAME="localhost"
      else
        read -r -p "Enter hostname (default: $default_hostname): " BBX_HOSTNAME
      fi
    fi
    BBX_HOSTNAME="${BBX_HOSTNAME:-$default_hostname}"
    if is_local_hostname "$BBX_HOSTNAME"; then
        ensure_hosts_entry "$BBX_HOSTNAME"
    fi
    if [ -z "$EMAIL" ]; then
      if [[ -n "$BBX_TEST_AGREEMENT" ]]; then 
        EMAIL=""
      else
        read -r -p "Enter your email for Let's Encrypt (optional for $BBX_HOSTNAME): " EMAIL
      fi
    fi
    
    if [ -t 0 ] && [[ -z "$BBX_TEST_AGREEMENT" ]]; then
        printf "${YELLOW}Running BrowserBox installer interactively...${NC}\n"
        cd "$BBX_HOME/BrowserBox" && ./deploy-scripts/global_install.sh "$BBX_HOSTNAME" "$EMAIL"
    else
        printf "${YELLOW}Running BrowserBox installer non-interactively...${NC}\n"
        cd "$BBX_HOME/BrowserBox" && (yes | ./deploy-scripts/global_install.sh "$BBX_HOSTNAME" "$EMAIL")
    fi
    [ $? -eq 0 ] || { printf "${RED}Installation failed${NC}\n"; exit 1; }
    printf "${YELLOW}Updating npm and pm2...${NC}\n"
    ensure_nvm
    npm i -g npm@latest
    npm i -g pm2@latest
    timeout 5s pm2 update
    printf "${YELLOW}Installing bbx command globally...${NC}\n"
    if [[ ":$PATH:" == *":/usr/local/bin:"* ]] && $SUDO test -w /usr/local/bin; then
      COMMAND_DIR="/usr/local/bin"
    elif $SUDO test -w /usr/bin; then
      COMMAND_DIR="/usr/bin"
    else
      COMMAND_DIR="$HOME/.local/bin"
      mkdir -p "$COMMAND_DIR"
    fi
    BBX_BIN="${COMMAND_DIR}/bbx"
    $SUDO curl -sL "$REPO_URL/raw/${branch}/bbx.sh" -o "$BBX_BIN" || { printf "${RED}Failed to install bbx${NC}\n"; $SUDO rm -f "$BBX_BIN"; exit 1; }
    $SUDO chmod +x "$BBX_BIN"
    save_config
    printf "${GREEN}bbx v$BBX_VERSION installed successfully! Run 'bbx --help' for usage.${NC}\n"
}

setup() {
  load_config
  ensure_deps

  local port="${PORT:-$(find_free_port_block)}"
  local hostname="${BBX_HOSTNAME:-$(get_system_hostname)}"
  local token="${TOKEN}"

  while [ $# -gt 0 ]; do
    case "$1" in
      --port|-p)
        port="$2"
        shift 2
        ;;
      --hostname|-h)
        hostname="$2"
        shift 2
        ;;
      --token|-t)
        token="$2"
        shift 2
        ;;
      *)
        printf "${RED}Unknown option: $1${NC}\n"
        printf "Usage: bbx setup [--port|-p <port>] [--hostname|-h <hostname>] [--token|-t <token>]\n"
        exit 1
        ;;
    esac
  done

  if ! [[ "$port" =~ ^[0-9]+$ ]] || [ "$port" -lt 1024 ] || [ "$port" -gt 65535 ]; then
    printf "${RED}Invalid port: $port. Must be between 1024 and 65535.${NC}\n"
    exit 1
  fi

  PORT="$port"
  BBX_HOSTNAME="$hostname"
  TOKEN="${token:-$(openssl rand -hex 16)}"

  printf "${YELLOW}Setting up BrowserBox on $hostname:$port...${NC}\n"
  if ! is_local_hostname "$hostname"; then
    printf "${BLUE}DNS Note:${NC} Ensure an A/AAAA record points from $hostname to this machine's IP.\n"
    curl -sL "$REPO_URL/raw/${branch}/deploy-scripts/wait_for_hostname.sh" -o "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh" || { printf "${RED}Failed to download wait_for_hostname.sh${NC}\n"; exit 1; }
    chmod +x "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh"
    "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh" "$hostname" || { printf "${RED}Hostname $hostname not resolving${NC}\n"; exit 1; }
  else
    ensure_hosts_entry "$hostname"
  fi

  # Ensure we have a valid license key
  if ! validate_license_key; then
    printf "${YELLOW}Setting up a new license key...${NC}\n"
    validate_license_key "true"  # Force prompt if invalid or missing
  fi

  setup_bbpro --port "$port" --token "$TOKEN" || { printf "${RED}Port range $((port-2))-$((port+2)) not free${NC}\n"; exit 1; }
  for i in {-2..2}; do
    test_port_access $((port+i)) || { printf "${RED}Adjust firewall to allow ports $((port-2))-$((port+2))/tcp${NC}\n"; exit 1; }
  done
  test_port_access $((port-3000)) || { printf "${RED}CDP port $((port-3000)) blocked${NC}\n"; exit 1; }
  setup_bbpro --port "$port" --token "$TOKEN" > "$BB_CONFIG_DIR/login.link" 2>/dev/null || { printf "${RED}Setup failed${NC}\n"; exit 1; }
  source "$BB_CONFIG_DIR/test.env" && PORT="${APP_PORT:-$port}" && TOKEN="${LOGIN_TOKEN:-$TOKEN}" || { printf "${YELLOW}Warning: test.env not found${NC}\n"; }
  save_config
  printf "${GREEN}Setup complete.${NC}\n"
  draw_box "Login Link: $(cat "$BB_CONFIG_DIR/login.link" 2>/dev/null || echo "https://$hostname:$port/login?token=$TOKEN")"
}

run() {
  banner
  load_config

  # Ensure setup has been run
  if [ -z "$PORT" ] || [ -z "$BBX_HOSTNAME" ] || [ -z "$LICENSE_KEY" ] || [[ ! -f "$BB_CONFIG_DIR/test.env" ]] ; then
    printf "${YELLOW}BrowserBox not fully set up. Running 'bbx setup' first...${NC}\n"
    setup
    load_config
  fi

  # Default values (should be set by setup, but fallback for safety)
  local port="${PORT}"
  local hostname="${BBX_HOSTNAME}"

  # Parse arguments to override if provided
  while [ $# -gt 0 ]; do
    case "$1" in
      --port|-p)
        port="$2"
        shift 2
        ;;
      --hostname|-h)
        hostname="$2"
        shift 2
        ;;
      *)
        printf "${RED}Unknown option or extra argument: $1${NC}\n"
        printf "Usage: bbx run [--port|-p <port>] [--hostname|-h <hostname>]\n"
        exit 1
        ;;
    esac
  done

  PORT="$port"
  BBX_HOSTNAME="$hostname"
  printf "${YELLOW}Starting BrowserBox on $hostname:$port...${NC}\n"
  if ! is_local_hostname "$hostname"; then
    printf "${BLUE}DNS Note:${NC} Ensure an A/AAAA record points from $hostname to this machine's IP.\n"
    "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh" "$hostname" || { printf "${RED}Hostname $hostname not resolving${NC}\n"; exit 1; }
  else
    ensure_hosts_entry "$hostname"
  fi

  # Validate existing license key
  export LICENSE_KEY;
  if ! bbcertify >/dev/null 2>&1; then
    printf "${RED}License key invalid or missing. Run 'bbx setup' or 'bbx certify' to configure a valid key.${NC}\n"
    exit 1
  fi
  printf "${GREEN}Certification complete.${NC}\n"

  bbpro &>/dev/null || { printf "${RED}Failed to start${NC}\n"; exit 1; }
  source "$BB_CONFIG_DIR/test.env" && PORT="${APP_PORT:-$port}" && TOKEN="${LOGIN_TOKEN:-$TOKEN}" || { printf "${YELLOW}Warning: test.env not found${NC}\n"; }
  local login_link=$(cat "$BB_CONFIG_DIR/login.link" 2>/dev/null || echo "https://$hostname:$port/login?token=$TOKEN")
  draw_box "Login Link: $login_link"
  save_config
}

tor_run() {
  banner
  load_config
  ensure_deps

  local anonymize=true onion=true
  while [ $# -gt 0 ]; do
    case "$1" in
      --anonymize) anonymize=true; shift ;;
      --no-anonymize) anonymize=false; shift ;;
      --onion) onion=true; shift ;;
      --no-onion) onion=false; shift ;;
      *) printf "${RED}Unknown option: $1${NC}\n"; exit 1 ;;
    esac
  done
  if ! $anonymize && ! $onion; then
    printf "${RED}ERROR: At least one of --anonymize or --onion must be enabled.${NC}\n"
    exit 1
  fi

  # Trigger setup if not fully configured
  if [ -z "$PORT" ] || [ -z "$BBX_HOSTNAME" ] || [ -z "$LICENSE_KEY" ] || [[ ! -f "$BB_CONFIG_DIR/test.env" ]] ; then
    printf "${YELLOW}BrowserBox not fully set up. Running 'bbx setup' first...${NC}\n"
    setup
    load_config
  fi

  [ -n "$TOKEN" ] || TOKEN=$(openssl rand -hex 16)
  printf "${YELLOW}Starting BrowserBox with Tor...${NC}\n"
  ensure_setup_tor "$(whoami)"

  # Determine Tor group and cookie file dynamically
  if [[ "$(uname -s)" == "Darwin" ]]; then
      TOR_GROUP="admin"  # Homebrew default
      TORDIR="$(brew --prefix)/var/lib/tor"
      COOKIE_AUTH_FILE="$TORDIR/control_auth_cookie"
  else
      TORDIR="/var/lib/tor"
      COOKIE_AUTH_FILE="$TORDIR/control_auth_cookie"
      TOR_GROUP=$(ls -ld "$TORDIR" | awk '{print $4}' 2>/dev/null)
      if [[ -z "$TOR_GROUP" || "$TOR_GROUP" == "root" ]]; then
        TOR_GROUP=$(getent group | grep -E 'tor|debian-tor|toranon' | cut -d: -f1 | head -n1)
      fi
      if [[ -z "$TOR_GROUP" ]]; then
        TOR_GROUP="${TOR_GROUP:-debian-tor}"  # Allow env override
        printf "${YELLOW}Warning: Could not detect Tor group. Using default: $TOR_GROUP. Set TOR_GROUP env var if incorrect.${NC}\n"
      fi
  fi

  local user="$(whoami)"
  local in_tor_group=false
  if id | grep -qw "$TOR_GROUP"; then
      in_tor_group=true
      printf "${GREEN}User $user already in group $TOR_GROUP${NC}\n"
  elif ! command -v sg >/dev/null 2>&1; then
      printf "${YELLOW}sg not found and $user not in $TOR_GROUP, may fail without Tor group access${NC}\n"
  fi

    local setup_cmd="setup_bbpro --port $PORT --token $TOKEN"
    if $anonymize; then
        setup_cmd="$setup_cmd --ontor"
    fi
    if ! $onion && ! is_local_hostname "$BBX_HOSTNAME"; then
        "$BBX_HOME/BrowserBox/deploy-scripts/wait_for_hostname.sh" "$BBX_HOSTNAME" || { printf "${RED}Hostname $BBX_HOSTNAME not resolving${NC}\n"; exit 1; }
    elif ! $onion; then
        ensure_hosts_entry "$BBX_HOSTNAME"
    fi
    $setup_cmd || { printf "${RED}Setup failed${NC}\n"; exit 1; }
    source "$BB_CONFIG_DIR/test.env" && PORT="${APP_PORT:-$PORT}" && TOKEN="${LOGIN_TOKEN:-$TOKEN}" || { printf "${YELLOW}Warning: test.env not found${NC}\n"; }
    # Validate existing license key
    export LICENSE_KEY
    if ! bbcertify >/dev/null 2>&1; then
      printf "${RED}License key invalid or missing. Run 'bbx setup' or 'bbx certify' to configure a valid key.${NC}\n"
      exit 1
    fi
    printf "${GREEN}Certification complete.${NC}\n"

    local login_link=""
    if $onion; then
        printf "${YELLOW}Running as onion site...${NC}\n"
        if $in_tor_group; then
            # Run torbb directly if user is in TOR_GROUP
            login_link="$(torbb)"
        elif command -v sg >/dev/null 2>&1; then
            # Use safe heredoc with env
            export BB_CONFIG_DIR
            login_link="$($SUDO -u ${SUDO_USER:-$USER} sg "$TOR_GROUP" -c "env PATH=\"$PATH\" BB_CONFIG_DIR=\"$BB_CONFIG_DIR\" bash -cl torbb")"
        else
            # Fallback without sg
            login_link="$(torbb)"
        fi
        [ $? -eq 0 ] && [ -n "$login_link" ] || { printf "${RED}torbb failed${NC}\n"; tail -n 5 "$BB_CONFIG_DIR/torbb_errors.txt"; echo "$login_link"; exit 1; }
        TEMP_HOSTNAME=$(echo "$login_link" | sed 's|https://\([^/]*\)/login?token=.*|\1|')
    else
        for i in {-2..2}; do
            test_port_access $((PORT+i)) || { printf "${RED}Adjust firewall for ports $((PORT-2))-$((PORT+2))/tcp${NC}\n"; exit 1; }
        done
        test_port_access $((PORT-3000)) || { printf "${RED}CDP port $((PORT-3000)) blocked${NC}\n"; exit 1; }
        bbpro || { printf "${RED}Failed to start${NC}\n"; exit 1; }
        login_link=$(cat "$BB_CONFIG_DIR/login.link" 2>/dev/null || echo "https://$TEMP_HOSTNAME:$PORT/login?token=$TOKEN")
    fi
    sleep 2
    printf "${GREEN}BrowserBox with Tor started.${NC}\n"
    draw_box "Login Link: $login_link"
    save_config

    # Tor status display functions
    get_tor_status() {
        local cookie_hex=""
        if [ -r "$COOKIE_AUTH_FILE" ]; then
            cookie_hex=$(xxd -u -p -c32 "$COOKIE_AUTH_FILE" | tr -d '\n')
        elif $SUDO test -r "$COOKIE_AUTH_FILE"; then
            cookie_hex=$($SUDO xxd -u -p -c32 "$COOKIE_AUTH_FILE" | tr -d '\n')
        fi
        if [ -z "$cookie_hex" ]; then
            printf "${YELLOW}Warning: Failed to read Tor cookie${NC}\n" >&2
            return 1
        fi

        local cmd=$(printf 'AUTHENTICATE %s\r\nGETINFO status/bootstrap-phase\r\nQUIT\r\n' "$cookie_hex")
        local response=$(echo -e "$cmd" | nc -w 5 127.0.0.1 9051 2>/dev/null)

        if [ -z "$response" ]; then
            printf "${YELLOW}Warning: Tor control port not responding${NC}\n" >&2
            return 1
        fi

        local status_line=$(echo "$response" | grep "250-status/bootstrap-phase=")
        if [ -z "$status_line" ]; then
            printf "${YELLOW}Warning: Invalid response from Tor control port${NC}\n" >&2
            return 1
        fi

        if echo "$status_line" | grep -q "SUMMARY=\"Done\""; then
            echo "100"
        else
            local progress=$(echo "$status_line" | grep -o "PROGRESS=[0-9]*" | cut -d'=' -f2)
            [ -n "$progress" ] && echo "$progress" || echo "0"
        fi
    }

    draw_progress_bar() {
        local percent=$1
        local bar_width=30
        local filled=$((percent * bar_width / 100))
        local empty=$((bar_width - filled))

        printf "\rTor Progress: [${GREEN}"
        for ((i = 0; i < filled; i++)); do printf "█"; done
        printf "${NC}"
        for ((i = 0; i < empty; i++)); do printf " "; done
        printf "] %3d%%" "$percent"
    }

    show_tor_status() {
        local max_attempts=240  # 120 seconds total with 0.5s sleep
        local poll_interval=10  # Check every 5 seconds (10 * 0.5s)
        local spinner_chars="|/-\|"
        local attempts=0
        local counter=0
        local spinner_idx=0
        local percent=0

        printf "${YELLOW}Checking Tor connection status...${NC}\n" >&2
        while [ $attempts -lt "$max_attempts" ]; do
            if [ $((counter % 2)) -eq 0 ]; then
                spinner_idx=$(( (spinner_idx + 1) % 4 ))
                local spinner="${spinner_chars:$spinner_idx:1}"
            fi

            if [ $((counter % poll_interval)) -eq 0 ]; then
                percent=$(get_tor_status) || percent=0
                attempts=$((attempts + 1))
                if [ "$percent" -eq 100 ]; then
                    draw_progress_bar 100
                    printf "\n${GREEN}Tor is fully connected and ready.${NC}\n" >&2
                    return 0
                fi
            fi

            draw_progress_bar "$percent"
            sleep 0.5
            counter=$((counter + 1))
        done

        draw_progress_bar "$percent"
        printf "\n${YELLOW}Warning: Tor not fully connected after 120 seconds (progress at $percent%%).${NC}\n" >&2
        printf "${YELLOW}BrowserBox may still work, but Tor connectivity might be incomplete.${NC}\n" >&2
        return 1
    }

    # Display Tor status without restarting
    if ! [ -r "$COOKIE_AUTH_FILE" ] && ! $SUDO test -r "$COOKIE_AUTH_FILE"; then
        printf "${YELLOW}Warning: Tor cookie file ($COOKIE_AUTH_FILE) not accessible. Skipping status check.${NC}\n"
    else
        show_tor_status
    fi
}

# other funcs ....


[ "$1" != "uninstall" ] && check_agreement
# Call check_and_prepare_update with the first argument
check_and_prepare_update "$1"
case "$1" in
    install) shift 1; install "$@";;
    uninstall) shift 1; uninstall "$@";;
    setup) shift 1; setup "$@";;
    certify) shift 1; certify "$@";;
    run) shift 1; run "$@";;
    stop) shift 1; stop "$@";;
    stop-user) shift 1; stop_user "$@";;
    logs) shift 1; logs "$@";;
    update) shift 1; update "$@";;
    update-background) shift 1; update_background "$@";;
    activate) shift 1; activate "$@";;
    status) shift 1; status "$@";;
    run-as) shift 1; run_as "$@";;
    tor-run) shift 1; banner_color=$PURPLE; tor_run "$@";;
    docker-run) shift 1; docker_run "$@";;
    docker-stop) shift 1; docker_stop "$@";;
    --version|-v) shift 1; version "$@";;
    --help|-h) shift 1; usage "$@";;
    "") usage;;
    *) printf "${RED}Unknown command: $1${NC}\n"; usage; exit 1;;
esac
