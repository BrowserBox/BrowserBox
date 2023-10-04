#!/usr/bin/env bash

if [[ "$(uname -s)" == "Darwin" ]]; then
  if [[ "$(arch)" != "i386" ]]; then
    >&2 echo "Please run this script under Rosetta (i386 architecture)."
    exit 1
  fi
fi

get_install_dir() {
  # Find potential directories containing .bbpro_install_dir
  pwd="$(pwd)"
  install_path1=$(find $pwd -name .bbpro_install_dir -print 2>/dev/null)
  current_version=$(jq -r '.version' ./package.json)

  # Loop through each found path to check if node_modules also exists in the same directory
  IFS=$'\n'  # Change Internal Field Separator to newline for iteration
  for path in $install_path1; do
    dir=$(dirname $path)
    if [ -d "$dir/node_modules" ]; then
      # Get the version of the found directory's package.json
      found_version=$(jq -r '.version' "${dir}/package.json")

      # Check if the found version is the same or later than the current version
      if [[ $(echo -e "$current_version\n$found_version" | sort -V | tail -n1) == "$found_version" ]]; then
        echo "$dir"
        return 0
      fi
    fi
  done

  install_path2=$(find $HOME -name .bbpro_install_dir -print 2>/dev/null)
  IFS=$'\n'  # Change Internal Field Separator to newline for iteration
  for path in $install_path2; do
    dir=$(dirname $path)
    if [ -d "$dir/node_modules" ]; then
      # Get the version of the found directory's package.json
      found_version=$(jq -r '.version' "${dir}/package.json")

      # Check if the found version is the same or later than the current version
      if [[ $(echo -e "$current_version\n$found_version" | sort -V | tail -n1) == "$found_version" ]]; then
        echo "$dir"
        return 0
      fi
    fi
  done

  echo "No valid install directory found."
  return 1
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

if ! has_renice_cap "$USER"; then
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

