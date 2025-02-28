#!/usr/bin/env bash

echo
echo Reinstalling BrowserBox and dependencies...
echo
echo
echo Upgrading system...
echo
sudo $APT update && sudo $APT -y upgrade
echo
echo System upgraded!
echo
echo Upgrading BrowserBox dependencies...
echo
./upgrade.sh
echo 
echo BrowserBox dependencies upgraded!
echo
echo
echo Everything reinstalled and updated!
echo
echo Exiting...
echo
exit 0
