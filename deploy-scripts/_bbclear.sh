#!/usr/bin/env bash

cd $HOME
rm -rf .config/dosyago/bbpro/browser-cache/Default/History* || (echo "Error clearing history" >&2 && exit 1)
rm -rf .cache/dosyago/bbpro || (echo "Error clearing caches" >&2 && exit 1)

echo "History and caches cleared for $(whoami)"

exit 0
