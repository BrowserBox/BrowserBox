#!/usr/bin/env bash

cd $HOME
if [ ! -d BrowserBox ]; then
  git clone https://github.com/BrowserBox/BrowserBox
fi

cd BrowserBox
git add .
git stash
git pull
git stash drop
npm run clean
yes | npm i
npm run parcel
./deploy-scripts/copy_install.sh
echo "Updated at $date" > ~/.config/dosyago/bbpro/update.note

# options for restart
# notify user if update available and check if they want to restart now (they could be in middle of something)
# Restart automatically if message not canceled


