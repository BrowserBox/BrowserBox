#!/usr/bin/env bash
which sloc || npm i -g sloc
mkdir -p cstats
sloc --exclude "node_modules|bundle" . > cstats/codestats.txt
cloc ./ --exclude-dir=node_modules --exclude-ext=json --use-sloccount --csv --by-file --report-file cstats/codecount.csv


