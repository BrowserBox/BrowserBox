#!/usr/bin/env bash


{ # get script #

echo Update distro
sudo apt update && sudo apt -y upgrade
echo Install tools
sudo apt install -y curl wget git
echo Install node version manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
echo Load NVM
source /home/cris/.profile
source /home/cris/.nvm/nvm.sh
echo Install latest NodeJS
nvm install --lts
echo Install latest Node Package Manager
npm i -g npm
echo Setup ViewFinderJS
git clone https://github.com/crisdosyago/ViewFinderJS.git
cd ViewFinderJS
npm i
} # script got #
