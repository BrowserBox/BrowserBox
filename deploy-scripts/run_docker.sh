#!/bin/bash

# Get the PORT argument
PORT=$1

# Validate that PORT is a number
if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
    echo "Error: PORT must be a number."
    exit 1
fi

# Run the container with the appropriate port mappings and capture the container ID
CONTAINER_ID=$(docker run -v $HOME/sslcerts:/home/bbpro/sslcerts -d -p $PORT:8080 -p $(($PORT-2)):8078 -p $(($PORT-1)):8079 -p $(($PORT+1)):8081 -p $(($PORT+2)):8082 --cap-add=SYS_ADMIN bbpro-v4)

# Wait for a few seconds to make sure the container is up and running
sleep 1

# Copy login_link.txt from the container to the current directory
docker cp $CONTAINER_ID:/home/bbpro/bbpro/login_link.txt artefacts/

# Print the contents of login_link.txt
login_link=$(cat ./artefacts/login_link.txt)

echo $login_link
echo "Container id:" $CONTAINER_ID

docker exec -it $CONTAINER_ID bash

echo $login_link
echo "Container id:" $CONTAINER_ID

# Ask the user if they want to stop the container
read -p "Do you want to stop the container? (yes/y to stop, any other key to cancel): " user_response

if [[ $user_response == "yes" || $user_response == "y" ]]; then
  # Stop the container with time=1
  echo "Stopping container..."
  docker stop --time 1 "$CONTAINER_ID"
  echo "Container stopped."
else
  echo "Container not stopped."
fi

