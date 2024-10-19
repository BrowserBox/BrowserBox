#!/usr/bin/env bash

if [[ -z "$1" ]]; then
  echo "Specify which directory to validate as first argument. Will exit now..." >&2
  exit 1
fi

if ! command -v az &>/dev/null; then
  brew install azure-cli
fi

if ! az bicep version &>/dev/null; then
  az bicep install
fi

if ! brew --prefix coreutils &>/dev/null; then
  brew install coreutils
fi

if [[ -f ./$1/createUiDefinition.json ]]; then
  if ! jq < ./$1/createUiDefinition.json &>/dev/null; then
    echo "Error during JSON parse of createUiDefinition. Exiting..."
    exit 1
  fi
fi
if ! jq < ./$1/azuredeploy.json &>/dev/null; then
  echo "Error during JSON parse of azuredeploy.json. Exiting..."
  exit 1
fi

if ! az bicep decompile --file ./$1/azuredeploy.json --force; then
  echo "Error during initial decompilation based validation. Will exit..."
  exit 1
fi

./az-group-deploy.sh -a $1 -l eastus -u

