#!/bin/bash

# Exporting StackScript UDF variables for local testing
export signature="yes"
export useremail="$1"
export install_doc_viewer="false"
export hostname="$2"
export token="sampleToken123"

echo "Environment variables set for local testing:"
echo "signature=$signature"
echo "useremail=$useremail"
echo "install_doc_viewer=$install_doc_viewer"
echo "hostname=$hostname"
echo "token=$token"

./StackScript
