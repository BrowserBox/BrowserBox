#!/bin/bash
# bbcertify.sh - Obtain a vacant seat, issue a ticket, and register it as a certificate

if [[ -n "$BBX_DEBUG" ]]; then
  set -x
fi

set -e

# Configuration
CONFIG_DIR="$HOME/.config/dosyago/bbpro/tickets"
[ ! -d "$CONFIG_DIR" ] && mkdir -p "$CONFIG_DIR"
TICKET_FILE="$CONFIG_DIR/ticket.json"
API_VERSION="v1"
API_SERVER="https://master.dosaygo.com"
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
EOF
  exit 0
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
  local device_id=$(node << EOF
const os = require('os');
const crypto = require('crypto');
const interfaces = os.networkInterfaces();
const macAddresses = Object.keys(interfaces).flatMap(nic => interfaces[nic].map(iface => iface.mac).filter(mac => mac !== '00:00:00:00:00:00'));
const cpuInfo = os.cpus()[0].model;
const totalMemory = os.totalmem();
const data = \`\${macAddresses.join(',')}-\${cpuInfo}-\${totalMemory}\`;
const hash = crypto.createHash('sha256').update(data).digest('hex');
console.log(hash);
EOF
)
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
    exit 1
  fi
  echo "Seat reserved successfully" >&2
  # If new ticket issued, save it
  if [[ -n "$new_ticket" ]]; then
    echo "$new_ticket" > "$TICKET_FILE"
    echo "New ticket saved to $TICKET_FILE" >&2
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
    echo "Using existing valid ticket" >&2
    echo "$TICKET_FILE"
    exit 0
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
