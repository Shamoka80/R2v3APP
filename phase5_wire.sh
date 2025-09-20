
#!/usr/bin/env bash
set -euo pipefail
FIX="${FIX:-./Fixes}"
OUTD="${OUTD:-$FIX/reports}"
LEDGER="$OUTD/credits_ledger.json"
mkdir -p "$OUTD"

# venv
if [ ! -d .venv ]; then python3 -m venv .venv; fi
# shellcheck disable=SC1091
source .venv/bin/activate
python - <<'PY'
import os, json, pathlib, datetime
OUTD = pathlib.Path(os.environ.get("OUTD","./Fixes/reports"))
LEDGER = OUTD/"credits_ledger.json"
state = {"balance": 0, "entries": []}
if LEDGER.exists():
    try: state = json.loads(LEDGER.read_text())
    except: pass

def add(kind, amount, ref):
    ts = datetime.datetime.utcnow().isoformat()+"Z"
    state["entries"].append({"ts":ts,"kind":kind,"amount":amount,"ref":ref})
    state["balance"] += amount

# simulate purchase(+10), then consume(-1) for export gating
add("purchase", +10, "test-purchase")
add("consume",  -1, "export:coverage_report")

LEDGER.write_text(json.dumps(state, indent=2))
print(json.dumps({"ok": True, "balance": state["balance"], "ledger": str(LEDGER)}, indent=2))
PY
