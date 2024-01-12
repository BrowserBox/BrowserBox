#!/bin/bash

# Detect operating system
OS=$(uname)
ZONE=""

if command -v firewall-cmd; then
  ZONE="$(sudo firewall-cmd --get-default-zone)"
fi

## Check if running on macOS
#if [ "$OS" == "Darwin" ]; then
#  echo "WARNING: Running this Docker container is currently not supported on macOS due to a dependency issue."
#  echo "If you would like to star the repo and follow the issue, please visit: https://github.com/WonderInventions/node-webrtc/issues/3"
#  echo "To run on Mac, please follow the regular (non-Docker) instructions at: https://github.com/BrowserBox/BrowserBox"
#  exit 1
#fi

# Check for root or sudo capabilities
if [[ $EUID -eq 0 ]]; then
  echo "Running as root."
elif sudo -n true 2>/dev/null; then
  echo "Has sudo capabilities."
else
  echo "This script requires root privileges or sudo capabilities." 1>&2
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
certDir="$HOME/sslcerts"
certFile="$certDir/fullchain.pem"
keyFile="$certDir/privkey.pem"

# Function to print instructions
print_instructions() {
  echo "Here's what you need to do:"
  echo "1. Create a directory named 'sslcerts' in your home directory. You can do this by running 'mkdir ~/sslcerts'."
  echo "2. Obtain your SSL certificate and private key files. You can use 'mkcert' for localhost, or 'Let's Encrypt' for a public hostname."
  echo "We provide a convenience script in BrowserBox/deploy-scripts/tls to obtain LE certs. It will automatically put get cert and put in right place"
  echo "3. Place your certificate in the 'sslcerts' directory with the name 'fullchain.pem'."
  echo "4. Place your private key in the 'sslcerts' directory with the name 'privkey.pem'."
  echo "5. Ensure these files are for the domain you want to serve BrowserBox from (i.e., the domain of the current machine)."
}

# Check if directory exists and if certificate and key files exist
if [ -d "$certDir" ]; then
    if [ -f "$certFile" ] && [ -f "$keyFile" ]; then
        chmod 644 $certDir/*.pem
        echo "Great job! Your SSL/TLS/HTTPS certificates are all set up correctly. You're ready to go!"
    else
        echo "Almost there! Your 'sslcerts' directory exists, but it seems you're missing some certificate files."
        print_instructions
        exit 1
    fi
else
    echo "Looks like you're missing the 'sslcerts' directory."
    print_instructions
    exit 1
fi

# Define Docker image details
DOCKER_IMAGE="ghcr.io/browserbox/browserbox"
DOCKER_TAG="latest"
DOCKER_IMAGE_WITH_TAG="${DOCKER_IMAGE}:${DOCKER_TAG}"

# Check if the Docker image is already present
if ! sudo docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^${DOCKER_IMAGE_WITH_TAG}$"; then
  echo "Docker image not found locally. Pulling from repository..."
  sudo docker pull "${DOCKER_IMAGE_WITH_TAG}"
else
  echo "Docker image already exists locally."
fi

# Get the hostname
ssl_dir="$HOME/sslcerts"
output=""

if [[ -f "$ssl_dir/privkey.pem" && -f "$ssl_dir/fullchain.pem" ]]; then
  hostname=$(openssl x509 -in "${ssl_dir}/fullchain.pem" -noout -text | grep -A1 "Subject Alternative Name" | tail -n1 | sed 's/DNS://g; s/, /\n/g' | head -n1 | awk '{$1=$1};1')
  echo "Hostname: $hostname" >&2
  output="$hostname"
else
  ip_address=$(hostname -I | awk '{print $1}')
  echo "IP Address: $ip_address" >&2
  output="$ip_address"
fi

echo "$output"

# Get the PORT argument
PORT=$1

# Validate that PORT is a number
if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
  echo "Error: PORT must be a number."
  echo "Usage: " $0 "<PORT>"
  exit 1
else
  echo "Setting main port to: $PORT"
fi

open_firewall_port_range() {
    local start_port=$1
    local end_port=$2

    # Check for firewall-cmd (firewalld)
    if command -v firewall-cmd &> /dev/null; then
        echo "Using firewalld"
        firewall-cmd --zone="$ZONE" --add-port=${start_port}-${end_port}/tcp --permanent
        firewall-cmd --reload

    # Check for ufw (Uncomplicated Firewall)
    elif command -v ufw &> /dev/null; then
        echo "Using ufw"
        ufw allow ${start_port}:${end_port}/tcp

    else
        echo "No recognized firewall management tool found"
        return 1
    fi
}

open_firewall_port_range "$(($PORT - 2))" "$(($PORT + 2))"

# Run the container with the appropriate port mappings and capture the container ID
CONTAINER_ID=$(sudo docker run -v $HOME/sslcerts:/home/bbpro/sslcerts -d -p $PORT:$PORT -p $(($PORT-2)):$(($PORT-2)) -p $(($PORT-1)):$(($PORT-1)) -p $(($PORT+1)):$(($PORT+1)) -p $(($PORT+2)):$(($PORT+2)) --cap-add=SYS_ADMIN "${DOCKER_IMAGE_WITH_TAG}" bash -c 'source ~/.nvm/nvm.sh; pm2 delete all; echo $(setup_bbpro --port '"$PORT"') > login_link.txt; ( bbpro || true ) && tail -f /dev/null')

echo "Waiting a few seconds for container to start..."
sleep 7

mkdir -p artefacts
sudo docker cp $CONTAINER_ID:/home/bbpro/bbpro/login_link.txt artefacts/
login_link=$(cat ./artefacts/login_link.txt)

new_link=${login_link//localhost/$output}
echo $new_link
echo "Container id:" $CONTAINER_ID

sudo docker exec -it $CONTAINER_ID bash

echo $new_link
echo "Container id:" $CONTAINER_ID

read -p "Do you want to keep running the container? (no/n to stop, any other key to leave running): " user_response

if [[ $user_response == "no" || $user_response == "n" ]]; then
  echo "Stopping container..."
  sudo docker stop --time 1 "$CONTAINER_ID"
  echo "Container stopped."
else
  echo "Container not stopped."
fi

