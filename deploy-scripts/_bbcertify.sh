#!/usr/bin/env bash

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <apiKey>|options" >&2
  echo "" >&2
  echo "<apiKey>            Obtain a new ticket for the first available seat and write to stdout using <apiKey>" >&2
  echo "--release           Release the current ticket in certificate.json" >&2
  echo "--user <username>   A convenience method to write the ticket to the correct location in <username>'s home directory" >&2
  echo "" >&2
  exit 1
fi

apiKey="$1"

# logic

make a call to the api server

to get a ticket for the seat

the seat will be the first free seat available

the ticket will be written to stdout

optionally if you supply a username

we will obtain the users home directory in a platform independent way (getent, or sudo -u $username bash -c 'echo $HOME', or whatever)

and we will then write the ticket to 

$HOME/.config/dosyago/bbpro/certificate.json

you can also call --release to make a call to the server to release this ticket

This should be called after you shutdown BrowserBox. (BrowserBox tries to call it automatically in stop_bbpro, but in some cases it may not be called, if the process exited unexpectedly).

In a multi user set up bb_certify should be used by the privileged user to allocate a ticket for a non privileged user, using the organization's api key, and should then supply the non privileged user with the ticket to permit them to run BrowserBox

assume the server is hosted on https://license.dosaygo.com

the routes will be specified later for the relevant functions but you can just make guesses for now 

This script uses bash best practices and does not need to be run as a sudo user







