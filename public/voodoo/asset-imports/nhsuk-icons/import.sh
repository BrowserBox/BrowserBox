#!/bin/bash

git init
git remote add nhs-uk https://github.com/nhsuk/nhsuk-frontend.git
git fetch --depth=1 nhs-uk master
git checkout nhs-uk/master -- ./packages/assets/icons
rm *.svg
mv ./packages/assets/icons/* .
rm -rf ./packages
rm -rf ./.git


