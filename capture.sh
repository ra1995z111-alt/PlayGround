#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

url="${URL:-http://localhost:${PORT:-3002}}"
output="${SCREENSHOT:-screenshots/stalingrad.png}"
mkdir -p "$(dirname "$output")"
command -v playwright-cli >/dev/null || { echo "playwright-cli is required to capture the game" >&2; exit 1; }
playwright-cli open "$url"
playwright-cli screenshot --filename="$output"
printf 'Saved screenshot to %s\n' "$output"
