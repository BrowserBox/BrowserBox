#!/bin/bash

username="$1"
subid="$2"
group="appusers"

echo '{"subid":"'$subid'"}' > /home/$username/userData.json
sudo cp -r ../../dosy-browser /home/$username
sudo chown -R $username:$group /home/$username/dosy-browser

