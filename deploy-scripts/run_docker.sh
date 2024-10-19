#!/usr/bin/env bash

#set -x

trap 'echo "Got an error. Bailing this section..." >&2' ERR
trap 'echo "Exiting..." >&2' EXIT

# Detect operating system
OS=$(uname)
ZONE=""
SUDO=""
if command -v sudo &>/dev/null; then
  echo "Using passwordless sudo. Ensure sudo is already unlocked with a password or use NOPASSWD in sudoers, which can be edited using visudo." >&2
  SUDO="sudo -n"
fi

if command -v firewall-cmd; then
  ZONE="$($SUDO firewall-cmd --get-default-zone)"
fi

## Check if running on macOS
#if [ "$OS" == "Darwin" ]; then
#  echo "WARNING: Running this Docker container is currently not supported on macOS due to a dependency issue."
#  echo "If you would like to star the repo and follow the issue, please visit: https://github.com/WonderInventions/node-webrtc/issues/3"
#  echo "To run on Mac, please follow the regular (non-Docker) instructions at: https://github.com/BrowserBox/BrowserBox"
#  exit 1
#fi

# Check for root or $SUDO capabilities
if [[ $EUID -eq 0 ]]; then
  echo "Running as root."
elif $SUDO -n true 2>/dev/null; then
  echo "Has $SUDO capabilities."
else
  echo "This script requires root privileges or $SUDO capabilities." 1>&2
  exit 1
fi

# User agreement prompt
echo "By using this container, you agree to the terms and license at the following locations:"
echo "License: https://raw.githubusercontent.com/dosyago/BrowserBoxPro/0b3ae2325eb95a2da441adc09411e2623fef6048/LICENSE.md"
echo "Terms: https://dosyago.com/terms.txt"
echo "Privacy: https://dosyago.com/privacy.txt"
read -p "Do you agree to these terms? Enter 'yes' or 'no': " agreement

if [ "$agreement" != "yes" ]; then
    echo "You must agree to the terms and conditions to continue. Exiting..."
    exit 1
fi

echo "Your use is an agreement to the terms, privacy policy and license."

# Define directory and file paths
certDir="${HOME}/sslcerts"
certFile="${certDir}/fullchain.pem"
keyFile="${certDir}/privkey.pem"

# Function to check if a command exists
command_exists() {
  command -v "$@" > /dev/null 2>&1
}

# Function to print instructions
print_instructions() {
  echo "Please ensure you have set up a DNS A record to point to the IPv4 address of this machine ($ip)"
  echo "We are now waiting for that hostname to resolve to this ip..."
}

# Define Docker image details
DOCKER_IMAGE="ghcr.io/browserbox/browserbox"
DOCKER_TAG="latest"
DOCKER_IMAGE_WITH_TAG="${DOCKER_IMAGE}:${DOCKER_TAG}"

# Check if the Docker image is already present
if ! $SUDO docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^${DOCKER_IMAGE_WITH_TAG}$"; then
  echo "Docker image not found locally. Pulling from repository..."
  $SUDO docker pull "${DOCKER_IMAGE_WITH_TAG}"
else
  echo "Docker image already exists locally."
fi

# Get the PORT and other arguments
PORT=$1
HOSTNAME=$2
EMAIL=$3

# Check if all arguments are provided
if [ -z "$PORT" ] || [ -z "$HOSTNAME" ] || [ -z "$EMAIL" ]; then
  echo "Error: All arguments must be provided."
  echo "Usage: $0 <PORT> <DNS HOSTNAME> <EMAIL>"
  exit 1
fi

# Validate that PORT is a number
if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
  echo "Error: PORT must be a number."
  echo "Usage: $0 <PORT> <DNS HOSTNAME> <EMAIL>"
  exit 1
fi

echo "Setting main args to: "
echo "Port: $PORT"
echo "Host: $HOSTNAME"
echo "Email: $EMAIL"

is_port_free_new() {
  local port=$1
  if [[ "$port" =~ ^[0-9]+$ ]] && [ "$port" -ge 4022 ] && [ "$port" -le 65535 ]; then
    echo "$port is a valid port number." >&2
  else
    echo "$1 is an invalid port number." >&2
    echo "" >&2
    echo "Select a main port between 4024 and 65533." >&2
    echo "" >&2
    echo "  Why 4024?" >&2
    echo "    This is because, by convention the browser runs on the port 3000 below the app's main port, and the first user-space port is 1024." >&2
    echo "" >&2
    echo "  Why 65533?" >&2
    echo "    This is because each app occupies a slice of 5 consecutive ports, two below, and two above, the app's main port. The highest user-space port is 65535, hence the highest main port that leaves two above it free is 65533." >&2
    echo "" >&2
    return 1
  fi

  # Using direct TCP connection attempt to check port status
  if ! bash -c "exec 6<>/dev/tcp/127.0.0.1/$port" 2>/dev/null; then
    echo "Port $port is available." >&2
    return 0
  else
    echo "Port $port is in use." >&2
    return 1
  fi
}

