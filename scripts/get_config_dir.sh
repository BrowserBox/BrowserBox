#!/usr/bin/env bash
CONFIG_DIR=""

get_config_dir() {
  config_path=$(find "${HOME}" -name .bbpro_config_dir -print -quit 2>/dev/null)
  config_dir=$(dirname $config_path)
  echo $config_dir
}

CONFIG_DIR=$(get_config_dir)

echo $CONFIG_DIR
