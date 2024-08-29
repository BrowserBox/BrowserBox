#!/usr/bin/env bash

echo "starting watching..."
./start_watcher.sh

echo "Starting pulseaudio"
sudo -g browsers pulseaudio -k
sudo -g browsers pulseaudio --start

username=$(whoami)
echo "Starting viewfinder service cluster as $username"

node -v
node=$(which node)
echo Using $node

echo "Starting parec-server"
cd parec-server
pm2 start ./parec-server.sh
cd ..

echo "Starting pptr-console-server"
cd pptr-console-server
pm2 start ./pptr-console-server.sh

echo "Starting chat server"
cd websocket_chat_app
pm2 start ./chat-server.sh
cd ..
cd ..

echo "Starting crdp-secure-proxy-server"
cd crdp-secure-proxy-server
pm2 start ./devtools-server.sh
cd ..

echo "Starting main process, viewfinder, in foreground"
pm2 start ./main-vf-service.sh

