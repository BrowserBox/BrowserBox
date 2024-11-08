#!/usr/bin/env bash

SUDO=""

if command -v sudo; then
  SUDO="sudo"
  if sudo -n true &>/dev/null; then
    SUDO="sudo -n"
  else
    SUDO="sudo"
  fi
fi

if command -v node; then
  echo "node installed"
else
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | $SUDO -E bash -
  $SUDO bash -c "source ~/.nvm/nvm.sh; nvm install v22"
fi

if ! command -v pm2; then
  $SUDO bash -c "source ~/.nvm/nvm.sh; npm i -g pm2@latest"
fi

$SUDO cp ./scripts/commands/* /usr/local/bin/

# Edit the $SUDOers file to allow members of the "renice" group to run the "renice" command
if ! $SUDO grep -q "%renice ALL=NOPASSWD:" /etc/sudoers; then
  $SUDO groupadd renice >&2
  echo "%renice ALL=NOPASSWD: /usr/bin/renice, /usr/bin/loginctl, /usr/bin/id" | $SUDO tee -a /etc/sudoers >&2
fi
if ! $SUDO grep -q "%browsers ALL=(ALL:browsers) NOPASSWD:" /etc/sudoers; then
  $SUDO groupadd browsers >&2
  echo "%browsers ALL=(ALL:browsers) NOPASSWD: /usr/bin/pulseaudio --start" | $SUDO tee -a /etc/sudoers >&2
  echo "%browsers ALL=(ALL:browsers) NOPASSWD: /usr/bin/pulseaudio --start --use-pid-file=true --log-level=debug, /usr/bin/pulseaudio --check" | $SUDO tee -a /etc/sudoers >&2
fi


if [ "$GITHUB_ACTIONS" == "true" ]; then
  echo "we are in github action, and the doc viewer will not be accessible, so we don't set it up. This is normal."
  exit 0
fi

#I don't think we need these anymore
#echo -n "Set up quota user to have 5G 5G and 2m 2m block and inode limit."
#read -p " Enter to continue "
#$SUDO ./scripts/commands/newuser.sh quotauser

