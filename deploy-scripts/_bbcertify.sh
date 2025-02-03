#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Enable debugging if needed (uncomment the following line)
# set -x

# Constants
API_BASE_URL="https://license.dosaygo.com/api"
CERT_PATH_RELATIVE=".config/dosyago/bbpro/certificate.json"

# Function to display usage information
usage() {
  # Define ANSI escape codes for bold and reset
  BOLD='\033[1m'
  RESET='\033[0m'

  echo -e "${BOLD}Usage:${RESET}" >&2
  echo "  $0 <apiKey> [--user <username>]" >&2
  echo "  cat <cert.json> | $0 --release [--user <username>]" >&2
  echo "" >&2
  echo -e "${BOLD}Options:${RESET}" >&2
  echo "  <apiKey>            Obtain a new ticket for the first available seat and write to stdout using <apiKey>" >&2
  echo "  --release           Release the current ticket. If --user is provided, releases the ticket for that user; otherwise, reads certificate from stdin." >&2
  echo "  --user <username>   Specify the username whose certificate to write or release" >&2
  echo "  --help, -h          Display this help message" >&2
  echo "" >&2
  echo -e "${BOLD}Examples:${RESET}" >&2
  echo "  $0 myApiKey" >&2
  echo "  $0 myApiKey --user john" >&2
  echo "  cat cert.json | $0 --release" >&2
  echo "  $0 --release --user john" >&2
  echo "" >&2
  echo -e "${BOLD}Info:${RESET}" >&2
  echo "  The bb_certify script is designed to manage licenses (tickets) for BrowserBox by interacting with the license server." >&2
  echo "" >&2
  echo -e "${BOLD}  Obtaining a Ticket:${RESET}" >&2
  echo "    - Use your personal <apiKey> to request a new license ticket." >&2
  echo "    - The script will automatically allocate the first available seat." >&2
  echo "    - The obtained ticket is output to stdout and, if a username is provided, saved to the user's home directory at ~/.config/dosyago/bbpro/certificate.json" >&2
  echo "" >&2
  echo -e "${BOLD}  Releasing a Ticket:${RESET}" >&2
  echo "    - To release a ticket, use the --release option." >&2
  echo "    - If a --user is specified, the script releases the ticket associated with that user's certificate.json." >&2
  echo "    - Alternatively, you can pipe a certificate.json file to the script via stdin for release." >&2
  echo "    - This operation should be performed after shutting down BrowserBox to ensure proper license management." >&2
  echo "" >&2
  echo -e "${BOLD}  Multi-User Environments:${RESET}" >&2
  echo "    - In setups with multiple users, bb_certify should be executed by a privileged user using the organization's API key to allocate tickets for non-privileged users." >&2
  echo "    - This allows non-privileged users to run BrowserBox without direct access to the API key." >&2
  echo "" >&2
  echo -e "${BOLD}  Best Practices:${RESET}" >&2
  echo "    - Ensure that the organization's API key (used for releasing tickets) is securely stored and not hardcoded into scripts." >&2
  echo "    - Regularly verify the contents and permissions of certificate.json files to maintain security." >&2
  echo "    - Handle unexpected BrowserBox shutdowns by manually releasing tickets if automatic release fails." >&2
  exit 1
}


# Function to check if required commands are available
check_dependencies() {
  for cmd in curl jq getent; do
    if ! command -v "$cmd" &>/dev/null; then
      echo "Error: Required command '$cmd' is not installed." >&2
      exit 1
    fi
  done
}

# Function to get the home directory of a user
get_home_dir() {
  local username="$1"
  if [[ -z "$username" ]]; then
    echo "$HOME"
  else
    # Attempt to get the home directory using getent
    local user_home
    user_home=$(getent passwd "$username" | cut -d: -f6)
    if [[ -z "$user_home" ]]; then
      echo "Error: Could not determine home directory for user '$username'." >&2
      exit 1
    fi
    echo "$user_home"
  fi
}

