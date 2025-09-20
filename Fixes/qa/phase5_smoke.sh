#!/usr/bin/env bash
set -euo pipefail
REQ=(api/openapi_credits.yaml contracts/stripe_credits.ts migrations/002_credits.sql)
for r in "${REQ[@]}"; do
  test -s "Fixes/$r" && echo "OK Fixes/$r" || { echo "MISS Fixes/$r"; exit 1; }
done
echo "Phase 5 scaffold ready."
