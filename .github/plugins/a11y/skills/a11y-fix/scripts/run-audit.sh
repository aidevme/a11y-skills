#!/usr/bin/env bash
# Thin wrapper: get findings as JSON to remediate.
# Usage: run-audit.sh [path]
set -euo pipefail
npx --yes @aidevme/a11y audit "${1:-.}" --format json --fail-on never
