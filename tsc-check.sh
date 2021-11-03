#!/bin/sh

rm public/*bundle*.js
npm run tsc-server
npm run tsc-inject
npm run tsc-public

