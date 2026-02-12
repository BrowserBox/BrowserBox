#!/usr/bin/env bash
# Convenience script: stops BBX, restarts with BBX_NO_UPDATE, wires token to
# demo server, clears viewport trace log, runs the specified test (or the
# comprehensive viewport test by default).
set -euo pipefail

TEST_FILE="${1:-viewport-comprehensive.mjs}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEMO_DIR="${DEMO_DIR:-$HOME/Creative/browserbox-win98-demo-local}"
BBX_SRC="$HOME/Creative/BrowserBox-source"
VP_LOG="$HOME/bbx-vp.log"

echo "── Stopping BBX ──"
BBX_NO_UPDATE=true bbx stop 2>/dev/null || true
sleep 2

echo "── Starting BBX (BBX_NO_UPDATE=true) ──"
BBX_NO_UPDATE=true bbx start 2>&1 | tail -3
sleep 8

# Read the live token
LOGIN_LINK="$(cat ~/.config/dosaygo/bbpro/login.link 2>/dev/null)"
if [[ -z "$LOGIN_LINK" ]]; then
  echo "ERROR: No login link found" >&2
  exit 1
fi
echo "── Login link: $LOGIN_LINK ──"

# Extract port from login link
BBX_PORT="$(echo "$LOGIN_LINK" | grep -oE 'localhost:[0-9]+' | cut -d: -f2)"
if [[ -z "$BBX_PORT" ]]; then
  echo "ERROR: Could not extract port from login link" >&2
  exit 1
fi
export BBX_PORT

# Update ecosystem.config.cjs with current login link (full URL including port) if it exists
if [[ -f "$DEMO_DIR/ecosystem.config.cjs" ]]; then
  sed -i '' "s|BBX_LOCAL_LOGIN: '[^']*'|BBX_LOCAL_LOGIN: '${LOGIN_LINK}'|" "$DEMO_DIR/ecosystem.config.cjs"
  
  # Restart demo server with updated token
  echo "── Restarting demo server ──"
  cd "$DEMO_DIR"
  pm2 delete demo-server 2>/dev/null || true
  pm2 start ecosystem.config.cjs 2>&1 | tail -3
  sleep 3
else
  echo "── No demo server to restart (ecosystem.config.cjs not found) ──"
fi

# Clear viewport trace log
: > "$VP_LOG" 2>/dev/null || true
echo "── Cleared $VP_LOG ──"

# Run test
echo "── Running: $TEST_FILE ──"
cd "$SCRIPT_DIR"
timeout 600 node "$TEST_FILE" 2>&1
TEST_EXIT=$?

# Show trace log summary
if [[ -s "$VP_LOG" ]]; then
  LINES="$(wc -l < "$VP_LOG")"
  echo ""
  echo "── Viewport trace log: $LINES lines in $VP_LOG ──"
  echo "  Methods:"
  grep -oP '"method":"[^"]*"' "$VP_LOG" | sort | uniq -c | sort -rn | head -10
else
  echo ""
  echo "── Viewport trace log: EMPTY (no CDP viewport commands logged) ──"
fi

exit $TEST_EXIT
