#!/bin/bash

# Create dpkg configuration
echo "Creating dpkg configuration..."
sudo mkdir -p /etc/dpkg/dpkg.cfg.d/
cat <<EOF | sudo tee /etc/dpkg/dpkg.cfg.d/force-conf >/dev/null
force-confdef
force-confnew
EOF

# Create apt configuration
echo "Creating apt configuration..."
sudo mkdir -p /etc/apt/apt.conf.d/
cat <<EOF | sudo tee /etc/apt/apt.conf.d/99non-interactive >/dev/null
APT::Get::Assume-Yes "true";
APT::Get::allow-unauthenticated "true";
APT::Get::allow-downgrades "true";
APT::Get::allow-remove-essential "true";
APT::Get::allow-change-held-packages "true";
EOF

echo "Configurations applied successfully."

