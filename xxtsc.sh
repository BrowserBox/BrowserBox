#!/bin/sh

npx tsc --target ES2020 --checkJs --allowJs --outFile typetests/server.js --module System *.js decs.d.ts
