#!/usr/bin/env bash

let audio=$2-2
let console=$2-1
let devtools=$2+1
let chat=$2+2

username=$(whoami)
echo "Starting viewfinder service cluster as $username"

echo "Trapping SIGINT to kill 3 child-processes: parec-server, pptr-console-server 
and crdp-secure-proxy-server."
trap 'kill $BGPID1; kill $BGPID2; kill $BGPID3; exit' SIGINT 

echo "Loading nvm"
cd $HOME
source .nvm/nvm.sh
source .profile
source .bashrc
cd $HOME/vf

node=$(which node)

echo "Starting pulseaudio"
sudo -g browsers pulseaudio -k
sudo -g browsers pulseaudio --start

echo "Starting parec-server"
cd parec-server
pwd
sudo -g browsers $node index.js $audio rtp.monitor $3 $5 &
BGPID1=$!
cd ..

echo "Starting pptr-console-server"
cd pptr-console-server
pwd
sudo -g browsers $node index.js $console $3 $5 &
BGPID2=$!

echo "Starting chat server"
cd websocket_chat_app
pwd
sudo -g browsers $node index.js $chat $3 $5 &
BGPID5=$!
cd ..

cd ..

# The below two services cannot run in browsers group
# because they both need access to the 5000-7999 ports
# perhaps in future a separate cgroup for resource usage can be used on them
# but in fact that's not needed
# because they already run (sudo cgexec - ... browsers) within the "browsers" cgroup
# the browsers "cgroup" and the user group "browsers" are actually distinct things
# so this is all good and as good as it can be
# and also
# FUCK YEAH! :P ;) xx I FUCKING ROCK

echo "Starting crdp-secure-proxy-server"
cd crdp-secure-proxy-server
pwd
$node index.js $devtools $3 $5 &
BGPID3=$!
cd ..

echo "Starting main process, viewfinder, in foreground"
pwd
$node server.js $1 $2 $3 $username $5