bail_on_port=""
if ! is_port_free_new $(($PORT - 2)); then
  bail_on_port="true"
elif ! is_port_free_new $(($PORT - 1)); then
  bail_on_port="true"
elif ! is_port_free_new $PORT; then
  bail_on_port="true"
elif ! is_port_free_new $(($PORT + 1)); then
  bail_on_port="true"
elif ! is_port_free_new $(($PORT + 2)); then
  bail_on_port="true"
else
  bail_on_port=""
fi

if [[ -n "$bail_on_port" ]]; then
  echo "ERROR: One of the ports between $(($PORT - 2)) and $(($PORT + 2)) is already being used. Please pick a different starting port. You picked $PORT and it did not work." >&2
  exit 1
fi

# Get the certs

open_firewall_port_range() {
  local start_port=$1
  local end_port=$2

  # Check for firewall-cmd (firewalld)
  if [[ "$(uname)" == "Darwin" ]]; then
    echo "pass in proto tcp from any to any port $start_port:$end_port" | $SUDO pfctl -ef -
  elif command -v firewall-cmd &> /dev/null; then
    echo "Using firewalld"
    $SUDO firewall-cmd --zone="$ZONE" --add-port=${start_port}-${end_port}/tcp --permanent
    $SUDO firewall-cmd --reload
  # Check for ufw (Uncomplicated Firewall)
  elif $SUDO bash -c 'command -v ufw' &> /dev/null; then
    echo "Using ufw"
    $SUDO ufw allow ${start_port}:${end_port}/tcp
  else
    echo "No recognized firewall management tool found"
    return 1
  fi
}

get_external_ip() {
  local ip

  # List of services to try
  local services=(
    "https://icanhazip.com"
    "https://ifconfig.me"
    "https://api.ipify.org"
  )

  # Try each service in turn
  for service in "${services[@]}"; do
    ip=$(curl -4s --connect-timeout 5 "$service")
    if [[ -n "$ip" ]]; then
      echo "$ip"
      return
    fi
  done

  echo "Failed to obtain external IP address" >&2
  return 1
}

# Get the hostname
ssl_dir="$HOME/sslcerts"
output=""
darwin_needs_close=""

function get_hostname() {
if [[ -f "$ssl_dir/privkey.pem" && -f "$ssl_dir/fullchain.pem" ]]; then
  hostname=$(openssl x509 -in "${ssl_dir}/fullchain.pem" -noout -text | grep -A1 "Subject Alternative Name" | tail -n1 | sed 's/DNS://g; s/, /\n/g' | head -n1 | awk '{$1=$1};1')
  echo "Hostname: $hostname" >&2
  output="$hostname"
else
  ip_address=$(get_external_ip)
  echo "IP Address: $ip_address" >&2
  output=""
fi
}

