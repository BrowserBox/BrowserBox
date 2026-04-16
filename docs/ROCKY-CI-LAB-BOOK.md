# Rocky CI lab book

## Goal
- Add Rocky Linux CI coverage in `BrowserBox`.
- Keep saga test order unchanged.
- Reuse the proved Rocky fixes from `BrowserBox-source` instead of inventing a second path.

## Baseline changes under test
- `BrowserBox/.github/workflows/bbx-saga.yaml`
- `BrowserBox/.github/scripts/test-bbx.sh`
- `BrowserBox/deploy-scripts/install.sh`

## Experiment log

### Experiment 0 - public Rocky matrix parity
- **Hypothesis:** The public `bbx-saga.yaml` can adopt the same Rocky matrix entry and Linux bootstrap fixes that already passed in `BrowserBox-source`.
- **Controls:** Keep the public release under test fixed to `BrowserBox/BrowserBox@v16.2.8`; change only the workflow and failure-log plumbing in this repo.
- **Command summary:** Add `rockylinux:9` to the public matrix, switch Rocky bootstrap to missing-command package install logic with `curl-minimal` and `procps`/`procps-ng`, recurse failure-log collection through `service_logs/`, then dispatch the public saga on the feature branch for Rocky only.
- **Run:** `gh workflow run bbx-saga.yaml --ref rocky-ci-public -f release_tag=v16.2.8 -f disable_tmate=true -f matrix_json='{"os":["ubuntu-latest"],"container_image":["rockylinux:9"],"exclude":[]}'`
- **Run ID:** `24496233371`
- **Result:** Failed in the real Rocky saga after install.
- **Observed evidence:**
  - The public workflow bootstrap fix worked: the Rocky job installed cleanly and reached `Execute BBX Test Saga`.
  - The failing release contents are still older than the source draft: the saga repeatedly logs `Error: Unable to find a match: cron`.
  - This matches the already-fixed source-side `_tls.sh` Rocky mapping issue and proves the blocker is the public release under test (`v16.2.8`), not the public workflow changes on `rocky-ci-public`.
- **Conclusion:** Keep the public workflow changes. The next experiment must validate against a public **draft** release built from the already-green source draft assets (`v16.2.9-draft`) rather than the older published public release.

### Experiment 1 - public draft release from green source assets
- **Hypothesis:** If `BrowserBox/BrowserBox` gets a draft release `v16.2.9-draft` populated from the already-green private/source draft assets, the public Rocky saga on `rocky-ci-public` should pass without further workflow changes.
- **Controls:** Keep the public workflow branch unchanged; change only the public release under test from `v16.2.8` to a draft release seeded from `BrowserBox-source@v16.2.9-draft`.
- **Command summary:** Create/update a public draft release `BrowserBox/BrowserBox@v16.2.9-draft`, upload assets copied from `BrowserBox-source@v16.2.9-draft`, then rerun the public Rocky saga on `rocky-ci-public` against `release_tag=v16.2.9-draft`.
- **Runs:** `24496673573`, `24496734857`
- **Result:** Two controlled install failures isolated; final rerun pending after installer fix.
- **Observed evidence:**
  - Run `24496673573` failed in `Install BrowserBox` with `curl: (22)` because the draft release existed but the backing git ref `refs/tags/v16.2.9-draft` did not, so `raw.githubusercontent.com/.../v16.2.9-draft/deploy-scripts/install.sh` returned 404.
  - After explicitly creating `refs/tags/v16.2.9-draft` at public branch commit `093c1c6065de93dda3199ee3b51ec124919299e2`, the raw installer URL resolved and run `24496734857` advanced into `install.sh`.
  - Run `24496734857` then failed with `Asset release.manifest.json not found on release v16.2.9-draft.`
  - Root cause: `install.sh` falls back from `releases/tags/<tag>` to authenticated `releases`, but that fallback returns an array and the existing asset lookup treated it like a single release object, so draft-release assets were invisible even with a token.
- **Conclusion:** Keep the draft-tag approach. The public repo also needs `install.sh` to select the matching release object from the authenticated `/releases` array before extracting draft assets; rerun Rocky after that fix and after moving the draft tag to the new installer commit.
