#!/usr/bin/env bash

echo
echo Reinstalling BrowsreBox and dependencies...
echo
echo
echo Upgrading system...
echo
sudo apt update && sudo apt -y upgrade
echo
echo System upgraded!
echo
echo Upgrading BrowsreBox dependencies...
echo
./upgrade.sh
echo 
echo BrowsreBox dependencies upgraded!
echo
echo
echo Everything reinstalled and updated!
echo
echo Exiting...
echo
exit 0
