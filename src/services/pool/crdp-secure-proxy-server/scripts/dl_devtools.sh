#!/usr/bin/env bash

echo "Getting fresh copy of latest devtools"
rm -rf public/devtools-frontend
git clone --depth=1 -b master https://github.com/ChromeDevTools/devtools-frontend.git public/devtools-frontend/
rm -rf public/devtools-frontend/.git