function get_certs() {
  if [[ -f "${ssl_dir}/privkey.pem" && -f "${ssl_dir}/fullchain.pem" && "$HOSTNAME" == "$output" ]]; then
    echo "Certs already present, will not overwrite. To force new certs for $HOSTNAME please remove or rename $ssl_dir"
  else
    if [[ "$HOSTNAME" != "localhost" ]]; then
      if [[ "$(uname)" == "Darwin" ]]; then
        # Use osascript to display a confirmation dialog and capture the output
        echo "We are waiting for your response. Please check your Desktop now for the Dialog Box..."
        userResponse=$(osascript -e 'display dialog "LetsEncrypt will ask your permission to open a temporary server for a few seconds to verify the domain for your HTTPS certificate. Allow LetsEncrypt to ask you?" buttons {"No", "Yes"} default button "Yes"')
        echo "Dialog response: $userResponse"

        # Check the user's response to the dialog
        if [[ $userResponse == *"Yes"* ]]; then
          echo "User agreed. Proceeding with verification..."
          # Insert the code to open the temporary server for Let's Encrypt verification here
          read -p "This will disable Apple iCloud Private Relay temporarily to attempt to open port 80 for LetsEncrypt HTTPS certificate issuance verification of hostname (which may fail anyway if your ISP blocks port 80). Continue? (y/n) " answer
          if [[ "$answer" == "y" ]]; then
            # Assuming open_firewall_port_range is a function you have defined to open port ranges with pfctl
            open_firewall_port_range 80 80
            darwin_needs_close="true"
          else
            echo "Not trying to open port 80. LetsEncrypt certificate issuance verification may fail." >&2
          fi
        else
          echo "User declined. Verification canceled."
          # Handle the case where the user declines
          return 1
        fi
      else
        open_firewall_port_range 80 80
      fi
      print_instructions
      if [[ -f ./wait_for_hostname.sh ]]; then
        ./wait_for_hostname.sh $HOSTNAME
      elif [[ -f ./deploy-scripts/wait_for_hostname.sh ]]; then
        ./deploy-scripts/wait_for_hostname.sh $HOSTNAME
      elif command_exists wait_for_hostname.sh; then
        wait_for_hostname.sh $HOSTNAME
      else
        bash <(curl -s https://raw.githubusercontent.com/BrowserBox/BrowserBox/boss/deploy-scripts/wait_for_hostname.sh) $HOSTNAME
      fi
    fi

    export BB_USER_EMAIL="$EMAIL"
    if [[ -f ./tls ]]; then
      ./tls $HOSTNAME
    elif [[ -f ./deploy-scripts/tls ]]; then
      ./deploy-scripts/tls $HOSTNAME
    elif command_exists tls; then
      tls $HOSTNAME
    else
      bash <(curl -s https://raw.githubusercontent.com/BrowserBox/BrowserBox/boss/deploy-scripts/tls) $HOSTNAME
    fi
  fi
}

get_hostname
get_certs
chmod 600 "$certDir"/*.pem

if [[ "$(uname)" == "Darwin" ]] && [[ -n "$darwin_needs_close" ]]; then
  echo "Removing opened firewall ports. If you use Apple iCloud Private Relay it will now be re-enabled."
  $SUDO pfctl -F all -f /etc/pf.conf
fi

get_hostname
HOSTNAME="$output"

if [[ -z "$HOSTNAME" ]]; then
echo "ERROR: Could not get a certificate. Bailing..."
exit 1
fi

if [[ "$HOSTNAME" != "localhost" ]]; then
  open_firewall_port_range "$(($PORT - 2))" "$(($PORT + 2))"
fi

# Run the container with the appropriate port mappings and capture the container ID
CONTAINER_ID=$($SUDO docker run --cap-add=sys_nice -v $HOME/sslcerts:/home/bbpro/sslcerts -d -p $PORT:$PORT -p $(($PORT-2)):$(($PORT-2)) -p $(($PORT-1)):$(($PORT-1)) -p $(($PORT+1)):$(($PORT+1)) -p $(($PORT+2)):$(($PORT+2)) --cap-add=SYS_ADMIN "${DOCKER_IMAGE_WITH_TAG}" bash -c 'source ~/.nvm/nvm.sh; pm2 delete all; sudo chown bbpro:bbpro ~/sslcerts/*; echo $(setup_bbpro --port '"$PORT"') > login_link.txt; ( bbpro || true ) && tail -f /dev/null')

echo "We will now Log You In to your container..."
echo "[Remember: you can get out of your container anytime by typing 'exit'.]"
echo "Waiting a few seconds for container to start..."
sleep 7

mkdir -p artefacts

# Wait for login_link.txt to appear in the container
MAX_WAIT=60  # Maximum wait time in seconds
SLEEP_INTERVAL=2  # Time between checks in seconds
WAITED=0

echo "Waiting for login_link.txt to be created inside the container..."
while ! $SUDO docker exec "$CONTAINER_ID" test -f /home/bbpro/bbpro/login_link.txt; do
  sleep $SLEEP_INTERVAL
  WAITED=$((WAITED + SLEEP_INTERVAL))
  if [ $WAITED -ge $MAX_WAIT ]; then
    echo "ERROR: login_link.txt not found in the container after $MAX_WAIT seconds. Exiting..." >&2
    exit 1
  fi
done

echo "login_link.txt found in the container."

# Now copy the login_link.txt file from the container
$SUDO docker cp $CONTAINER_ID:/home/bbpro/bbpro/login_link.txt artefacts/

login_link=$(cat ./artefacts/login_link.txt)

new_link=${login_link//localhost/$output}
echo ""
echo "Your Login Link"
echo "==========================================="
echo $new_link
echo "==========================================="
echo ""
echo "Container id:" $CONTAINER_ID

$SUDO docker exec -it $CONTAINER_ID bash

echo ""
echo "Your Login Link"
echo "==========================================="
echo $new_link
echo "==========================================="
echo ""
echo "Container id:" $CONTAINER_ID
echo "You are now Logged Out of your container."
echo "[Remember: you can get back in anytime from your command prompt by typing: docker exec -it $CONTAINER_ID bash]"
echo "You can stop your container with docker stop $CONTAINER_ID"
echo "Or by answering 'no' to the question below."

read -p "Do you want to keep the container running? [no/n to stop, any other key to leave running]: " user_response

if [[ "$user_response" == "no" || "$user_response" == "n" ]]; then
  echo "Stopping container (waiting up to 3 seconds)..."
  $SUDO docker stop --time 3 "$CONTAINER_ID"
  echo "Container stopped."
else
  echo "Container not stopped."
  echo "Connect to BrowserBox from a browser now by going to: $new_link"
fi

echo "Exiting BrowserBox Docker run script..."
exit 0

