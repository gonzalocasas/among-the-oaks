#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../prototype"
exec python3 -m http.server "${1:-8080}"
