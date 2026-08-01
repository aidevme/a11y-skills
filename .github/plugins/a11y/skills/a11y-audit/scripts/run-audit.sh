#!/usr/bin/env bash
# Thin wrapper: run the a11y audit with JSON output for structured parsing.
# Usage: run-audit.sh [path] [extra CLI flags...]
set -euo pipefail
npx --yes @aidevme/a11y audit "${@:-.}" --format json --fail-on never
