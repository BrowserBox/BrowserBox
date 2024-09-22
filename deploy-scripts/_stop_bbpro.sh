#!/usr/bin/env bash

source ~/.nvm/nvm.sh
TORDIR="/var/lib/tor"

if command -v sudo &>/dev/null; then
  SUDO="sudo -n"
fi

if [[ "$OSTYPE" == darwin* ]]; then
  TORDIR="$(brew --prefix)/var/lib/tor"
fi

# Ensure pm2 is available
command -v pm2 &>/dev/null || npm i -g pm2@latest

# Stop browser processes
pm2 delete basic-bb-main-service
pm2 delete run-docspark
pm2 delete devtools-server
pm2 delete start_audio

if [[ -z "$DO_NOT_KILL_NODE" ]]; then
  pkill -u "$(whoami)" node
fi

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
    
    # Source the torbb.env file to get onion addresses
    source "$torbb_env_file"

    # Read the Tor authentication cookie and control port
    tor_cookie_hex="$(xxd -p "${TORDIR}/control_auth_cookie" | tr -d '\n')"
    control_port="9051"
    
    # Loop through onion addresses and send DEL_ONION commands to the Tor control port
    for var in $(compgen -A variable | grep "^ADDR_"); do
      onion_address="${!var}"

      # Remove the .onion suffix to get the service ID
      service_id="${onion_address%.onion}"
      
      # Remove the onion address
      control_command=$(printf 'AUTHENTICATE %s\r\nDEL_ONION %s\r\nQUIT\r\n' "$tor_cookie_hex" "$service_id")
      
      echo "Removing onion service: $service_id"

      # Send the command to the Tor control port
      echo -e "$control_command" | nc localhost "$control_port"
    done
    rm -f "$torbb_env_file"
    rm -f "$login_link_file"
  else
    echo "No onion address detected in login link."
  fi
fi

exit 0

