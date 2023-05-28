#!/usr/bin/env bash

killall chrome
killall -9 chrome

node=$(which node)

#$node --inspect=0.0.0.0:8080 server.js 5002 8002 xxxcookie $username 9rPiEJACvvcfG
#nodemon server.js 5002 8002 xxxcookie $username 9rPiEJACvvcfG
$node server.js 5002 8002 xxxcookie $username 9rPiEJACvvcfG
