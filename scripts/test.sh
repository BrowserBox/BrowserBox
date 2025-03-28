#!/usr/bin/env bash

username=$(whoami)
echo "Starting viewfinder service cluster as $username"

echo "Trapping SIGINT to kill 4 child-processes: parec-server, pptr-console-server, \
 and crdp-secure-proxy-server."
#trap 'kill $BGPID1; kill $BGPID2; kill $BGPID3; kill $BGPID4; exit' SIGINT 
trap 'kill $BGPID1; kill $BGPID2; kill $BGPID4; exit' SIGINT 

node -v
node=$(which node)

echo "Starting pulseaudio"
pulseaudio -k
pulseaudio --start

echo "Starting parec-server"
cd parec-server
sudo -g browsers $node index.js 8000 &
BGPID1=$!
cd ..

echo "Starting pptr-console-server"
cd pptr-console-server
sudo -g browsers $node index.js 8001 xxxcookie token2 &
BGPID2=$!
cd ..

#echo "[Test Only] starting users service"
#cd capi.click
#sudo npm start &
#BGPID3=$!
#cd ..

echo "Starting crdp-secure-proxy-server"
cd crdp-secure-proxy-server
sudo -g browsers $node index.js 8003 xxxcookie token2 &
BGPID4=$!
cd ..

echo "Starting main process, viewfinder, in foreground"
sudo -g browsers $node index.js 5002 8002 xxxcookie $username token2
