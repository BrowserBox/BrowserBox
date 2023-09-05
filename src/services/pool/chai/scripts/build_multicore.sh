#!/usr/bin/env sh

OS=$(uname)
if [ "$OS" = "Darwin" ]; then
  echo Building ImageMagick with multicore support for Mac OS
  ./build_im.sh
elif [ "$OS" = "FreeBSD" ]; then
  # FreeBSD
  echo Error building ImageMagick with multicore support for FreeBSD
  echo No build script for FreeBSD, adapt build_im.sh or build_src.sh to work 
  echo on this OS
  exit 1
else
  echo Building ImageMagick with multicore support for Unix / Linux
  ./build_src.sh
fi

exit 0
