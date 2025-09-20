
#!/usr/bin/env bash
set -euo pipefail
FIX=${FIX:-./Fixes}
OUTD=${OUTD:-$FIX/reports}
LEDGER=${LEDGER:-$OUTD/credits_ledger.json}
mkdir -p "$OUTD"

python - <<'PY'
import os, json, pathlib
fix = os.environ.get("FIX","./Fixes")
outd = os.environ.get("OUTD", f"{fix}/reports")
ledger_path = pathlib.Path(os.environ.get("LEDGER", f"{outd}/credits_ledger.json"))

# Load existing ledger if present
ledger = {}
if ledger_path.exists():
    try: ledger = json.loads(ledger_path.read_text())
    except Exception: ledger = {}

def add(tt, amt, ref):
    entries = ledger.setdefault("entries", [])
    seq = str(len(entries) + 1)
    entries.append({"seq": seq, "type": tt, "amount": amt, "ref": ref})
    bal = 0
    for e in entries:
        if e["type"] in ("issue","adjust+"):
            bal += e["amount"]
        elif e["type"] in ("consume","adjust-","purchase_fee"):
            bal -= e["amount"]
    ledger["balance"] = bal

# Simulate: purchase → issuance → consumption → admin adjust
add("purchase", 100, "test_purchase")   # informational; not counted to balance
add("issue",    100, "credit_issue")
add("consume",   25, "usage_1")
add("adjust+",   10, "admin_adjust")

ledger_path.parent.mkdir(parents=True, exist_ok=True)
ledger_path.write_text(json.dumps(ledger, indent=2))
print(json.dumps({"ok": True, "balance": ledger["balance"], "entries": len(ledger["entries"]), "path": str(ledger_path)}, indent=2))
PY

jq -e '.ok == true' "$LEDGER" >/dev/null 2>&1 && echo "Phase5_E2E: PASS" || (echo "Phase5_E2E: FAIL" && exit 1)
