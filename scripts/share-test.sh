#!/usr/bin/env bash

username=$(whoami)
echo "Starting viewfinder service cluster as $username"

echo "Trapping SIGINT to kill 2 child-processes: pptr-console-server \
 and crdp-secure-proxy-server."
#trap 'kill $BGPID1; kill $BGPID2; kill $BGPID3; kill $BGPID4; exit' SIGINT 
trap 'kill $BGPID2; kill $BGPID4; kill $BGPID5; exit' SIGINT 

node -v
node=$(which node)

export MAX_CONN=500

##echo "Loading nvm"
##cd $HOME
##source .nvm/nvm.sh
##source .profile
##source .bashrc
##cd $HOME/vf
##
##unset npm_config_prefix

echo "Starting pulseaudio"
sudo -g browsers pulseaudio -k
sudo -g browsers pulseaudio --start
#
echo "Starting parec-server"
cd parec-server
sudo -g browsers $node index.js 8000 rtp.monitor xxxcookie 9rPiEJACvvcfG &
BGPID1=$!
cd ..

echo "Starting pptr-console-server"
cd pptr-console-server
sudo -g browsers $node index.js 8001 xxxcookie 9rPiEJACvvcfG &
BGPID2=$!

echo "Starting chat server"
cd websocket_chat_app
sudo -g browsers $node index.js 8004 xxxcookie 9rPiEJACvvcfG&
BGPID5=$!
cd ..

cd ..
#echo "[Test Only] starting users service"
#cd capi.click
#sudo npm start &
#BGPID3=$!
#cd ..

echo "Starting crdp-secure-proxy-server"
cd crdp-secure-proxy-server
$node index.js 8003 xxxcookie 9rPiEJACvvcfG &
BGPID4=$!
cd ..

echo "Starting main process, viewfinder, in foreground"
$node server.js 5002 8002 xxxcookie $username 9rPiEJACvvcfG
