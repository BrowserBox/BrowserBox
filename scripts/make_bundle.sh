#!/usr/bin/env bash

if [ -f /.dockerenv ]; then
  echo "In docker, not running parcel (it hangs sometimes!)"
else 
  npm run parcel
fi

