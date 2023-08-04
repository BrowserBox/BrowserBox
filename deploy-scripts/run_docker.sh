#!/bin/bash

# Do not remove this file

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
  echo "3. Place your certificate in the 'sslcerts' directory with the name 'fullchain.pem'."
  echo "4. Place your private key in the 'sslcerts' directory with the name 'privkey.pem'."
  echo "5. Ensure these files are for the domain you want to serve BrowserBoxPro from (i.e., the domain of the current machine)."
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
CONTAINER_ID=$(docker run -v $HOME/sslcerts:/home/bbpro/sslcerts -d -p $PORT:8080 -p $(($PORT-2)):8078 -p $(($PORT-1)):8079 -p $(($PORT+1)):8081 -p $(($PORT+2)):8082 --cap-add=SYS_ADMIN ghcr.io/dosyago/browserboxpro:v4)

# Wait for a few seconds to make sure the container is up and running
echo "Waiting a few seconds for container to start..."
sleep 3

# Copy login_link.txt from the container to the current directory
mkdir -p artefacts
docker cp $CONTAINER_ID:/home/bbpro/bbpro/login_link.txt artefacts/

# Print the contents of login_link.txt
login_link=$(cat ./artefacts/login_link.txt)

echo $login_link
echo "Container id:" $CONTAINER_ID

docker exec -it $CONTAINER_ID bash

echo $login_link
echo "Container id:" $CONTAINER_ID

# Ask the user if they want to stop the container
read -p "Do you want to keep running the container? (no/n to stop, any other key to leave running): " user_response

if [[ $user_response == "no" || $user_response == "n" ]]; then
  # Stop the container with time=1
  echo "Stopping container..."
  docker stop --time 1 "$CONTAINER_ID"
  echo "Container stopped."
else
  echo "Container not stopped."
fi

