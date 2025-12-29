# BrowserBox Release Flow (Private → Public)

This document captures the intended end-to-end flow from draft binaries in the **private** repo (BrowserBox-source) to a published release in the **public** repo (BrowserBox). It also notes current workflow triggers and any divergences to watch.

## Critical Path (happy flow)

1) **Draft build** (private)
   - Trigger: `./admin-tools/rebuild-and-upload.sh --private all vX.Y.Z-draft` (creates/pushes draft tag if missing, dispatches `private-build`).
   - Outcome: draft release `vX.Y.Z-draft` with mac/linux/win assets attached; triggers `bbx-saga` (private) via `workflow_run`.

2) **Private saga tests** (private)
   - Trigger: auto on `workflow_run` completion of `private-build` (only if conclusion=success). Can also manual dispatch with `use_private_release=true` + `private_release_tag`.
   - Outcome: validates draft binaries on all OS.

3) **Optional RC bump** (private)
   - Trigger: push `vX.Y.Z-rc` tag; `update-version-json` opens PR updating `version.json`/`package.json`. Merge PR to main.
   - Outcome: version files match RC tag (gate before stable).

4) **Promote draft → stable tag** (private)
   - Trigger: manual dispatch `promote-release` with `tag=vX.Y.Z`, `draft_tag=vX.Y.Z-draft`.
   - Outcome: preflight (assets present, private-build success, bbx-saga green) then ensures/creates stable tag `vX.Y.Z` in private repo.

5) **Prepare public release** (private repo)
   - Trigger: push of stable tag `vX.Y.Z` (non-rc/non-draft). Job `prepare-public-release` runs.
   - Outcome: copies installers into public repo and creates a **draft** release in BrowserBox/BrowserBox.

6) **Build & publish binaries to public** (private repo)
   - Trigger: same stable tag `vX.Y.Z` (runs after prepare). Job `build-release` builds/signs/upload binaries to the public draft and then publishes it.
   - Outcome: published public release with binaries and installers.

7) **Public saga tests** (public repo)
   - Trigger: `release: published` in BrowserBox (or manual dispatch with `release_tag`).
   - Outcome: validates released binaries on all OS.

Note: No published release is needed in the private repo; only the draft (`vX.Y.Z-draft`) and the stable tag (`vX.Y.Z`).

## Workflow triggers & alignment (private repo)

- `private-build.yaml`: `workflow_dispatch` (inputs: tag, os, publish). Used in step 1.
- `bbx-saga.yaml`: `workflow_run` on **Private Build (Draft Binaries)** + manual dispatch; derives tag from upstream run or input. Used in step 2.
- `update-version-json.yaml`: `on: create` tag `v*-rc` (note: create event filtering is limited; monitor to ensure it fires as expected). Supports step 3.
- `promote-release.yaml`: manual dispatch; performs preflight and stable tag creation. Step 4.
- `prepare-public-release.yaml`: `push` tags `v*` with `if` guard excluding `-rc/-draft`. Step 5.
- `build-release.yaml`: `push` tags `v*` with `if` guard excluding `-rc/-draft`. Step 6.
- `single-build-upload.yaml`: manual emergency build/upload for one OS to an existing tag (out of band).
- `docker-release-native-multi-arch.yaml`: `repository_dispatch trigger-browserbox-build` (currently orphaned because the public trigger workflow was removed; not in critical path).
- `debug-runners.yaml`: manual tmate helper; not in release path.
- `vpn.yaml`: issue/push-driven personal test; not in release path.
- `codeql-analysis.yml`: PR + weekly cron; not in release path.

## Workflow triggers & alignment (public repo)

- `bbx-saga.yaml` (Public Release): `release: published` or manual dispatch (`release_tag`, optional `release_repo`). Runs against released binaries. Step 7.
- Public saga debugging loop: `docs/ci-saga-debugging.md`
- `codeql-analysis.yml`: PR to main + weekly cron; not in release path.
- `update-version-json.yaml` (public): `on: create` tag `v*-rc` (likely unused; create filters may not match patterns—monitor if you intend to keep it).
- Removed: basic-install, debug, vpn, trigger-private-build, main-debug (reduces noise/minutes). The old dispatch that fed `docker-release-native-multi-arch` is gone, so that docker workflow is currently inactive.

## Quick command cheatsheet

- Dispatch draft build: `./admin-tools/rebuild-and-upload.sh --private all vX.Y.Z-draft`
- Monitor private build: `gh run list --workflow=private-build.yaml --limit 5`
- Promote draft → stable: `gh workflow run promote-release.yaml -f tag=vX.Y.Z -f draft_tag=vX.Y.Z-draft`
- Manual public saga: `gh workflow run "bbx Saga Test Suite (Public Release)" -f release_tag=vX.Y.Z --repo BrowserBox/BrowserBox`

## Known divergences / watch items

- `docker-release-native-multi-arch.yaml` waits for `repository_dispatch` from public, but the public trigger workflow was removed; it is effectively dormant. Decide whether to retire or rewire it.
- `update-version-json.yaml` in both repos uses `on: create` with a regex-like `ref`. The create event has limited filtering; if you rely on it, verify it fires (or move to a push/tag dispatch).
- `vpn.yaml` (private) remains issue/push driven; not part of the release path but still triggerable.
