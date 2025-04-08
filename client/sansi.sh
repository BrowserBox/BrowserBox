#!/usr/bin/env bash

# sans ANSI - :) ;p xxxx ;p

sed -E 's/\x1B\[[0-9;]*[mK]//g'
