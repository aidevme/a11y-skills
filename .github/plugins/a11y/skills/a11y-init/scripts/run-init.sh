#!/usr/bin/env bash
# Thin wrapper: initialize Layer 0 accessibility governance in a project.
# Usage: run-init.sh [path]
set -euo pipefail
npx --yes @aidevme/a11y init "${1:-.}"
