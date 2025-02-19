#!/usr/bin/env bash

FILES="`find src -type f -name '*.ts'`"

./node_modules/.bin/clang-format -i -style=file $FILES
