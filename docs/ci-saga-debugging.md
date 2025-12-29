# CI Saga Debugging (Public Repo)

This is the workflow for iterating on installer/saga failures in `BrowserBox/BrowserBox` until the matrix is green.

## Prereqs

- Local: `gh` (authenticated) + `jq`.
- Workflow: `.github/workflows/bbx-saga.yaml` supports `workflow_dispatch` inputs:
  - `release_tag` (required)
  - `matrix_json` (optional)
  - `disable_tmate` (optional)

## Fast iteration loop (one matrix slice at a time)

1) Pick one failing environment to target:
   - Linux native: `--os ubuntu-latest --containers native`
   - Linux container: `--os ubuntu-latest --containers debian:latest` (or `dokken/centos-stream-10`)
   - macOS: `--os macos-latest`
   - Windows: `--os windows-latest`

2) Trigger just that slice and watch it:

```bash
./admin-tools/retrigger-public-saga.sh vX.Y.Z --os ubuntu-latest --containers debian:latest --no-tmate --watch
```

3) If it fails, pull logs immediately:

```bash
gh run view <run_id> --repo BrowserBox/BrowserBox --log-failed
```

The helper also saves failed logs to: `/tmp/bbx-public-saga/<run_id>/log-failed.txt`.

4) Fix only what the failure indicates (usually one of):
   - Workflow assumptions (wrong triggers/inputs, wrong installer URL, missing env vars).
   - Installer regressions (`deploy-scripts/install.sh`, `windows-scripts/install.ps1`).
   - Saga/test brittleness (`.github/scripts/test-bbx.sh`).

5) Push, re-run the same slice, repeat until green, then move to the next slice.

## Where installer logs show up (Unix/macOS)

The installer writes debug logs under:

- `/tmp/bbx-install-debug-<user>/<osLabel>/<job>-<runid>-<attempt>/install.log`

On saga failure, the workflow tails these logs automatically.

## Tips for common failures

- **“Could not determine release tag” (Windows)**: ensure the workflow passes `BBX_RELEASE_TAG` and that the installer is pinned to the release tag (don’t rely on “latest”).
- **Container-only flakes**: expect slower Tor/Cloudflare networking; prefer longer retry windows over failing fast.

