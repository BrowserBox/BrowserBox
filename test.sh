#!/usr/bin/env bash

ONTOR=false
INJECT_SCRIPT=""
PORT=""
TOKEN=""
COOKIE=""
DOC_API_KEY=""

# Display help message
display_help() {
  cat << EOF
Usage: $(basename "$0") [OPTIONS]

OPTIONS:
  -h                Show this help message.
  --port
  -p PORT           Specify the port for BrowserBox.
  --token
  -t TOKEN          Set a specific login token.
  --cookie
  -c COOKIE         Set a specific cookie value.
  --doc-api-key
  -d DOC_API_KEY    Set a specific doc viewer API key.
  --ontor           Enable Tor support.
  --inject PATH     Inject a JavaScript file.

EXAMPLE:
  $(basename "$0") -p 8888 --ontor --inject ./myscript.js
EOF
}

# Parse options with getopts
while :; do
  case "$1" in
    -h|--help)
      display_help
      exit 0
      ;;
    -p|--port)
      PORT="$2"
      shift 2
      ;;
    -t|--token)
      TOKEN="$2"
      shift 2
      ;;
    -c|--cookie)
      COOKIE="$2"
      shift 2
      ;;
    -d|--doc-api-key)
      DOC_API_KEY="$2"
      shift 2
      ;;
    --ontor)
      ONTOR=true
      shift
      ;;
    --inject)
      INJECT_SCRIPT="$2"
      shift 2
      ;;
    --)
      shift
      break
      ;;
    -*)
      echo "ERROR: Unknown option: $1" >&2
      display_help
      exit 1
      ;;
    *)
      break
      ;;
  esac
done

# Validate required options
if [[ -z "$PORT" ]]; then
  echo "ERROR: --port option is required." >&2
  exit 1
fi

echo "PORT: $PORT"
echo "TOKEN: ${TOKEN:-Not provided}"
echo "COOKIE: ${COOKIE:-Not provided}"
echo "DOC_API_KEY: ${DOC_API_KEY:-Not provided}"
echo "ONTOR: $ONTOR"
echo "INJECT_SCRIPT: ${INJECT_SCRIPT:-Not provided}"

