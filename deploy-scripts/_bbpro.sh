#!/usr/bin/env bash

get_install_dir() {
  echo "Finding bbpro installation..." >&2
  install_path1=$(find /usr/local/share -name .bbpro_install_dir -print -quit 2>/dev/null)
  install_path2=$(find $HOME -name .bbpro_install_dir -print -quit 2>/dev/null)
  install_dir=$(dirname $install_path1)
  if [ -z "$install_dir" ]; then
    install_dir=$(dirname $install_path2)
  fi
  if [ -z "$install_dir" ]; then
    echo "Could not find bppro. Purchase a license and run deploy-scripts/global_install.sh first">&2
    exit 1
  fi
  echo "Found bbpro at: $install_dir">&2

  echo $install_dir
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

export INSTALL_DIR=$(get_install_dir)

echo Running bbpro for user $USER... >&2

echo "Install dir: " $INSTALL_DIR >&2

cd $INSTALL_DIR

if !has_renice_cap "$USER"; then
  echo "This user ($USER) cannot run renice."
  echo "The ability to run renice (by belonging to the renice group created by BBPRO) is necessary for proper audio functioning."
  echo "Trying to add renice capability for $USER..."

  if sudo -n true 2>/dev/null; then
    echo "The user has sudo access." >&2
    if ! sudo grep -q "%renice ALL=(ALL) NOPASSWD:" /etc/sudoers; then
      sudo groupadd renice >&2
      echo "%renice ALL=NOPASSWD: /usr/bin/renice, /usr/bin/loginctl, /usr/bin/id" | sudo tee -a /etc/sudoers >&2
    fi
    sudo usermod -aG renice $USER
    echo "You may need to log out and log in again, or restart your shell/terminal, for renice capability take effect."
  else
    echo "The user does not have sudo access. We cannot add renice capability for this user." >&2
    echo "Manually add $USER to group renice." >&2
  fi
fi

bash ./scripts/run-test.sh

