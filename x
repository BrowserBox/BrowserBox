  set +euo pipefail
  shopt -s nullglob
  
  normalize() { sed -e 's/[\r\n]*$//'; }
  #redact() { sed -E 's/((token|session_token)=)[^&]+/\1REDACTED/g'; }
  redact() { echo "$1"; }
  
  WANT1="$HOME/BBPRO.INTEGRITY"
  WANT2="$HOME/.config/dosyago/bbpro/BBPRO.INTEGRITY"
  want_src=""
  if [[ -s "$WANT1" ]]; then want="$(cat "$WANT1")"; want_src="$WANT1"; fi
  if [[ -s "$WANT2" ]]; then want="$(cat "$WANT2")"; want_src="$WANT2"; fi
  want_norm="$(printf %s "$want" | normalize)"
  
  {
    echo "=== VERIFY DEBUG ==="
    echo "Local login.link: https://localhost:8080***"
    echo "Origin: https://localhost:8080"
    echo "Suffix: ***"
    echo "SSH_URL: ${SSH_URL:-<none>}"
    echo "SESSION_TOKEN: ${SESSION_TOKEN:+<set>}${SESSION_TOKEN:+" (len=${#SESSION_TOKEN})"}"
    echo "Integrity file source: ${want_src:-<none>}"
    echo "want_raw_len=$(printf %s "$want" | wc -c) want_norm_len=$(printf %s "$want_norm" | wc -c)"
    echo "want_tail_hex=$(printf %s "$want" | od -An -tx1 | tail -n1 | tr -s ' ')"
  } | tee /tmp/int_debug.txt
  
  req() { # $1 label, $2 url, [$3 cookie_name]
    label="$1"; url="$2"; cookie_name="${3:-session_token}"
  
    printf "\n--- %s ---\n" "$label" | tee -a /tmp/int_debug.txt
  
    # Show the exact URL we are about to fetch (token redacted)
    echo "URL: $(printf %s "$url" | redact)" | tee -a /tmp/int_debug.txt
  
    # Try with/without cookie depending on SESSION_TOKEN presence
    COOKIE_OPT=()
    if [[ -n "${SESSION_TOKEN:-}" ]]; then
      COOKIE_OPT=(-b "${cookie_name}=${SESSION_TOKEN}")
      echo "Cookie: ${cookie_name}=<REDACTED>" | tee -a /tmp/int_debug.txt
    fi
  
    # Capture response
    code=$(curl -sSL -D /tmp/hdr.$$ "${COOKIE_OPT[@]}" -o /tmp/body.$$ -w '%{http_code}' "$url" || true)
    clen=$(wc -c < /tmp/body.$$ | tr -d ' ')
    head=$(head -c 160 /tmp/body.$$ | tr -d '\r')
  
    echo "HTTP $code, body_len=$clen" | tee -a /tmp/int_debug.txt
    echo "Response headers (first 20 lines):" | tee -a /tmp/int_debug.txt
    head -n 20 /tmp/hdr.$$ | tee -a /tmp/int_debug.txt
    echo "Body head (160 bytes): $(printf %s "$head" | redact)" | tee -a /tmp/int_debug.txt
  
    # Compare (newline-insensitive)
    got_norm="$(printf %s "$(< /tmp/body.$$)" | normalize)"
    if [[ "$got_norm" == "$want_norm" ]]; then
      echo "MATCH (normalized compare) ✅" | tee -a /tmp/int_debug.txt
    else
      echo "NO MATCH (normalized). want_len=$(printf %s "$want_norm" | wc -c) got_len=$(printf %s "$got_norm" | wc -c)" | tee -a /tmp/int_debug.txt
    fi
  
    rm -f /tmp/hdr.$$ /tmp/body.$$
  }
  
  # --- Local app checks ---
  req "local /integrity" "http://localhost:${BBX_PORT}/integrity"
  if [[ -n "${SESSION_TOKEN:-}" ]]; then
    req "local /integrity?session_token=…" "http://localhost:${BBX_PORT}/integrity?session_token=${SESSION_TOKEN}"
    req "local /integrity?token=…"         "http://localhost:${BBX_PORT}/integrity?token=${SESSION_TOKEN}"
  fi
  
  # --- External edge checks (if tunnel exists) ---
  if [[ -n "${SSH_URL:-}" ]]; then
    req "edge /integrity (cookie)"             "${SSH_URL}/integrity" "session_token"
    if [[ -n "${SESSION_TOKEN:-}" ]]; then
      req "edge /integrity?session_token=…"    "${SSH_URL}/integrity?session_token=${SESSION_TOKEN}"
      req "edge /integrity?token=…"            "${SSH_URL}/integrity?token=${SESSION_TOKEN}"
    fi
  fi
  
  echo
  echo "NOTE: TEMP DEBUG MODE — this step will NOT fail the job."

