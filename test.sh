#!/bin/bash

username=$(whoami)
sudo cgexec -g memory,cpu:browsers sudo -u $username nodemon index.js 5002 8002 xxxcookie $username token2
