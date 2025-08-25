# Safe sudo override for non-interactive shells
sudo() {
  local REAL_SUDO=/usr/bin/sudo
  local is_tails=false
  [[ -r /etc/os-release ]] && grep -qi '^NAME="Tails"$' /etc/os-release && is_tails=true

  local has_n=false
  local cleaned=()

  for a in "$@"; do
    if [[ "$a" == "-n" ]]; then
      has_n=true
      continue
    elif [[ "$a" == -*n* && "$a" != -* ]]; then
      # e.g. -nE → strip the n
      has_n=true
      cleaned+=("${a//n/}")
    else
      cleaned+=("$a")
    fi
  done

  if $is_tails && $has_n; then
    if command -v pkexec >/dev/null 2>&1; then
      # Run pkexec with the *command*, not the flags
      exec pkexec "${cleaned[@]}"
    else
      # Fall back to interactive sudo (without -n)
      exec "$REAL_SUDO" "${cleaned[@]}"
    fi
  else
    exec "$REAL_SUDO" "$@"
  fi
}

