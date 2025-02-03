#!/usr/bin/env bash

npm run clean
npm i
if [ "$IS_DOCKER_BUILD" = "true" ]; then
  echo "Not running parcel, you are in docker."
else
  npm run parcel
fi
npm test
pm2 save
pm2 logs

