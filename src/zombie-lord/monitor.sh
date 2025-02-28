#!/usr/bin/env bash

echo "Full command line for $1..."

for PRID in `/bin/ps  -ax | /bin/grep $1 | /bin/grep -v grep | /bin/grep -v 
monitor.sh | /bin/gawk '{ print $1 }'`
do
 /bin/cat /proc/$PRID/cmdline | /bin/gawk -F[[:cntrl:]] '{ for ( i = 1; i < 
 NF+1; i++ ) printf( "%s ", $i ) } { print "n" }'

done
