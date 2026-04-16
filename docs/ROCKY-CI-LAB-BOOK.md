# Rocky CI lab book

## Goal
- Add Rocky Linux CI coverage in `BrowserBox`.
- Keep saga test order unchanged.
- Reuse the proved Rocky fixes from `BrowserBox-source` instead of inventing a second path.

## Baseline changes under test
- `BrowserBox/.github/workflows/bbx-saga.yaml`
- `BrowserBox/.github/scripts/test-bbx.sh`

## Experiment log

### Experiment 0 - public Rocky matrix parity
- **Hypothesis:** The public `bbx-saga.yaml` can adopt the same Rocky matrix entry and Linux bootstrap fixes that already passed in `BrowserBox-source`.
- **Controls:** Keep the public release under test fixed to `BrowserBox/BrowserBox@v16.2.8`; change only the workflow and failure-log plumbing in this repo.
- **Command summary:** Add `rockylinux:9` to the public matrix, switch Rocky bootstrap to missing-command package install logic with `curl-minimal` and `procps`/`procps-ng`, recurse failure-log collection through `service_logs/`, then dispatch the public saga on the feature branch for Rocky only.
- **Result:** Pending rerun.
- **Conclusion:** Pending rerun.
