#!/usr/bin/env bash

# Check if the OS is macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
  echo "This script is intended only for macOS."
  exit 1
fi

# Proceed with AWS CLI installation
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
rm AWSCLIV2.pkg
aws --version
aws configure

