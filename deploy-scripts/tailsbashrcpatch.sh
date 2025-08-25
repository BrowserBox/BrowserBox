sudo() {
  if [[ "${1-}" == "-n" ]]; then
    shift
    if grep -qi '^NAME="Tails"$' /etc/os-release 2>/dev/null; then
      if command -v pkexec >/dev/null 2>&1; then
        command pkexec "$@"
      else
        echo "sudo -n on Tails: set admin password or use pkexec (polkit) instead." >&2
        return 1
      fi
    else
      command sudo -n "$@"
    fi
  else
    command sudo "$@"
  fi
}

