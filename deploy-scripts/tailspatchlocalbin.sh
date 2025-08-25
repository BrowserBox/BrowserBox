mkdir -p "$HOME/bin"
chmod 0755 "$HOME/bin/sudo"
# persist for login shells
if ! grep -q 'export PATH="$HOME/bin:$PATH"' "$HOME/.profile" 2>/dev/null; then
  printf '\nexport PATH="$HOME/bin:$PATH"\n' >> "$HOME/.profile"
fi
# make it live in current shell too
export PATH="$HOME/bin:$PATH"

