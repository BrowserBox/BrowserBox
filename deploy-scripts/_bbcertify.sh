#!/bin/bash
# bbcertify.sh - Obtain a free seat via the API and issue a ticket, then save the ticket JSON

set -e

# Config locations
CONFIG_DIR="$HOME/.bbcertify"
TICKET_FILE="$CONFIG_DIR/ticket.json"

# API endpoints (adjust these URLs as needed for your server)
API_VERSION="v1"
API_BASE="https://master.dosaygo.com/${API_VERSION}"
FREE_SEAT_ENDPOINT="$API_BASE/free-seat"
ISSUE_TICKET_ENDPOINT="$API_BASE/tickets"

# Function to display usage information
usage() {
  cat <<EOF
Usage: $0 [-h|--help]

This script requests a free seat from the licensing server and issues a ticket.
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

# Function to fetch a free seat from the server
get_free_seat() {
  echo "Requesting a free seat from the server..." >&2
  FREE_SEAT_RESPONSE=$(curl -s -H "Authorization: Bearer $LICENSE_KEY" "$FREE_SEAT_ENDPOINT")

  # Check if response is empty
  if [[ -z "$FREE_SEAT_RESPONSE" ]]; then
    echo "Error: No response from server." >&2
    exit 1
  fi

  # Extract free seat ID
  FREE_SEAT=$(echo "$FREE_SEAT_RESPONSE" | grep -o '"freeSeat":"[^"]*"' | cut -d'"' -f4)
  if [[ -z "$FREE_SEAT" ]]; then
    echo "No free seat available. Server response:" >&2
    echo "$FREE_SEAT_RESPONSE" >&2
    exit 1
  fi

  echo "Obtained free seat: $FREE_SEAT" >&2
  echo "$FREE_SEAT"  # Key result to stdout
}

# Create config directory if it doesn't exist
mkdir -p "$CONFIG_DIR"

# Get the free seat ID from the server
SEAT_ID=$(get_free_seat)

# Define a time slot (current timestamp) and a device ID (hostname)
TIME_SLOT=$(date +%s)
DEVICE_ID=$(hostname)

echo "Issuing ticket for seat $SEAT_ID..." >&2
# Issue the ticket using the API; expecting JSON output.
TICKET_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LICENSE_KEY" \
  -d "{\"seatId\": \"$SEAT_ID\", \"timeSlot\": \"$TIME_SLOT\", \"deviceId\": \"$DEVICE_ID\", \"issuer\": \"master\"}" \
  "$ISSUE_TICKET_ENDPOINT")

# Validate ticket response
if [[ -z "$TICKET_RESPONSE" ]]; then
  echo "Error: No response from server when issuing ticket." >&2
  exit 1
fi

if echo "$TICKET_RESPONSE" | grep -q '"ticket":'; then
  echo "Ticket issued successfully!" >&2
  echo "$TICKET_RESPONSE" > "$TICKET_FILE"
  echo "Ticket saved to $TICKET_FILE" >&2
  echo "$TICKET_FILE"  # Key result to stdout
else
  echo "Error issuing ticket. Server response:" >&2
  echo "$TICKET_RESPONSE" >&2
  exit 1
fi

