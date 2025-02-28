prettify_json() {
  local input_file=$1
  local temp_file="temp_$(basename "$input_file")"

  # Check if the input file exists
  if [ ! -f "$input_file" ]; then
    echo "File not found: $input_file"
    return 1
  fi

  # Use jq to prettify JSON with 2-space indent
  jq '.' -M --indent 2 "$input_file" > "$temp_file" && mv "$temp_file" "$input_file"

  # Inform the user
  echo "JSON file prettified: $input_file"
}

prettify_json "$1"

