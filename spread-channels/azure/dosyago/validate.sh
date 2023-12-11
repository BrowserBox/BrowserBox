#!/bin/bash

if ! command -v az &>/dev/null; then
  brew install azure-cli
fi

if ! az bicep version &>/dev/null; then
  az bicep install
fi

if ! brew --prefix coreutils &>/dev/null; then
  brew install coreutils
fi

if ! az bicep decompile --file ./browserbox/azuredeploy.json --force; then
  echo "Error during initial decompilation based validation. Will exit..."
  exit 1
fi

./az-group-deploy.sh -a browserbox -l eastus

