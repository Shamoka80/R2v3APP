
#!/usr/bin/env bash
set -euo pipefail

LEDGER=${LEDGER:-Fixes/reports/credits_ledger.json}
mkdir -p "$(dirname "$LEDGER")"

python - <<'PY'
import json, sys
from pathlib import Path
L = Path("Fixes/reports/credits_ledger.json")

def norm_entry(x):
    if not isinstance(x, dict): return None
    t = str(x.get("type") or x.get("kind") or x.get("action") or "adjust")
    try: amt = float(x.get("amount", 0))
    except: amt = 0.0
    ref = str(x.get("ref",""))
    ts  = str(x.get("ts",""))
    return {"type": t, "amount": amt, "ref": ref, "ts": ts}

def wrap_as_object(raw):
    # Accept list or dict; normalize to {"entries":[...]}
    if isinstance(raw, list):
        ents = [e for e in (norm_entry(i) for i in raw) if e]
        return {"entries": ents}
    if isinstance(raw, dict):
        if "entries" in raw and isinstance(raw["entries"], list):
            ents = [e for e in (norm_entry(i) for i in raw["entries"]) if e]
            raw["entries"] = ents
            return raw
        # migrate other keys (e.g., "ledger") into "entries"
        for k in ("ledger","items","records"):
            if isinstance(raw.get(k), list):
                ents = [e for e in (norm_entry(i) for i in raw[k]) if e]
                return {"entries": ents}
        # if dict but no list, create empty entries
        return {"entries": []}
    # anything else → empty
    return {"entries": []}

L.parent.mkdir(parents=True, exist_ok=True)
raw = []
if L.exists():
    try:
        raw = json.loads(L.read_text())
    except Exception:
        raw = []
fixed = wrap_as_object(raw)
L.write_text(json.dumps(fixed, indent=2))
bal = sum(e["amount"] for e in fixed["entries"])
print("LEDGER_NORMALIZED", len(fixed["entries"]), "BAL", bal)
PY

# rerun e2e
set -x
bash Fixes/qa/phase5_e2e.sh
