#!/usr/bin/env bash

if [ "$IS_DOCKER_BUILD" = "true" ]; then
  echo "In docker, not running parcel (it hangs sometimes!)"
else 
  npm run parcel
fi

