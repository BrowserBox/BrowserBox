#!/usr/bin/env bash

if [ `id -u` != "0" ]; then
  echo "Error: Must run as root"
  exit 1
fi

VERSION=${1:-1.1.0}

URL_BASE="http://storage.googleapis.com/downloads.webmproject.org/releases/webp/"

MACHINE_TYPE=`uname -m`
if [ ${MACHINE_TYPE} == 'x86_64' ]; then
  # 64-bit system
  FILENAME="libwebp-$VERSION-linux-x86-64.tar.gz"
else
  # 32-bit system
  FILENAME="libwebp-$VERSION-linux-x86-32.tar.gz"
fi

CURDIR=`pwd`
TMPDIR=`mktemp -d`

cd $TMPDIR

set -e
curl $URL_BASE$FILENAME --output $FILENAME
echo "installing..."
tar --strip-components=1 -zxf $FILENAME
if [ -d ./bin ]; then
  cp ./bin/* /usr/bin/
else
  cp ./cwebp /usr/bin/
  cp ./dwebp /usr/bin/
  cp ./gif2webp /usr/bin/
  cp ./vwebp /usr/bin/
  cp ./webpmux /usr/bin/
fi
cp ./lib/* /usr/lib/
cp -r ./include/webp /usr/include/
echo "done!"
set +e

cd $CURDIR
rm -rf $TMPDIR
