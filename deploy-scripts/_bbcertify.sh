#!/bin/bash
# bbcertify.sh - Obtain a vacant seat, issue a ticket, and register it as a certificate

if [[ -n "$BBX_DEBUG" ]]; then
  set -x
fi

set -e

# Configuration
CONFIG_DIR="$HOME/.config/dosaygo/bbpro/tickets"
[ ! -d "$CONFIG_DIR" ] && mkdir -p "$CONFIG_DIR"
TICKET_FILE="$CONFIG_DIR/ticket.json"
API_VERSION="v1"
API_SERVER="${BBX_LICENSE_SERVER_URL:-https://master.dosaygo.com}"
API_BASE="${API_SERVER}/${API_VERSION}"
VACANT_SEAT_ENDPOINT="${API_BASE}/vacant-seat?reserve=0" # Snapshot only
ISSUE_TICKET_ENDPOINT="${API_BASE}/tickets"
REGISTER_CERT_ENDPOINT="${API_BASE}/register-certificates"
RESERVE_SEAT_ENDPOINT="${API_BASE}/reserve-seat"
VALIDATE_TICKET_ENDPOINT="${API_SERVER}/tickets/validate"
TICKET_VALIDITY_PERIOD=$((24 * 60 * 60)) # 24 hours in seconds
RESERVATION_FILE="$CONFIG_DIR/reservation.json"
CERT_META_FILE="$CONFIG_DIR/cert.meta.env" # it stores KEY=VALUE lines, so .env is clearer

