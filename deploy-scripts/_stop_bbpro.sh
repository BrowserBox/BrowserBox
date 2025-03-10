#!/usr/bin/env bash

source ~/.nvm/nvm.sh
TORDIR="/var/lib/tor"

if command -v sudo &>/dev/null; then
  SUDO="sudo -n"
fi

if [[ "$OSTYPE" == darwin* ]]; then
  TORDIR="$(brew --prefix)/var/lib/tor"
  TOR_GROUP="_tor"  # Homebrew default
else
  TOR_GROUP=$(ls -ld "$TORDIR" | awk '{print $4}' 2>/dev/null) || TOR_GROUP="debian-tor"
  [[ -z "$TOR_GROUP" || "$TOR_GROUP" == "root" ]] && TOR_GROUP=$(getent group | grep -E 'tor|debian-tor|toranon' | cut -d: -f1 | head -n1) || TOR_GROUP="debian-tor"
fi

# Ensure pm2 is available
command -v pm2 &>/dev/null || npm i -g pm2@latest

# Stop browser processes
pm2 delete run-docspark
pm2 delete devtools-server
pm2 delete start_audio
pm2 delete basic-bb-main-service

sleep 1
pkill -u "$(whoami)" browserbox*
pkill -u "$(whoami)" chrome
pulseaudio -k
pm2 save --force

# Kill pm2 if no processes are running
if [[ "$(pm2 jlist)" == "[]" ]]; then
  pm2 kill
fi

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
    
    # Run Tor cleanup in Tor group context
    if command -v sg >/dev/null 2>&1; then
      sg "$TOR_GROUP" -c "
        # Source the torbb.env file to get onion addresses
        source \"$torbb_env_file\"

        # Read the Tor authentication cookie and control port with fallback
        tor_cookie_hex=\$(xxd -p '${TORDIR}/control_auth_cookie' 2>/dev/null || $SUDO xxd -p '${TORDIR}/control_auth_cookie' | tr -d '\n')
        control_port=\"9051\"
        
        # Loop through onion addresses and send DEL_ONION commands
        for var in \$(compgen -A variable | grep '^ADDR_'); do
          onion_address=\"\${!var}\"
          service_id=\"\${onion_address%.onion}\"
          
          echo \"Removing onion service: \$service_id\"
          
          control_command=\$(printf 'AUTHENTICATE %s\r\nDEL_ONION %s\r\nQUIT\r\n' \"\$tor_cookie_hex\" \"\$service_id\")
          echo -e \"\$control_command\" | nc localhost \"\$control_port\"
        done
      " || { printf "${RED}Failed to remove onion services with sg${NC}\n"; exit 1; }
    else
      printf "${YELLOW}sg not found, attempting cleanup as current user...${NC}\n"
      source "$torbb_env_file"
      tor_cookie_hex="$(xxd -p "${TORDIR}/control_auth_cookie" 2>/dev/null || $SUDO xxd -p "${TORDIR}/control_auth_cookie" 2>/dev/null)"
      tor_cookie_hex="$(echo $tor_cookie_hex | tr -d '\n')"
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
    fi
    rm -f "$torbb_env_file"
    rm -f "$login_link_file"
  else
    echo "No onion address detected in login link."
  fi
fi

echo "BrowserBox stopped."
exit 0
