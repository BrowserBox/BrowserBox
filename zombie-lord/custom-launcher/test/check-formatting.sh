#!/usr/bin/env bash

check_formatting ()
{
  diff -u <(cat $1) <(./node_modules/.bin/clang-format -style=file $1) &>/dev/null
  if [ $? -eq 1 ]
  then
    echo "Error: formatting is required for *.ts files:"
    echo "    cd chrome-launcher"
    echo "    yarn format"
    exit 1
  fi
}

check_formatting "`find src -type f -name '*.ts'`"
