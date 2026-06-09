#!/usr/bin/env bash
#
# Render the Homebrew formula for a published @insurup/plugin npm tarball and
# push it to the InsurUp tap.
#
# Usage:
#   TAP_TOKEN=<gh-pat> packaging/homebrew/update-tap.sh <version> <npm-tarball>
set -euo pipefail

VERSION="${1:?version required (e.g. 0.1.1)}"
TARBALL="${2:?npm tarball path required}"
TAP_REPO="${TAP_REPO:-InsurUp/homebrew-insurup}"
: "${TAP_TOKEN:?TAP_TOKEN required}"

sha_file() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | cut -d' ' -f1
  else
    shasum -a 256 "$1" | cut -d' ' -f1
  fi
}

TARBALL_SHA="$(sha_file "$TARBALL")"
workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT

git clone --depth 1 "https://x-access-token:${TAP_TOKEN}@github.com/${TAP_REPO}.git" "$workdir"
mkdir -p "$workdir/Formula"

cat > "$workdir/Formula/plugin.rb" <<RUBY
class Plugin < Formula
  desc "TypeScript authoring SDK for InsurUp plugins"
  homepage "https://github.com/InsurUp/plugin"
  url "https://registry.npmjs.org/@insurup/plugin/-/plugin-${VERSION}.tgz"
  sha256 "${TARBALL_SHA}"
  license "MIT"

  def install
    root = (buildpath/"package/package.json").exist? ? buildpath/"package" : buildpath
    pkgshare.install root.children
  end

  test do
    assert_match version.to_s, (pkgshare/"package.json").read
    assert_predicate pkgshare/"src/index.ts", :exist?
  end
end
RUBY

cd "$workdir"
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
git add Formula/plugin.rb
if git diff --staged --quiet; then
  echo "Formula already up to date for ${VERSION}"
else
  git commit -m "plugin ${VERSION}"
  git push
fi
