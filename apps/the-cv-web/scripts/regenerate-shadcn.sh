#!/usr/bin/env bash
# Regenerate existing shadcn UI components (overwrite with latest from registry).
# Adds components one by one so you can see which are not in the registry.
# Usage:
#   ./scripts/regenerate-shadcn.sh              # overwrite all existing UI components
#   ./scripts/regenerate-shadcn.sh button card  # overwrite only button and card

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
UI_DIR="$APP_ROOT/src/components/ui"

cd "$APP_ROOT"

if [[ $# -gt 0 ]]; then
  COMPONENTS=("$@")
else
  if [[ ! -d "$UI_DIR" ]]; then
    echo "No ui directory at $UI_DIR"
    exit 1
  fi
  COMPONENTS=()
  for f in "$UI_DIR"/*.tsx; do
    [[ -f "$f" ]] || continue
    name=$(basename "$f" .tsx)
    COMPONENTS+=("$name")
  done
  if [[ ${#COMPONENTS[@]} -eq 0 ]]; then
    echo "No components found in $UI_DIR"
    exit 0
  fi
fi

FAILED=()
for name in "${COMPONENTS[@]}"; do
  printf "  %s ... " "$name"
  if pnpm exec shadcn add "$name" --overwrite --yes; then
    echo "ok"
  else
    echo "FAILED (not in registry or error)"
    FAILED+=("$name")
  fi
done

if [[ ${#FAILED[@]} -gt 0 ]]; then
  echo ""
  echo "Components not in registry (${#FAILED[@]}): ${FAILED[*]}"
  exit 1
fi
