#!/usr/bin/env bash

# Function to read CR_PAT from stdin if not already an environment variable
read_token() {
  if [ -z "${CR_PAT}" ]; then
    echo "CR_PAT is not set. Please enter your GitHub Container Registry Personal Access Token:"
    echo "If you do not have a token, please create one at https://github.com/settings/tokens"
    read -r CR_PAT
  fi
}

# Function to log in to GitHub Container Registry
ghcr_login() {
  echo "Logging in to GitHub Container Registry..."
  echo "$CR_PAT" | docker login ghcr.io -u USERNAME --password-stdin
}

# Function to tag the Docker image
tag_image() {
  echo "Please enter the version to tag with (e.g., v1.0):"
  read -r version
  docker tag bbpro:latest ghcr.io/browserbox/browserbox:$version
}

# Function to push the Docker image to the registry
push_image() {
  echo "Pushing image to GitHub Container Registry..."
  docker push ghcr.io/browserbox/browserbox:$version
}

# Main execution flow
read_token
ghcr_login
tag_image
push_image

echo "Docker image has been tagged and pushed successfully."