# Usage information
usage() {
  cat <<EOF
Usage: bbcertify [options]

Options:
  --force-ticket     Force new ticket even if existing is valid (but check server)
  --force-license    Force license check and new ticket
  --no-reservation   Skip seat reservation step
  -h, --help         Show this help message

Environment:
  BBX_LICENSE_SERVER_URL  Override API server (default: https://master.dosaygo.com)
EOF
  exit 0
}

require_browserbox() {
  if ! command -v browserbox >/dev/null 2>&1; then
    echo "Error: browserbox binary is required for certificate operations." >&2
    exit 1
  fi
}

sign_ed25519() {
  local data="$1"
  local private_key_base64url="$2"
  require_browserbox
  browserbox sign-ed25519 "$data" "$private_key_base64url"
}

verify_rsa_sha256() {
  local data="$1"
  local signature="$2"
  local public_key="$3"
  require_browserbox
  browserbox verify-rsa-sha256 "$data" "$signature" "$public_key"
}

device_id_from_binary() {
  require_browserbox
  browserbox device-id
}

meta_put() {
  local k="$1" v="$2"
  (grep -v "^${k}=" "$CERT_META_FILE" 2>/dev/null; echo "${k}=${v}") \
    > "${CERT_META_FILE}.tmp" && mv "${CERT_META_FILE}.tmp" "$CERT_META_FILE"
}

# Check local ticket validity
check_ticket_validity() {
  if [[ ! -f "$TICKET_FILE" ]]; then
    echo "No existing ticket found" >&2; return 1
  fi
  local expiresAt timeSlot
  expiresAt=$(jq -r '.ticket.ticketData.expiresAt // empty' "$TICKET_FILE" 2>/dev/null)
  timeSlot=$(jq -r '.ticket.ticketData.timeSlot // empty' "$TICKET_FILE" 2>/dev/null)
  local current_time expiration_time
  if [[ -n "$expiresAt" && "$expiresAt" =~ ^[0-9]+$ ]]; then
    expiration_time="$expiresAt"
  elif [[ -n "$timeSlot" && "$timeSlot" =~ ^[0-9]+$ ]]; then
    expiration_time=$(( timeSlot + TICKET_VALIDITY_PERIOD ))
  else
    echo "Invalid ticket times in $TICKET_FILE" >&2; return 1
  fi
  if (( $(date +%s) < expiration_time )); then
    local remaining=$(( expiration_time - $(date +%s) ))
    printf "Existing ticket valid (expires in %dh %dm)\n" $((remaining/3600)) $(((remaining%3600)/60)) >&2
    return 0
  else
    echo "Existing ticket has expired" >&2
    rm -f "$TICKET_FILE"
    return 1
  fi
}

# Validate ticket with server
validate_ticket_with_server() {
  local ticket_json=$(cat "$TICKET_FILE")
  echo "Checking ticket validity with server..." >&2
  
  # Extract seatId from ticket
  local seat_id=$(echo "$ticket_json" | jq -r '.seatCertificate.seatData.seatId // empty')
  if [[ -z "$seat_id" ]]; then
    echo "Error: Cannot extract seatId from ticket" >&2
    return 1
  fi
  
  # Step 1: Request challenge nonce from server
  echo "Requesting challenge nonce..." >&2
  local challenge_endpoint="${API_SERVER}/tickets/challenge"
  local challenge_response=$(curl -sS --connect-timeout 7 --max-time 15 -X POST \
    -H "Content-Type: application/json" \
    -d "{\"seatId\": \"$seat_id\"}" \
    "$challenge_endpoint" 2>/dev/null)
  
  local nonce=$(echo "$challenge_response" | jq -r '.nonce // empty')
  if [[ -z "$nonce" ]]; then
    echo "Warning: Could not get challenge nonce, proceeding without challenge-response" >&2
    # Fallback to non-challenge validation
    local payload=$(jq -n --argjson ticket "$ticket_json" '{"certificateJson": $ticket}')
    local response=$(curl -sS --connect-timeout 7 --max-time 15 -X POST -H "Content-Type: application/json" \
      -d "$payload" "$VALIDATE_TICKET_ENDPOINT")
    local is_valid=$(echo "$response" | jq -r '.isValid // false')
    if [[ "$is_valid" == "true" ]]; then
      echo "Server confirmed: Ticket is valid" >&2
      return 0
    else
      echo "Server response: Ticket is invalid. Response: $response" >&2
      rm -f "$TICKET_FILE"
      return 1
    fi
  fi
  
  echo "Received challenge nonce" >&2
  
  # Step 2: Extract ticket's Ed25519 private key and sign the nonce
  local ticket_private_key=$(echo "$ticket_json" | jq -r '.ticket.ticketData.jwk.d // empty')
  if [[ -z "$ticket_private_key" ]]; then
    echo "Error: Cannot extract ticket private key from ticket" >&2
    return 1
  fi
  
  echo "Signing challenge nonce with Ed25519..." >&2
  local nonce_signature
  nonce_signature=$(sign_ed25519 "$nonce" "$ticket_private_key")
  if [[ -z "$nonce_signature" ]]; then
    echo "Error: Failed to sign challenge nonce" >&2
    return 1
  fi
  
  echo "Challenge nonce signed" >&2
  
  # Step 3: Send validation request with challenge response
  local payload=$(jq -n \
    --argjson ticket "$ticket_json" \
    --arg nonce "$nonce" \
    --arg signature "$nonce_signature" \
    '{"certificateJson": $ticket, "challengeNonce": $nonce, "nonceSignature": $signature}')
  
  local response=$(curl -sS --connect-timeout 7 --max-time 15 -X POST \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "$VALIDATE_TICKET_ENDPOINT")
  
  local is_valid=$(echo "$response" | jq -r '.isValid // false')
  local server_signature=$(echo "$response" | jq -r '.serverSignature // empty')
  
  if [[ "$is_valid" != "true" ]]; then
    echo "Server response: Ticket is invalid. Response: $response" >&2
    rm -f "$TICKET_FILE"
    return 1
  fi
  
  # Step 4: Verify server signature (mutual authentication)
  if [[ -n "$server_signature" ]]; then
    echo "Verifying server signature for mutual authentication..." >&2
    local stadium_public_key=$(echo "$ticket_json" | jq -r '.issuingCertificate.publicKey // empty')
    if [[ -z "$stadium_public_key" ]]; then
      echo "Warning: Cannot extract stadium public key, skipping server signature verification" >&2
    else
      # Generate a pseudo instanceId (in real usage, this should match what was sent to server)
      local instance_id="DOSAYGO://browserbox/validation-check/$(date +%s)"
      local verification_result
      verification_result=$(verify_rsa_sha256 "$instance_id" "$server_signature" "$stadium_public_key")
      if [[ "$verification_result" == "true" ]]; then
        echo "Server signature verified successfully" >&2
      else
        echo "Warning: Server signature verification failed" >&2
        # In production, you might want to fail here to prevent MITM attacks
        # For now, we'll just warn but continue
      fi
    fi
  fi
  
  echo "Server confirmed: Ticket is valid" >&2
  return 0
}

# Fetch vacant seat
get_vacant_seat() {
  echo "Requesting a vacant seat..." >&2
  local url="$VACANT_SEAT_ENDPOINT"
  local response
  response=$(curl -sS --connect-timeout 7 --max-time 15 -H "Authorization: Bearer $LICENSE_KEY" "$url")
  local seat
  seat=$(echo "$response" | jq -r '.vacantSeat // empty')
  if [[ -z "$seat" ]]; then
    echo "Error: No vacant seat available. Response:" >&2
    echo "$response" >&2
    exit 1
  fi
  echo "Obtained seat: $seat" >&2
  # print just the seat id to stdout for caller compatibility
  echo "$seat"
}

# Issue a ticket
issue_ticket() {
  local seat_id="$1"
  local time_slot=$(date +%s)
  local device_id
  device_id=$(device_id_from_binary)
  # Debug: Log the computed device_id
  [[ -n "$BBX_DEBUG" ]] && echo "DEBUG: Issued ticket using device_id: $device_id" >&2
  echo "Issuing ticket for seat $seat_id..." >&2
  local response=$(curl -sS --connect-timeout 7 --max-time 15 -X POST -H "Content-Type: application/json" \
    -H "Authorization: Bearer $LICENSE_KEY" \
    -d "{\"seatId\": \"$seat_id\", \"timeSlot\": \"$time_slot\", \"deviceId\": \"$device_id\", \"issuer\": \"master\"}" \
    "$ISSUE_TICKET_ENDPOINT")
  local ticket=$(echo "$response" | jq -e '.ticket // empty')
  if [[ -z "$ticket" ]]; then
    echo "Error issuing ticket. Response:" >&2
    echo "$response" >&2
    exit 1
  fi
  echo "Ticket issued successfully" >&2
  echo "$ticket"
}

# Register ticket as certificate
register_certificate() {
  local ticket_json="$1"
  echo "Registering ticket as certificate..." >&2
  local payload=$(jq -n --argjson ticket "$ticket_json" '{certificates: [$ticket]}')
  local response=$(curl -sS --connect-timeout 7 --max-time 15 -X POST -H "Content-Type: application/json" \
    -H "Authorization: Bearer $LICENSE_KEY" \
    -d "$payload" "$REGISTER_CERT_ENDPOINT")
  if ! echo "$response" | jq -e '.message == "Certificates registered successfully."' >/dev/null; then
    echo "Error registering certificate. Response:" >&2
    echo "$response" >&2
    exit 1
  fi
  echo "Certificate registered successfully" >&2
}

# Reserve seat
reserve_seat() {
  local ticket_json="$1"
  echo "Reserving seat..." >&2
  local payload=$(jq -n --argjson ticket "$ticket_json" '{ticketJson: $ticket}')
  local response=$(curl -sS --connect-timeout 7 --max-time 15 -X POST -H "Content-Type: application/json" \
    -H "Authorization: Bearer $LICENSE_KEY" \
    -d "$payload" "$RESERVE_SEAT_ENDPOINT")
  local reservation=$(echo "$response" | jq -r '.reservationCode // empty')
  local new_ticket=$(echo "$response" | jq -e '.ticket // empty')
  if [[ -z "$reservation" ]]; then
    echo "Error reserving seat. Response:" >&2
    echo "$response" >&2
    return 1
  fi
  echo "Seat reserved successfully" >&2
  # If new ticket issued, save it and register it
  if [[ -n "$new_ticket" ]]; then
    echo "$new_ticket" > "$TICKET_FILE"
    echo "New ticket saved to $TICKET_FILE" >&2
    echo "Registering new ticket issued by server..." >&2
    register_certificate "$new_ticket"
    # Update cert meta with new ticket details
    local new_ticket_id=$(echo "$new_ticket" | jq -r '.ticket.ticketData.ticketId // empty')
    local new_time_slot=$(echo "$new_ticket" | jq -r '.ticket.ticketData.timeSlot // empty')
    if [[ -n "$new_ticket_id" ]]; then
      meta_put BBX_TICKET_ID "$new_ticket_id"
    fi
    if [[ -n "$new_time_slot" ]]; then
      meta_put BBX_TICKET_SLOT "$new_time_slot"
    fi
  fi
  jq -n --arg code "$reservation" \
    '{reservationCode:$code}' > "$RESERVATION_FILE"
  # convenience env for downstream commands that source this file
  echo "BBX_RESERVATION_CODE=$reservation" > "$CERT_META_FILE"
  return 0
}

# Argument parsing
FORCE_TICKET=false
FORCE_LICENSE=false
NO_RESERVATION=false
while [[ "$#" -gt 0 ]]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    --force-ticket) FORCE_TICKET=true; shift ;;
    --force-license) FORCE_LICENSE=true; shift ;;
    --no-reservation) NO_RESERVATION=true; shift ;;
    *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ "$FORCE_TICKET" == "true" ]] && [[ "$FORCE_LICENSE" == "true" ]]; then
  echo "Error: Use only --force-ticket or --force-license but not both" >&2
  usage
  exit 1
