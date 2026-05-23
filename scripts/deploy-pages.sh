#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

rm -rf "$ROOT/_site"
mkdir -p "$ROOT/_site/task-1"
cp -r "$ROOT/pages/"* "$ROOT/_site/"

cd "$ROOT/task-1"
npm run build
cp -r dist/* "$ROOT/_site/task-1/"

npx gh-pages -d "$ROOT/_site" --dotfiles
