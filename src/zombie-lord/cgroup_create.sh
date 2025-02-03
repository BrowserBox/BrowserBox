#!/usr/bin/env bash

# Run this when setting up a machine to be a browser server

# create a browser cpu group that all out browsers will be in 
sudo cgcreate -g cpu,memory:/browsers

# set browsers to share 1000 parts of cpu (out of the system total of 1024)
# Around 98% total
sudo cgset -r cpu.shares=1000 browsers

#set memory to be 75% out of total system memory
let "x = $( free -b | awk '/Mem\:/ { print $2 }')"
let mem_share=($x*75)/100
echo $mem_share

sudo cgset -r memory.limit_in_bytes=$mem_share browsers
