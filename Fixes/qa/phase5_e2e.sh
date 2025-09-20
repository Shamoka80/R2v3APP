
#!/usr/bin/env bash
set -euo pipefail
OUTD="${OUTD:-./Fixes/reports}"
LEDGER="$OUTD/credits_ledger.json"
test -s "$LEDGER" || { echo "MISS $LEDGER"; exit 1; }
bal=$(python - <<PY
import json,sys
d=json.load(open(sys.argv[1]))
print(d.get("balance",0))
PY "$LEDGER")
echo "BALANCE=$bal"
test "$bal" -ge 0 && echo "PHASE5_E2E: PASS" || { echo "PHASE5_E2E: FAIL"; exit 1; }
