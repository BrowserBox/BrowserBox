#!/bin/bash
# bbcertify.sh - Obtain a vacant seat via the API, issue a ticket, and register it as a certificate

set -e

# Config locations
CONFIG_DIR="$HOME/.config/dosyago/bbpro/tickets"
if [[ ! -d "$CONFIG_DIR" ]]; then
  mkdir -p "$CONFIG_DIR"
fi
TICKET_FILE="$CONFIG_DIR/ticket.json"

# API endpoints (adjust these URLs as needed for your server)
API_VERSION="v1"
API_BASE="https://master.dosaygo.com/${API_VERSION}"
VACANT_SEAT_ENDPOINT="$API_BASE/vacant-seat"
ISSUE_TICKET_ENDPOINT="$API_BASE/tickets"
REGISTER_CERT_ENDPOINT="$API_BASE/register-certificates"

# Function to display usage information
usage() {
  cat <<EOF
Usage: $0 [-h|--help]

This script requests a vacant seat, issues a ticket, and registers it as a certificate.
The ticket is saved to: $TICKET_FILE

Environment Variables:
  LICENSE_KEY   Your API key (must be set before running this script)

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
  echo "Please set it before running this script." >&2
  exit 1
fi

# Function to fetch a vacant seat from the server
get_vacant_seat() {
  echo "Requesting a vacant seat from the server..." >&2
  VACANT_SEAT_RESPONSE=$(curl -s -H "Authorization: Bearer $LICENSE_KEY" "$VACANT_SEAT_ENDPOINT")

  # Check if response is empty
  if [[ -z "$VACANT_SEAT_RESPONSE" ]]; then
    echo "Error: No response from server." >&2
    exit 1
  fi

  # Extract vacant seat ID using jq
  VACANT_SEAT=$(echo "$VACANT_SEAT_RESPONSE" | jq -r '.vacantSeat')
  if [[ -z "$VACANT_SEAT" ]]; then
    echo "No vacant seat available. Server response:" >&2
    echo "$VACANT_SEAT_RESPONSE" >&2
    exit 1
  fi

  echo "Obtained vacant seat: $VACANT_SEAT" >&2
  echo "$VACANT_SEAT"  # Key result to stdout
}

# Function to register the ticket as a certificate
register_certificate() {
  local ticket_json="$1"
  echo "Registering ticket as certificate..." >&2
  
  # Format the ticket into the expected certificates array structure
  CERT_PAYLOAD=$(jq -n --argjson ticket "$ticket_json" '{certificates: [$ticket]}')
  
  # Send the certificate to the register-certificates endpoint
  REGISTER_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
    -H "Authorization: Bearer $LICENSE_KEY" \
    -d "$CERT_PAYLOAD" \
    "$REGISTER_CERT_ENDPOINT")

  # Check if registration was successful
  if [[ -z "$REGISTER_RESPONSE" ]]; then
    echo "Error: No response from server when registering certificate." >&2
    exit 1
  fi

  if echo "$REGISTER_RESPONSE" | jq -e '.message == "Certificates registered successfully."' > /dev/null; then
    echo "Certificate registered successfully!" >&2
  else
    echo "Error registering certificate. Server response:" >&2
    echo "$REGISTER_RESPONSE" >&2
    exit 1
  fi
}

# Get the vacant seat ID from the server
SEAT_ID=$(get_vacant_seat)

# Define a time slot (current timestamp) and a device ID (hostname)
TIME_SLOT=$(date +%s)
DEVICE_ID=$(hostname)

echo "Issuing ticket for seat $SEAT_ID..." >&2
# Issue the ticket using the API; expecting JSON output
TICKET_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LICENSE_KEY" \
  -d "{\"seatId\": \"$SEAT_ID\", \"timeSlot\": \"$TIME_SLOT\", \"deviceId\": \"$DEVICE_ID\", \"issuer\": \"master\"}" \
  "$ISSUE_TICKET_ENDPOINT")

# Validate ticket response
if [[ -z "$TICKET_RESPONSE" ]]; then
  echo "Error: No response from server when issuing ticket." >&2
  exit 1
fi

# Check if the ticket field exists in the response and proceed
if echo "$TICKET_RESPONSE" | jq -e '.ticket' > /dev/null; then
  echo "Ticket issued successfully!" >&2
  # Extract the ticket JSON
  TICKET_JSON=$(echo "$TICKET_RESPONSE" | jq -e '.ticket')
  # Save the ticket to file
  echo "$TICKET_JSON" > "$TICKET_FILE"
  echo "Ticket saved to $TICKET_FILE" >&2
  
  # Register the ticket as a certificate
  register_certificate "$TICKET_JSON"
  
  echo "$TICKET_FILE"  # Key result to stdout
else
  echo "Error issuing ticket. Server response:" >&2
  echo "$TICKET_RESPONSE" >&2
  exit 1
fi
