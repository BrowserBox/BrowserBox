#!/usr/bin/env bash

sed -E 's/\x1B\[[0-9;]*[mK]//g'
