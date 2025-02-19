#!/usr/bin/env bash

#set -x

# source: @digitalcircuit's comment on GitHub (ruffle#3053):
# https://github.com/ruffle-rs/ruffle/issues/3053#issuecomment-772997511

LATEST_SELFHOSTED_URL=$(curl -L -s "https://api.github.com/repos/ruffle-rs/ruffle/releases?per_page=1" | jq --raw-output ".[0].assets[] | select(.browser_download_url | endswith(\"selfhosted.zip\")).browser_download_url")
echo
echo "Latest selfhosted.zip is at: $LATEST_SELFHOSTED_URL"
echo

if command -v wget &>/dev/null; then
  wget=$(command -v wget)
elif command -v wget2 &>/dev/null; then
  wget=$(command -v wget2)
else
  wget=""
fi

if [[ ! -z $wget ]]; then
  $wget "$LATEST_SELFHOSTED_URL" --output-document=selfhosted.zip
else
  curl -o selfhosted.zip "$LATEST_SELFHOSTED_URL"
fi
mkdir -p src/public/assets/ruffle
unzip -o -d "src/public/assets/ruffle" selfhosted.zip
rm selfhosted.zip
echo "Updated Ruffle in 'ruffle' directory"
