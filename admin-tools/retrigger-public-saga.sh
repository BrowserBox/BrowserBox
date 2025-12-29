#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: admin-tools/retrigger-public-saga.sh <release_tag> [options]

Triggers the public saga workflow (`.github/workflows/bbx-saga.yaml`) in BrowserBox/BrowserBox
with a narrowed matrix (one OS, optionally one or more container images).

Options:
  --repo <owner/repo>       Default: BrowserBox/BrowserBox
  --ref <git-ref>           Default: main
  --os <runner>             Default: ubuntu-latest
  --containers <csv>        Container images csv; use "native" for no container. Default: native
  --no-tmate                Disable tmate debug steps
  --watch                   Watch the run until completion (saves failed logs to /tmp)

Examples:
  admin-tools/retrigger-public-saga.sh v15.10.2 --os ubuntu-latest --containers debian:latest --no-tmate --watch
  admin-tools/retrigger-public-saga.sh v15.10.2 --os ubuntu-latest --containers native --no-tmate --watch
  admin-tools/retrigger-public-saga.sh v15.10.2 --os macos-latest --no-tmate --watch
  admin-tools/retrigger-public-saga.sh v15.10.2 --os windows-latest --no-tmate --watch
USAGE
}

if [[ $# -lt 1 ]]; then
  usage
  exit 2
fi

release_tag="$1"
shift

repo="BrowserBox/BrowserBox"
ref="main"
os="ubuntu-latest"
containers_csv="native"
disable_tmate="false"
watch="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      repo="${2:?missing value for --repo}"
      shift 2
      ;;
    --ref)
      ref="${2:?missing value for --ref}"
      shift 2
      ;;
    --os)
      os="${2:?missing value for --os}"
      shift 2
      ;;
    --containers)
      containers_csv="${2:?missing value for --containers}"
      shift 2
      ;;
    --no-tmate)
      disable_tmate="true"
      shift 1
      ;;
    --watch)
      watch="true"
      shift 1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      usage
      exit 2
      ;;
  esac
done

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required." >&2
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required." >&2
  exit 1
fi

readarray -t containers < <(printf '%s' "$containers_csv" | tr ',' '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | awk 'NF')
if [[ "${#containers[@]}" -eq 0 ]]; then
  containers=("native")
fi

containers_json="$(printf '%s\n' "${containers[@]}" | jq -Rsc 'split("\n")[:-1] | map(if . == "native" then "" else . end)')"
matrix_json="$(jq -cn --arg os "$os" --argjson containers "$containers_json" '{os:[$os], container_image:$containers, exclude:[] }')"

prev_id="$(gh run list --repo "$repo" --workflow bbx-saga.yaml --limit 1 --json databaseId --jq '.[0].databaseId // empty' 2>/dev/null || true)"

echo "Triggering bbx-saga.yaml on ${repo}@${ref} for ${release_tag}..."
gh workflow run bbx-saga.yaml \
  --repo "$repo" \
  --ref "$ref" \
  -f "release_tag=${release_tag}" \
  -f "disable_tmate=${disable_tmate}" \
  -f "matrix_json=${matrix_json}" >/dev/null

echo "Waiting for run to register..."
run_id=""
for _ in {1..60}; do
  run_id="$(gh run list --repo "$repo" --workflow bbx-saga.yaml --limit 5 --json databaseId --jq '.[0].databaseId // empty' 2>/dev/null || true)"
  if [[ -n "$run_id" && "$run_id" != "$prev_id" ]]; then
    break
  fi
  sleep 2
done

if [[ -z "$run_id" || "$run_id" == "$prev_id" ]]; then
  echo "Failed to detect new run id." >&2
  exit 1
fi

echo "Run: https://github.com/${repo}/actions/runs/${run_id}"

if [[ "$watch" == "true" ]]; then
  gh run watch "$run_id" --repo "$repo" --exit-status || {
    out_dir="/tmp/bbx-public-saga/${run_id}"
    mkdir -p "$out_dir"
    gh run view "$run_id" --repo "$repo" --log-failed >"${out_dir}/log-failed.txt" 2>&1 || true
    echo "Saved failed logs to ${out_dir}/log-failed.txt" >&2
    exit 1
  }
fi

