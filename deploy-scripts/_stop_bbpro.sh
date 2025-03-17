#!/usr/bin/env bash

source ~/.nvm/nvm.sh
TORDIR="/var/lib/tor"

if command -v sudo &>/dev/null; then
  SUDO="sudo -n"
fi

if [[ "$OSTYPE" == darwin* ]]; then
    TOR_GROUP="admin"  # Homebrew default
    prefix=$(brew --prefix tor)
    TORDIR=$(node -p "path.resolve('${prefix}/../../var/lib/tor')")
else
    TORDIR="/var/lib/tor"
    TOR_GROUP=$(ls -ld "$TORDIR" | awk '{print $4}' 2>/dev/null) 
    if [[ -z "$TOR_GROUP" || "$TOR_GROUP" == "root" ]]; then
      TOR_GROUP=$(getent group | grep -E 'tor|debian-tor|toranon' | cut -d: -f1 | head -n1) 
    fi
    if [[ -z "$TOR_GROUP" ]]; then
      TOR_GROUP="debian-tor"
    fi
fi

# Ensure pm2 is available
command -v pm2 &>/dev/null || npm i -g pm2@latest

# Stop main process with a headsup in case pm2 rushes the shutdown
# because we need to ensure our shutdown tasks like releasing license occur
bpid="$(pgrep -x browserbox -u "$(whoami)")"
if [[ -n "$bpid" ]]; then
  kill -HUP $bpid
fi

pm2 delete run-docspark
pm2 delete devtools-server
pm2 delete start_audio

sleep 2

pm2 stop basic-bb-main-service 

sleep 2

pm2 delete basic-bb-main-service
pm2 save --force
# Kill pm2 if no processes are running
if [[ "$(pm2 jlist)" == "[]" ]]; then
  pm2 kill
fi

sleep 1

pkill -u "$(whoami)" browserbox*
pkill -u "$(whoami)" chrome
pulseaudio -k

# Check if the login link is an onion address and torbb.env exists
login_link_file="$HOME/.config/dosyago/bbpro/login.link"
torbb_env_file="$HOME/.config/dosyago/bbpro/torbb.env"

if [[ -f "$login_link_file" && -f "$torbb_env_file" ]]; then
  login_link=$(cat "$login_link_file")

  if command -v ufw &>/dev/null || sudo bash -c 'command -v ufw' &>/dev/null; then
    $SUDO ufw disable
  fi
  
  if [[ "$login_link" == *.onion* ]]; then
    echo "Detected onion address in login link: $login_link"
    
    # Check if user is already in TOR_GROUP
    user="$(whoami)"
    in_tor_group=false
    if id | grep -qw "$TOR_GROUP"; then
      in_tor_group=true
      echo "User $user already in group $TOR_GROUP"
    elif ! command -v sg >/dev/null 2>&1; then
      echo "sg not found and $user not in $TOR_GROUP, attempting cleanup with sudo fallback"
    else
      echo "Using sg to run cleanup in $TOR_GROUP context"
    fi
    
    # Define the cleanup script for direct execution
    cleanup_script() {
      source "$torbb_env_file"
      tor_cookie_hex=$(xxd -p "${TORDIR}/control_auth_cookie" 2>/dev/null || $SUDO xxd -p "${TORDIR}/control_auth_cookie" 2>/dev/null)
      tor_cookie_hex=$(echo "$tor_cookie_hex" | tr -d '\n')
      if [[ -z "$tor_cookie_hex" ]]; then 
        echo "Could not get tor cookie due to incorrect permissions" >&2
        exit 1
      fi
      control_port="9051"
      for var in $(compgen -A variable | grep "^ADDR_"); do
        onion_address="${!var}"
        service_id="${onion_address%.onion}"
        echo "Removing onion service: $service_id"
        control_command=$(printf 'AUTHENTICATE %s\r\nDEL_ONION %s\r\nQUIT\r\n' "$tor_cookie_hex" "$service_id")
        echo -e "$control_command" | nc localhost "$control_port"
      done
    }
    
    # Run cleanup based on group membership
    if $in_tor_group; then
      cleanup_script
    elif command -v sg >/dev/null 2>&1; then
      # Export variables needed in the heredoc
      export TORDIR SUDO torbb_env_file
      $SUDO -u ${SUDO_USER:-$USER} sg "$TOR_GROUP" -c "env TORDIR='$TORDIR' SUDO='$SUDO' torbb_env_file='$torbb_env_file' bash" << 'EOF'
source "$torbb_env_file"
tor_cookie_hex=$(xxd -p "$TORDIR/control_auth_cookie" 2>/dev/null || $SUDO xxd -p "$TORDIR/control_auth_cookie" 2>/dev/null)
tor_cookie_hex=$(echo "$tor_cookie_hex" | tr -d '\n')
if [[ -z "$tor_cookie_hex" ]]; then 
  echo "Could not get tor cookie due to incorrect permissions" >&2
  exit 1
fi
control_port="9051"
for var in $(compgen -A variable | grep "^ADDR_"); do
  onion_address="${!var}"
  service_id="${onion_address%.onion}"
  echo "Removing onion service: $service_id"
  control_command=$(printf 'AUTHENTICATE %s\r\nDEL_ONION %s\r\nQUIT\r\n' "$tor_cookie_hex" "$service_id")
  echo -e "$control_command" | nc localhost "$control_port"
done
EOF
    else
      cleanup_script
    fi
    # Check exit status of last command
    [ $? -eq 0 ] || { printf "${RED}Failed to remove onion services${NC}\n"; exit 1; }
    rm -f "$torbb_env_file"
    rm -f "$login_link_file"
  else
    echo "No onion address detected in login link."
  fi
fi

echo "BrowserBox stopped."
exit 0
