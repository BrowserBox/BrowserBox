#!/usr/bin/env bash
set -euo pipefail

REAL_SUDO="/usr/bin/sudo"

is_tails() {
  [[ -r /etc/os-release ]] && grep -qi '^NAME="Tails"$' /etc/os-release
}

# If the *first* arg is exactly -n, handle it specially.
if [[ "${1-}" == "-n" ]]; then
  shift
  if is_tails; then
    # Try a GUI auth path if available (often works better on Tails than headless -n)
    if command -v pkexec >/dev/null 2>&1; then
      exec pkexec "$@"
    else
      echo "sudo -n requested, but Tails needs an admin password. Either set it at the Welcome Screen and use sudo (interactive), or install a polkit agent so pkexec works." >&2
      exit 1
    fi
  else
    exec "$REAL_SUDO" -n "$@"
  fi
else
  exec "$REAL_SUDO" "$@"
fi

