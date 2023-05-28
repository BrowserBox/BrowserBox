#!/usr/bin/env bash

HOMEROOT=$(dirname $HOME)

function get_config_dir() {
  user="$1"
  config_dir=$HOMEROOT/$user/.config/dosyago/bbpro
  echo $config_dir
}
users=$(ls -1 $HOMEROOT | grep ^user)

echo [
let i=0
for user in $users; do
  config_dir=$(get_config_dir $user)
  login_link_file=$config_dir/login.link
  login_link=$(cat $login_link_file)
  pidFile=$config_dir/app*.pid
  pid=$(cat $pidFile)
  notice_file=$config_dir/notices/text
  if [ $i -gt 0 ]; then
    comma=","
  else
    comma=""
  fi
  echo "  "$comma 
  echo "  "[ '"'$login_link'"', '"'$pid'"', '"'$notice_file'"' ]
  i=$(($i + 1))
done
echo ]


