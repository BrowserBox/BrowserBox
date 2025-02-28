#!/bin/sh 

echo 
echo

sudo iptables -t nat --line-numbers -n -L

echo
echo
echo "To remove the rule for redirect do something like 'iptables -t nat -D PREROUTING x'"
echo "Where x is the line number of the redirect rule you want to remove"
echo
