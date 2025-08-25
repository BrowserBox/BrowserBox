cat > "$HOME/.bash_env" <<'EOF'
# Loaded by non-interactive bash when BASH_ENV is set
# Keep this FAST and safe (non-interactive shells source it on every run)

# Only modify behavior when -n is present; otherwise defer to real sudo
sudo() {
  local REAL_SUDO=/usr/bin/sudo
  local has_n=false
  local args=()

  # Detect Tails
  local is_tails=false
  if [[ -r /etc/os-release ]] && grep -qi '^NAME="Tails"$' /etc/os-release; then
    is_tails=true
  fi

  # Parse flags until first non-option/--
  while (($#)); do
    case "$1" in
      --) args+=("$1"); shift; break;;
      -*)  [[ "$1" == *n* || "$1" == "-n" ]] && has_n=true; args+=("$1"); shift;;
      *)   break;;
    esac
  done
  args+=("$@")

  if $is_tails && $has_n; then
    if command -v pkexec >/dev/null 2>&1; then
      exec pkexec "${args[@]}"
    else
      # Fall back to interactive sudo (drop -n)
      # Remove a standalone -n and any combined -n in clusters
      local cleaned=()
      for a in "${args[@]}"; do
        if [[ "$a" == "-n" ]]; then continue; fi
        if [[ "$a" == -* && "$a" == *n* ]]; then
          cleaned+=("${a//n/}")  # crude but effective for common cases like -nE
        else
          cleaned+=("$a")
        fi
      done
      exec "$REAL_SUDO" "${cleaned[@]}"
    fi
  else
    exec "$REAL_SUDO" "${args[@]}"
  fi
}
export -f sudo   # so child bash instances inherit if BASH_ENV isn't reapplied
# If you *really* want aliases in non-interactive shells, uncomment next line:
# shopt -s expand_aliases
EOF

