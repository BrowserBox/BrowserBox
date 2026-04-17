#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd -P)"
TEST_SCRIPT="${SCRIPT_DIR}/test-bbx.sh"
MAX_ATTEMPTS="${BBX_SAGA_MAX_ATTEMPTS:-2}"

cleanup_between_attempts() {
  echo "Cleaning up BrowserBox state before retry..."
  if command -v bbx >/dev/null 2>&1; then
    bbx stop || true
  elif command -v browserbox >/dev/null 2>&1; then
    browserbox pm2 stop bb-main || true
  fi
  if command -v pkill >/dev/null 2>&1; then
    pkill -f browserbox >/dev/null 2>&1 || true
  fi
  sleep 5
}

attempt=1
while true; do
  echo "BBX Unix saga attempt ${attempt}/${MAX_ATTEMPTS}"
  set +e
  "${TEST_SCRIPT}"
  rc=$?
  set -e

  if (( rc == 0 )); then
    exit 0
  fi

  if (( attempt >= MAX_ATTEMPTS )); then
    echo "BBX Unix saga failed after ${attempt} attempt(s)." >&2
    exit "${rc}"
  fi

  echo "BBX Unix saga failed with exit code ${rc}; retrying once..." >&2
  cleanup_between_attempts
  attempt=$((attempt + 1))
done
