#!/usr/bin/env bash

##set -x

# source: @digitalcircuit's comment on GitHub (ruffle#3053):
# https://github.com/ruffle-rs/ruffle/issues/3053#issuecomment-772997511

LATEST_SELFHOSTED_URL=$(curl "https://api.github.com/repos/ruffle-rs/ruffle/releases?per_page=1" | jq --raw-output ".[0].assets[] | select(.browser_download_url | endswith(\"selfhosted.zip\")).browser_download_url")
echo "Latest selfhosted.zip is at: $LATEST_SELFHOSTED_URL"
# And do whatever processing you want to do
#
# For example…
wget "$LATEST_SELFHOSTED_URL" --output-document="selfhosted.zip"
unzip -o -d "public/assets/ruffle" selfhosted.zip
rm selfhosted.zip
echo "Updated Ruffle in 'ruffle' directory"
