#!/usr/bin/env bash

SUDO=""
if command -v sudo &>/dev/null; then
  SUDO="sudo -n"
fi

if ! $SUDO true &>/dev/null; then
  echo "Config script non-interactive.sh called by $0 requires passwordless sudo permissions." >&2
  echo "please run with such." >&2
  echo "returning to caller..." >&2
  return 1
fi

export NEEDRESTART_MODE=a
export DEBIAN_FRONTEND=noninteractive
unset UCF_FORCE_CONFOLD
export UCF_FORCE_CONFNEW=YES
$SUDO ucf --purge /boot/grub/menu.lst >&2

set_grub_install_device() {
  # Use findmnt to directly get the root device
  ROOT_DEVICE=$(findmnt -n -o SOURCE /)

  # Ensure the device is not empty
  if [ -z "$ROOT_DEVICE" ]; then
    echo "Unable to find the root device for GRUB installation." >&2
    return 1
  fi

  # Set the device for GRUB installation using debconf-set-selections
  echo "grub-pc grub-pc/install_devices string $ROOT_DEVICE" | sudo debconf-set-selections >&2

  echo "If grub is updated, it will be installed on: $ROOT_DEVICE" >&2
}

# Call the function
set_grub_install_device

# Create dpkg configuration
echo "Creating dpkg configuration..." >&2
$SUDO mkdir -p /etc/dpkg/dpkg.cfg.d/
cat <<EOF | $SUDO tee /etc/dpkg/dpkg.cfg.d/force-conf >/dev/null
force-confdef
force-confnew
EOF

# Create apt configuration
echo "Creating apt configuration..." >&2
$SUDO mkdir -p /etc/apt/apt.conf.d/
cat <<EOF | $SUDO tee /etc/apt/apt.conf.d/99non-interactive >/dev/null
APT::Get::Assume-Yes "true";
APT::Get::allow-unauthenticated "true";
APT::Get::allow-downgrades "true";
APT::Get::allow-remove-essential "true";
APT::Get::allow-change-held-packages "true";
EOF

# Create needrestart custom configuration
echo "Creating needrestart custom configuration..." >&2
$SUDO mkdir -p /etc/needrestart/conf.d
cat <<EOF | $SUDO tee /etc/needrestart/conf.d/no-prompt.conf >/dev/null
\$nrconf{kernelhints} = -1;
\$nrconf{restart} = 'a';
EOF

# Perform a non-interactive dist-upgrade
$SUDO apt-get dist-upgrade -o Dpkg::Options::="--force-confnew" --yes -yqq >&2

# Install debconf-utils and set it to restart libraries without asking
$SUDO apt-get install -y debconf-utils >&2
echo '* libraries/restart-without-asking boolean true' | $SUDO debconf-set-selections >&2

echo "Configurations applied successfully." >&2

