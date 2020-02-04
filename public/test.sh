#!/bin/bash

trap 'sudo kill $BGPID; exit' SIGINT 

serve -p 8080 &
BGPID=$!
#nodemon -e js ./update_render.js
wait
