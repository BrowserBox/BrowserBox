#!/bin/bash

# Create dpkg configuration
echo "Creating dpkg configuration..."
sudo mkdir -p /etc/dpkg/dpkg.cfg.d/
cat <<EOF | sudo tee /etc/dpkg/dpkg.cfg.d/force-conf >/dev/null
confdef
confold
EOF

# Create apt configuration
echo "Creating apt configuration..."
sudo mkdir -p /etc/apt/apt.conf.d/
cat <<EOF | sudo tee /etc/apt/apt.conf.d/99force-yes >/dev/null
APT::Get::Assume-Yes "true";
APT::Get::force-yes "true";
EOF

echo "Configurations applied successfully."

