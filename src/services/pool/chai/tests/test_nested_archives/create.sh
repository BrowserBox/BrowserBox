#!/usr/bin/env bash

# List of supported archiving methods
methods=("gz" "bz2" "zip" "rar" "7z")

# Create a sample text file
echo "This is a test file." > sample.txt
current_file="sample.txt"
extension_list=""

# Compress using a random method from the list
compress_randomly() {
  local input_file=$1
  local rand_method=${methods[$RANDOM % ${#methods[@]}]}

  case "$rand_method" in
    "gz")
      tar czf "${input_file}.tar.gz" "$input_file"
      current_file="${input_file}.tar.gz"
      ;;
    "bz2")
      tar cjf "${input_file}.tar.bz2" "$input_file"
      current_file="${input_file}.tar.bz2"
      ;;
    "zip")
      zip "${input_file}.zip" "$input_file"
      current_file="${input_file}.zip"
      ;;
    "rar")
      rar a "${input_file}.rar" "$input_file"
      current_file="${input_file}.rar"
      ;;
    "7z")
      7z a "${input_file}.7z" "$input_file"
      current_file="${input_file}.7z"
      ;;
  esac

  # Append this extension to our list
  extension_list="${extension_list}.${rand_method}"
  rm $input_file
}

# Perform 10 nested compressions
for i in {1..10}; do
  compress_randomly $current_file
done

# Output the final filename and extension list
echo "Final file: ${current_file}"
echo "Nested extensions: ${extension_list}"

