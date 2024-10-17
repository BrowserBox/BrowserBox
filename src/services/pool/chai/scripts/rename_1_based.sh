#!/usr/bin/env bash

base=$1
format=$2
i=0
for fi in $base-????.$format; do
  new=$(printf "%04d.$format" "$i")
  mv "$fi" "$base-$new"
  let i=i+1
done