fi

# Main logic
main() {
  local ticket_valid=false
  if check_ticket_validity; then
    ticket_valid=true
  fi

  if [[ "$FORCE_TICKET" == "true" && "$ticket_valid" == "true" ]]; then
    if validate_ticket_with_server; then
      echo "Ticket is valid according to server, keeping existing ticket" >&2
      echo "$TICKET_FILE"
      exit 0
    else
      echo "Ticket is invalid on server, proceeding to get a new one..." >&2
      ticket_valid=false
    fi
  elif [[ "$FORCE_TICKET" == "false" && "$ticket_valid" == "true" && "$FORCE_LICENSE" == "false" ]]; then
    # If we have a valid local ticket, don't just exit.
    # Instead, try to reserve its seat to guarantee it's still ours.
    echo "Existing ticket is valid. Attempting to reserve seat..." >&2
    local ticket_json
    ticket_json=$(cat "$TICKET_FILE")

    # Attempt to reserve the seat for the ticket we already have.
    if reserve_seat "$ticket_json"; then
      echo "Seat successfully reserved for existing ticket." >&2
      echo "$TICKET_FILE"
      exit 0 # Now we can exit safely, because reservation.json exists.
    else
      # The reservation failed! This means someone else took our seat.
      echo "Failed to reserve seat for existing ticket. Getting a new ticket..." >&2
      ticket_valid=false # Force the script to fall through and get a new ticket.
    fi
  fi

  if [[ "$FORCE_LICENSE" == "true" ]]; then
    seat_id=$(get_vacant_seat)
    echo "Seat ID: $seat_id" >&2
    ticket_json=$(issue_ticket "$seat_id")
    if [[ "$ticket_valid" == "false" ]]; then
      echo "$ticket_json" > "$TICKET_FILE"
      register_certificate "$ticket_json"
      if [[ "$NO_RESERVATION" != "true" ]]; then
        reserve_seat "$ticket_json"
      fi
      # augment cert.meta.json with ticket basics
      ticket_id=$(echo "$ticket_json" | jq -r '.ticket.ticketData.ticketId // empty')
      time_slot=$(echo "$ticket_json" | jq -r '.ticket.ticketData.timeSlot // empty')
      meta_put BBX_TICKET_ID "$ticket_id"
      meta_put BBX_TICKET_SLOT "$time_slot"
    else
      echo "License is valid, but keeping existing valid ticket" >&2
    fi
    echo "$TICKET_FILE"
    exit 0
  fi

  # Default case: get new ticket if none exists or it's invalid
  seat_id=$(get_vacant_seat)
  echo "Seat ID 2: $seat_id" >&2
  ticket_json=$(issue_ticket "$seat_id")
  echo "$ticket_json" > "$TICKET_FILE"
  register_certificate "$ticket_json"
  if [[ "$NO_RESERVATION" != "true" ]]; then
    reserve_seat "$ticket_json"
  fi
  # augment cert.meta.json with ticket basics
  ticket_id=$(echo "$ticket_json" | jq -r '.ticket.ticketData.ticketId // empty')
  time_slot=$(echo "$ticket_json" | jq -r '.ticket.ticketData.timeSlot // empty')
  meta_put BBX_TICKET_ID "$ticket_id"
  meta_put BBX_TICKET_SLOT "$time_slot"
  echo "$TICKET_FILE"
  exit 0
}

main
