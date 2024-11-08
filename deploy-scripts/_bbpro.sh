#!/usr/bin/env bash

#set -x
NODEVERSION="22"
NODE_V="v${NODEVERSION}"

install_nvm() {
  source ~/.nvm/nvm.sh
  if ! command -v nvm &>/dev/null; then
    echo "Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    source ~/.nvm/nvm.sh
    nvm install $NODE_V
  else
    nvm install $NODE_V
  fi
}

install_node() {
  install_node.sh "$NODEVERSION"
}

install_node

profile="network-latency"

USER="${USER:-$(whoami)}"

if [[ "$(uname -s)" == "Darwin" ]]; then
  if [[ "$(arch)" != "i386" ]]; then
    >&2 echo "Please run this script under Rosetta (i386 architecture)."
    #exit 1
  fi
fi

HAVE_SUDO=""

# Function to check if a command exists
command_exists() {
  command -v "$@" > /dev/null 2>&1
}

if command_exists sudo; then
  # we set -n here because setup_bbpro is designed to be used both non-interactively and by non-privileged users
  SUDO="sudo -n"
fi

check_sudo() {
  # Attempt to run a simple command using sudo that requires no real action
  # Redirect both stdout and stderr to /dev/null to suppress output
  if sudo -n true 2>/dev/null; then
    # If the command succeeds, sudo is available passwordlessly
    HAVE_SUDO="true"
  else
    # If the command fails, sudo either isn't available or requires a password
    HAVE_SUDO=""
  fi
}

# Call the function to check for passwordless sudo
check_sudo

if [ -n "$HAVE_SUDO" ]; then
  echo "Passwordless sudo is available." >&2
  SUDO="$SUDO"
else
  echo "Passwordless sudo is not available. Some things may not work, such as starting tor or opening the required ports on an internal firewall. Configure your user to possess passwordless sudo privileges if you need this, or ensure your user's BrowserBox ports are already open before running setup_bbpro." >&2
  # empty out sudo so we don't try to run stuff with it
  # in other words we try running the stuff without sudo, which may or may not work, depending on your system
  SUDO=""
fi

get_install_dir() {
  echo "Finding bbpro installation..." >&2
  install_path1=$(find /usr/local/share -name .bbpro_install_dir -print -quit 2>/dev/null)
  install_path2=$(find "${HOME}/BrowserBox" -name .bbpro_install_dir -print -quit 2>/dev/null)
  install_dir=$(dirname $install_path1)
  if [ -z "$install_dir" ]; then
    install_dir=$(dirname $install_path2)
  fi

  if [[ -z "$install_dir" ]] || [[ ! -d "$install_dir/node_modules" ]]; then
    echo "Could not find bppro. Purchase a license and run deploy-scripts/global_install.sh first">&2
    exit 1
  fi

  echo "Found bbpro at: $install_dir">&2
  echo "$install_dir"
}

has_renice_cap() {
  if groups $1 | grep &>/dev/null "\brenice\b"; then
    echo "The user $1 is a member of the renice group." >&2
    return 0
  else
    echo "The user $1 is NOT a member of the renice group." >&2
    return 1
  fi
}

function shut_pa {
  echo "Shutting down PA"
  pulseaudio -k
}

function switch_profile {
  if command -v tuned-adm; then
    echo "Tuning for low latency high performance..."
    $SUDO tuned-adm profile latency-performance
  else
    echo "You may wish to instal 'tuned' for even higher performance."
  fi
}

export INSTALL_DIR=$(get_install_dir)

if $SUDO which tuned-adm >/dev/null 2>&1; then
  echo -n "Tuning system performance for $profile..." >&2
  $SUDO tuned-adm profile $profile || switch_profile
  echo "Tuned!" >&2
fi

echo Running bbpro for user $USER... >&2

echo "Install dir: " $INSTALL_DIR >&2

cd $INSTALL_DIR

if ! has_renice_cap "$USER"; then
  echo "This user ($USER) cannot run renice."
  echo "The ability to run renice (by belonging to the renice group created by BBPRO) is necessary for proper audio functioning."
  echo "Trying to add renice capability for $USER..."

  if $SUDO -n true 2>/dev/null; then
    echo "The user has $SUDO access." >&2
    if ! $SUDO grep -q "%renice ALL=NOPASSWD:" /etc/sudoers; then
      $SUDO groupadd renice >&2
      echo "%renice ALL=NOPASSWD: /usr/bin/renice, /usr/bin/loginctl, /usr/bin/id" | $SUDO tee -a /etc/sudoers >&2
    fi
    if ! $SUDO grep -q "%browsers ALL=(ALL:browsers) NOPASSWD:" /etc/sudoers; then
      $SUDO groupadd browsers >&2
      echo "%browsers ALL=(ALL:browsers) NOPASSWD: /usr/bin/pulseaudio --start, /usr/bin/pulseaudio --start --use-pid-file=true --log-level=debug, /usr/bin/pulseaudio --check" | $SUDO tee -a /etc/sudoers >&2
    fi
    $SUDO usermod -aG renice $USER
    echo "You may need to log out and log in again, or restart your shell/terminal, for renice capability take effect."
  else
    echo "The user does not have $SUDO access. We cannot add renice capability for this user." >&2
    echo "Manually add $USER to group renice." >&2
  fi
fi

shut_pa
switch_profile

bash ./scripts/run-test.sh

