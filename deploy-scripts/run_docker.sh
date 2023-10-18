#!/bin/bash

# Detect operating system
OS=$(uname)

# Check if running on macOS
if [ "$OS" == "Darwin" ]; then
  echo "WARNING: Running this Docker container is currently not supported on macOS due to a dependency issue."
  echo "If you would like to star the repo and follow the issue, please visit: https://github.com/WonderInventions/node-webrtc/issues/3"
  echo "To run on Mac, please follow the regular (non-Docker) instructions at: https://github.com/BrowserBox/BrowserBox"
  exit 1
fi

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

# Check if directory exists
# Check if certificate and key files exist
if [ -d "$certDir" ]; then
    if [ -f "$certFile" ] && [ -f "$keyFile" ]; then
        # the read permission is so the key file can be used by the application
        # inside the container
        # otherwise HTTPS won't work and that breaks the app
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

# Get the hostname

# Define the path to the SSL certificates
ssl_dir="$HOME/sslcerts"

output=""

# Check if the SSL certificates exist
if [[ -f "$ssl_dir/privkey.pem" && -f "$ssl_dir/fullchain.pem" ]]; then
  # Extract the Common Name (hostname) from the certificate
  hostname=$(openssl x509 -in "${ssl_dir}/fullchain.pem" -noout -text | grep -A1 "Subject Alternative Name" | tail -n1 | sed 's/DNS://g; s/, /\n/g' | head -n1 | awk '{$1=$1};1')
  echo "Hostname: $hostname" >&2
  output="$hostname"
else
  # Get the IP address (you can also use other methods to get the IP)
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

# Run the container with the appropriate port mappings and capture the container ID
CONTAINER_ID=$(sudo docker run -v $HOME/sslcerts:/home/bbpro/sslcerts -d -p $PORT:8080 -p $(($PORT-2)):8078 -p $(($PORT-1)):8079 -p $(($PORT+1)):8081 -p $(($PORT+2)):8082 --cap-add=SYS_ADMIN ghcr.io/browserbox/browserbox:v5 bash -c 'echo $(setup_bbpro --port 8080) > login_link.txt; ( bbpro || true ) && tail -f /dev/null')

# Wait for a few seconds to make sure the container is up and running
echo "Waiting a few seconds for container to start..."
sleep 7

# Copy login_link.txt from the container to the current directory
mkdir -p artefacts
sudo docker cp $CONTAINER_ID:/home/bbpro/bbpro/login_link.txt artefacts/

# Print the contents of login_link.txt
login_link=$(cat ./artefacts/login_link.txt)

#echo $login_link
new_link=${login_link//localhost/$output}
echo $new_link
echo "Container id:" $CONTAINER_ID

sudo docker exec -it $CONTAINER_ID bash

#echo $login_link
echo $new_link
echo "Container id:" $CONTAINER_ID

# Ask the user if they want to stop the container
read -p "Do you want to keep running the container? (no/n to stop, any other key to leave running): " user_response

if [[ $user_response == "no" || $user_response == "n" ]]; then
  # Stop the container with time=1
  echo "Stopping container..."
  sudo docker stop --time 1 "$CONTAINER_ID"
  echo "Container stopped."
else
  echo "Container not stopped."
fi
