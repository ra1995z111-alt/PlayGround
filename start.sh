#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
exec npm run dev -- --host "${HOST:-0.0.0.0}" --port "${PORT:-3002}"
