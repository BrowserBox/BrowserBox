#!/bin/bash

# Get the PORT argument
PORT=$1

# Validate that PORT is a number
if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
    echo "Error: PORT must be a number."
    exit 1
fi

# Run the container with the appropriate port mappings and capture the container ID
CONTAINER_ID=$(docker run -v $HOME/sslcerts:/home/bbpro/sslcerts -d -p $PORT:8080 -p $(($PORT-2)):8078 -p $(($PORT-1)):8079 -p $(($PORT+1)):8081 -p $(($PORT+2)):8082 bbpro-v3)

# Wait for a few seconds to make sure the container is up and running
sleep 1

# Copy login_link.txt from the container to the current directory
docker cp $CONTAINER_ID:/home/bbpro/bbpro/login_link.txt .

# Print the contents of login_link.txt
cat ./login_link.txt

