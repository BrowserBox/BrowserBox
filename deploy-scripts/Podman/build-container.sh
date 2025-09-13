#!/usr/bin/env bash
set -euo pipefail
set -x

# Required: --user and --host are not needed here; Podman builds locally.
# Keep your version-derivation logic identical to your original script.

cd BrowserBox
git switch main; git pull

VERSION=$(git describe --tags --abbrev=0 2>/dev/null || true)
if [[ -z "$VERSION" ]]; then
  VERSION="v$(jq -r .version package.json 2>/dev/null || true)"
fi
if [[ -z "$VERSION" || "$VERSION" == "vnull" ]]; then
  echo "No valid tagged release found. Exiting..." >&2
  exit 1
fi

git checkout "$VERSION"

# Repos & tags
REPOS=("ghcr.io/browserbox/browserbox" "dosaygo/browserbox")
TAGS=("latest" "${VERSION}")

# Local names for arch-specific images (not pushed directly; added to manifest)
IMG_AMD64_LOCAL="localhost/browserbox:amd64-${VERSION}"
IMG_ARM64_LOCAL="localhost/browserbox:arm64-${VERSION}"

# Build each arch and append to a manifest per target repo:tag
build_arch() {
  local arch="$1" out_tag="$2"
  # Podman can build directly into a manifest via --manifest, but we’ll
  # produce arch-specific local tags to make retries/inspection easy.
  podman build \
    --pull --no-cache \
    --platform "linux/${arch}" \
    -t "$out_tag" \
    -f Containerfile \
    .
}

annotate_manifest() {
  # OCI annotations applied on the manifest for the pushed location.
  local dest_ref="$1"
  # Podman/Buildah allow annotate on a *local* manifest list. We'll create a temporary one.
  local tmp_manifest="localhost/tmp-browserbox-manifest:${VERSION}"
  podman manifest rm "$tmp_manifest" >/dev/null 2>&1 || true
  podman manifest create "$tmp_manifest"
  podman manifest add "$tmp_manifest" "$IMG_AMD64_LOCAL"
  podman manifest add "$tmp_manifest" "$IMG_ARM64_LOCAL"

  # Add annotations
  podman manifest annotate "$tmp_manifest" --annotation "org.opencontainers.image.title=BrowserBox"
  podman manifest annotate "$tmp_manifest" --annotation "org.opencontainers.image.description=Secure remote browsing anywhere."
  podman manifest annotate "$tmp_manifest" --annotation "org.opencontainers.image.version=${VERSION}"
  podman manifest annotate "$tmp_manifest" --annotation "org.opencontainers.image.authors=DOSAYGO BrowserBox Team <browserbox@dosaygo.com>"
  podman manifest annotate "$tmp_manifest" --annotation "org.opencontainers.image.source=https://github.com/BrowserBox/BrowserBox"

  # Push to destination (docker:// for registry)
  podman manifest push --all "$tmp_manifest" "docker://$dest_ref"
}

echo "Building arch images..."
build_arch amd64 "$IMG_AMD64_LOCAL"
build_arch arm64 "$IMG_ARM64_LOCAL"

echo "Pushing annotated manifests to GHCR and Docker Hub..."
for repo in "${REPOS[@]}"; do
  for tag in "${TAGS[@]}"; do
    annotate_manifest "${repo}:${tag}"
  done
done

echo "Done."

