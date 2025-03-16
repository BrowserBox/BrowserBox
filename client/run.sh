#!/usr/bin/env bash

if [[ -z "$1" ]]; then
  echo "Usage: $0 <login-link>"
  exit 1
fi

source ~/surya_venv/bin/activate

#./bbxc.js "$1" | ./surya_bbxc_orc.py
./bbxc.js "$1" | ./easy_bbxc_ocr.py

