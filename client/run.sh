#!/usr/bin/env bash

if [[ -z "$1" ]]; then
  echo "Usage: $0 <login-link>"
  exit 1
fi

source ~/surya_venv/bin/activate

if command -v mkcert &>/dev/null; then
  export NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"
fi

./bbxc.js "$1" | ./easy_bbxc_ocr.py

