#!/usr/bin/env bash

# Exporting StackScript UDF variables for local testing
export SIGNATURE="yes"
export USEREMAIL="$1"
export INSTALL_DOC_VIEWER="false"
export HOSTNAME="$2"
export TOKEN="sampleToken123"

echo "Environment variables set for local testing:"
echo "SIGNATURE=$SIGNATURE"
echo "USEREMAIL=$USEREMAIL"
echo "INSTALL_DOC_VIEWER=$INSTALL_DOC_VIEWER"
echo "HOSTNAME=$HOSTNAME"
echo "TOKEN=$TOKEN"

