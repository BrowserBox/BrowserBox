#!/bin/bash

set -e

# ==== CONFIG ====
WG_INTERFACE=${WG_INTERFACE:-bbx0}
WG_PORT=${WG_PORT:-51820}
WG_ADDR=${WG_ADDR:-10.66.66.1/24}
WG_PEER_ADDR=${WG_PEER_ADDR:-10.66.66.2/32}
WG_CONF_DIR=${WG_CONF_DIR:-/etc/wireguard}
WG_CONF="$WG_CONF_DIR/$WG_INTERFACE.conf"
KEY_DIR=${KEY_DIR:-$HOME/.bbx_keys}
PRIVATE_KEY_FILE="$KEY_DIR/privatekey"
PUBLIC_KEY_FILE="$KEY_DIR/publickey"

# ==== FUN ====
log() {
  echo -e "\033[1;32m[BBX]\033[0m $1"
}

install_wireguard_tools() {
  log "Checking for WireGuard..."

  if command -v wg > /dev/null && command -v wg-quick > /dev/null; then
    log "WireGuard already installed ✅"
    return
  fi

  log "Installing WireGuard..."

  if [[ -f /etc/debian_version ]]; then
    sudo apt update && sudo apt install -y wireguard
  elif [[ -f /etc/redhat-release ]]; then
    sudo yum install -y epel-release && sudo yum install -y wireguard-tools
  elif [[ "$(uname)" == "Darwin" ]]; then
    brew install wireguard-tools
  else
    echo "[-] Unsupported OS. Please install WireGuard manually."
    exit 1
  fi

  log "WireGuard installed 🎉"
}

generate_keys() {
  mkdir -p "$KEY_DIR"
  if [[ ! -f "$PRIVATE_KEY_FILE" ]]; then
    log "Generating new WireGuard keys..."
    wg genkey | tee "$PRIVATE_KEY_FILE" | wg pubkey > "$PUBLIC_KEY_FILE"
    chmod 600 "$PRIVATE_KEY_FILE"
    chmod 644 "$PUBLIC_KEY_FILE"
    log "Keys generated and stored in $KEY_DIR 🔐"
  else
    log "WireGuard keys already exist 🗝️"
  fi
}

write_config() {
  sudo mkdir -p "$WG_CONF_DIR"
  if [[ -f "$WG_CONF" ]]; then
    log "WireGuard config already exists at $WG_CONF ✅"
    return
  fi

  PRIVATE_KEY=$(cat "$PRIVATE_KEY_FILE")

  log "Writing WireGuard config to $WG_CONF..."
  sudo tee "$WG_CONF" > /dev/null <<EOF
[Interface]
Address = $WG_ADDR
ListenPort = $WG_PORT
PrivateKey = $PRIVATE_KEY

# Define this section only if you have a peer in mind
#[Peer]
#PublicKey = <peer_public_key>
#AllowedIPs = $WG_PEER_ADDR
EOF

  sudo chmod 600 "$WG_CONF"
  log "Config written 📝"
}

bring_up_interface() {
  log "Bringing up WireGuard interface $WG_INTERFACE..."
  sudo wg-quick up "$WG_INTERFACE"
  log "Tunnel active 🚀"
}

# ==== MAIN ====
install_wireguard_tools
generate_keys
write_config
bring_up_interface