# Function to obtain a ticket
obtain_ticket() {
  local api_key="$1"
  local username="$2"

  # Make API call to obtain a ticket
  local response
  response=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE_URL/tickets" \
    -H "Authorization: Bearer $api_key" \
    -H "Content-Type: application/json" \
    -d '{"request": "new_ticket"}')

  # Split response and HTTP status code
  local body status
  body=$(echo "$response" | sed '$d')
  status=$(echo "$response" | tail -n1)

  if [[ "$status" -ne 200 ]]; then
    echo "Error: Failed to obtain ticket. HTTP status code: $status" >&2
    echo "Response body: $body" >&2
    exit 1
  fi

  # Parse ticket from response
  local ticket
  ticket=$(echo "$body" | jq -r '.ticket')

  if [[ -z "$ticket" || "$ticket" == "null" ]]; then
    echo "Error: Invalid response from server. 'ticket' not found." >&2
    exit 1
  fi

  # Output the ticket to stdout
  echo "$ticket"

  # If a username is provided, write the ticket to the user's certificate.json
  if [[ -n "$username" ]]; then
    local user_home
    user_home=$(get_home_dir "$username")
    local cert_dir="$user_home/$CERT_PATH_RELATIVE"
    local cert_file="$cert_dir"

    # Create the directory if it doesn't exist
    mkdir -p "$(dirname "$cert_file")"

    # Write the ticket to certificate.json
    echo "{\"ticket\": \"$ticket\"}" > "$cert_file"

    echo "Ticket written to $cert_file for user '$username'."
  fi
}

# Function to release a ticket
release_ticket() {
  local username="$1"
  local cert_file=""
  local ticket=""

  if [[ -n "$username" ]]; then
    # Release for a specific user
    local user_home
    user_home=$(get_home_dir "$username")
    cert_file="$user_home/$CERT_PATH_RELATIVE"

    if [[ ! -f "$cert_file" ]]; then
      echo "Error: Certificate file '$cert_file' does not exist." >&2
      exit 1
    fi

    # Extract the ticket from certificate.json
    ticket=$(jq -r '.ticket' "$cert_file")

    if [[ -z "$ticket" || "$ticket" == "null" ]]; then
      echo "Error: 'ticket' not found in '$cert_file'." >&2
      exit 1
    fi
  else
    # Release using certificate from stdin
    if [[ -t 0 ]]; then
      echo "Error: No certificate provided via stdin." >&2
      usage
    fi

    # Read certificate from stdin
    local input
    input=$(cat)

    # Extract the ticket from the input
    ticket=$(echo "$input" | jq -r '.ticket')

    if [[ -z "$ticket" || "$ticket" == "null" ]]; then
      echo "Error: 'ticket' not found in the provided certificate." >&2
      exit 1
    fi
  fi

  # Make API call to release the ticket
  # NOTE: Replace 'YOUR_ORG_API_KEY' with the actual organization API key or handle it appropriately
  local org_api_key="YOUR_ORG_API_KEY"
  if [[ -z "$org_api_key" ]]; then
    echo "Error: Organization API key is not set." >&2
    exit 1
  fi

  local response
  response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_BASE_URL/tickets/$ticket" \
    -H "Authorization: Bearer $org_api_key" \
    -H "Content-Type: application/json")

  # Split response and HTTP status code
  local body status
  body=$(echo "$response" | sed '$d')
  status=$(echo "$response" | tail -n1)

  if [[ "$status" -ne 200 && "$status" -ne 204 ]]; then
    echo "Error: Failed to release ticket. HTTP status code: $status" >&2
    echo "Response body: $body" >&2
    exit 1
  fi

  # Remove the certificate file if releasing for a user
  if [[ -n "$username" ]]; then
    rm -f "$cert_file"
    echo "Ticket '$ticket' released and certificate file '$cert_file' removed for user '$username'."
  else
    echo "Ticket '$ticket' released successfully."
  fi
}

# Main script execution starts here

# Check for dependencies
check_dependencies

# Initialize variables
release=false
user=""
apiKey=""

# Parse arguments
if [[ $# -lt 1 ]]; then
  usage
fi

# Temporary variables to hold positional arguments
args=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --release)
      release=true
      shift
      ;;
    --user)
      if [[ -n "$2" ]]; then
        user="$2"
        shift 2
      else
        echo "Error: --user requires a username argument." >&2
        usage
      fi
      ;;
    --help|-h)
      usage
      ;;
    *)
      args+=("$1")
      shift
      ;;
  esac
done

# Assign positional arguments after option parsing
if [[ ${#args[@]} -gt 1 ]]; then
  echo "Error: Too many positional arguments." >&2
  usage
elif [[ ${#args[@]} -eq 1 ]]; then
  apiKey="${args[0]}"
fi

# Execute based on the parsed arguments
if [[ "$release" == true ]]; then
  release_ticket "$user"
elif [[ -n "$apiKey" ]]; then
  obtain_ticket "$apiKey" "$user"
else
  echo "Error: Either an <apiKey> must be provided or --release must be specified." >&2
  usage
fi

