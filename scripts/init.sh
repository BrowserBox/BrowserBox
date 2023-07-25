#!/usr/bin/env bash

npm run clean
npm i
npm run parcel
npm test
pm2 save
pm2 logs

