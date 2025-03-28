#!/usr/bin/env bash

me=$(whoami)

killall -u $me node npm chrome
