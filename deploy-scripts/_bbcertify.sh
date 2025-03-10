#!/bin/bash
# bbcertify.sh - Obtain a vacant seat, issue a ticket, and register it as a certificate

set -e

# Config locations
CONFIG_DIR="$HOME/.config/dosyago/bbpro/tickets"
[ ! -d "$CONFIG_DIR" ] && mkdir -p "$CONFIG_DIR"
TICKET_FILE="$CONFIG_DIR/ticket.json"

# API endpoints
API_VERSION="v1"
API_BASE="https://master.dosaygo.com/${API_VERSION}"
VACANT_SEAT_ENDPOINT="$API_BASE/vacant-seat"
ISSUE_TICKET_ENDPOINT="$API_BASE/tickets"
REGISTER_CERT_ENDPOINT="$API_BASE/register-certificates"

# Ticket validity period in seconds (10 hours)
TICKET_VALIDITY_PERIOD=$((10 * 60 * 60))  # 36000 seconds

# Function to display usage information
usage() {
  cat <<EOF
Usage: $0 [-h|--help]

Obtains a valid ticket for BrowserBox, renewing if expired. Ticket saved to: $TICKET_FILE

Environment Variables:
  LICENSE_KEY   Your API key (required)

Options:
  -h, --help    Show this help message and exit
EOF
}

# Argument parsing
while [[ "$#" -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

# Ensure LICENSE_KEY is set
if [[ -z "$LICENSE_KEY" ]]; then
  echo "Error: LICENSE_KEY environment variable is not set." >&2
  exit 1
fi

# Function to check ticket validity
check_ticket_validity() {
  if [[ ! -f "$TICKET_FILE" ]]; then
    echo "No existing ticket found" >&2
    return 1
  fi

  local timeslot=$(jq -r '.ticket.ticketData.timeSlot' "$TICKET_FILE" 2>/dev/null)
  if [[ -z "$timeslot" || "$timeslot" == "null" ]]; then
    echo "Invalid or missing timeSlot in $TICKET_FILE" >&2
    return 1
  fi

  local current_time=$(date +%s)
  local expiration_time=$((timeslot + TICKET_VALIDITY_PERIOD))
  local remaining_seconds=$((expiration_time - current_time))

  if [[ $current_time -lt $expiration_time ]]; then
    local remaining_hours=$((remaining_seconds / 3600))
    local remaining_minutes=$(((remaining_seconds % 3600) / 60))
    echo "Existing ticket is valid (expires in ${remaining_hours}h ${remaining_minutes}m)" >&2
    echo "$TICKET_FILE"
    return 0
  else
    echo "Existing ticket has expired" >&2
    rm -f "$TICKET_FILE"
    return 1
  fi
}

# Function to fetch a vacant seat
get_vacant_seat() {
  echo "Requesting a vacant seat..." >&2
  local response=$(curl -s -H "Authorization: Bearer $LICENSE_KEY" "$VACANT_SEAT_ENDPOINT")
  local seat=$(echo "$response" | jq -r '.vacantSeat // empty')
  if [[ -z "$seat" ]]; then
    echo "Error: No vacant seat available. Response:" >&2
    echo "$response" >&2
    exit 1
  fi
  echo "Obtained seat: $seat" >&2
  echo "$seat"
}

# Function to issue a ticket
issue_ticket() {
  local seat_id="$1"
  local time_slot=$(date +%s)
  local device_id=$(hostname)
  echo "Issuing ticket for seat $seat_id..." >&2
  local response=$(curl -s -X POST -H "Content-Type: application/json" \
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
  echo "$ticket" > "$TICKET_FILE"
  echo "Ticket saved to $TICKET_FILE" >&2
  echo "$ticket"
}

# Function to register the ticket as a certificate
register_certificate() {
  local ticket_json="$1"
  echo "Registering ticket as certificate..." >&2
  local payload=$(jq -n --argjson ticket "$ticket_json" '{certificates: [$ticket]}')
  local response=$(curl -s -X POST -H "Content-Type: application/json" \
    -H "Authorization: Bearer $LICENSE_KEY" \
    -d "$payload" "$REGISTER_CERT_ENDPOINT")
  if ! echo "$response" | jq -e '.message == "Certificates registered successfully."' >/dev/null; then
    echo "Error registering certificate. Response:" >&2
    echo "$response" >&2
    exit 1
  fi
  echo "Certificate registered successfully" >&2
}

# Main logic
if check_ticket_validity; then
  exit 0  # Valid ticket exists
else
  # Get a new ticket
  seat_id=$(get_vacant_seat)
  ticket_json=$(issue_ticket "$seat_id")
  register_certificate "$ticket_json"
  echo "$TICKET_FILE"
fi
