#!/usr/bin/env bash

. /etc/os-release
if [[ $ID == *"bsd" ]]; then
  echo "Skipping build step as on a bsd flavor" >&2
elif [ "$IS_DOCKER_BUILD" = "true" ]; then
  echo "In docker, not running parcel (it hangs sometimes!)" >&2
else 
  npm run parcel
fi

