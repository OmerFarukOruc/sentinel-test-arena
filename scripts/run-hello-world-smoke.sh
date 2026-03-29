#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
file_path="$repo_root/hello-world.txt"

if [[ ! -f "$file_path" ]]; then
  echo "hello-world.txt is missing; this smoke test cannot proceed" >&2
  exit 1
fi

if [[ ! -s "$file_path" ]]; then
  echo "hello-world.txt exists but is empty" >&2
  exit 1
fi

printf '%s\n' '--- hello-world.txt contents ---'
cat "$file_path"
printf '%s\n' '' 'Smoke test read the hello-world file successfully.'
