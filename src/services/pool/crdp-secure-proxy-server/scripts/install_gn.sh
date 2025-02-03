#!/usr/bin/env bash

amd64=$(dpkg --print-architecture || uname -m)
curl -o latest_gn.zip -L https://chrome-infra-packages.appspot.com/dl/gn/gn/linux-$amd64/+/latest
unzip latest_gn.zip -d out/
sudo mv out/gn /usr/bin/gn
rm latest_gn.zip
rm -rf out/

