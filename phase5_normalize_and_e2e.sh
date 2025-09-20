
#!/usr/bin/env bash
set -euo pipefail

LEDGER=${LEDGER:-Fixes/reports/credits_ledger.json}
mkdir -p "$(dirname "$LEDGER")"
chmod -f u+rw "$(dirname "$LEDGER")" 2>/dev/null || true

echo "==> Normalizing ledger structure"
python - <<'PY'
import json, shutil, os
from pathlib import Path

L = Path(os.environ.get("LEDGER", "Fixes/reports/credits_ledger.json"))
L.parent.mkdir(parents=True, exist_ok=True)

def backup_if_exists():
    if L.exists():
        b = L.with_suffix(".bak")
        shutil.copyfile(L, b)
        print(f"Backed up to {b}")

def normalize_ledger():
    """Convert flat array ledger to object structure expected by e2e"""
    if not L.exists():
        # Create new structure
        ledger = {"entries": [], "balance": 0}
        L.write_text(json.dumps(ledger, indent=2))
        print("Created new ledger with object structure")
        return
    
    try:
        data = json.loads(L.read_text())
    except Exception as e:
        print(f"Invalid JSON, creating new: {e}")
        backup_if_exists()
        ledger = {"entries": [], "balance": 0}
        L.write_text(json.dumps(ledger, indent=2))
        return
    
    # If it's already an object with entries, we're good
    if isinstance(data, dict) and "entries" in data:
        print("Ledger already has object structure")
        return
    
    # If it's a flat array, convert it
    if isinstance(data, list):
        backup_if_exists()
        # Convert array entries to proper format
        entries = []
        balance = 0
        for i, item in enumerate(data):
            if isinstance(item, dict):
                # Normalize entry format
                entry = {
                    "seq": str(i + 1),
                    "type": item.get("type", "adjust"),
                    "amount": item.get("amount", 0),
                    "ref": item.get("ref", f"migrated_{i}")
                }
                entries.append(entry)
                
                # Calculate balance based on type
                if entry["type"] in ("issue", "adjust+", "purchase"):
                    balance += entry["amount"]
                elif entry["type"] in ("consume", "adjust-", "purchase_fee"):
                    balance -= abs(entry["amount"])  # Handle negative amounts
        
        ledger = {"entries": entries, "balance": balance}
        L.write_text(json.dumps(ledger, indent=2))
        print(f"Converted array ledger to object structure with {len(entries)} entries, balance: {balance}")
        return
    
    # Unknown format, reset
    backup_if_exists()
    ledger = {"entries": [], "balance": 0}
    L.write_text(json.dumps(ledger, indent=2))
    print("Unknown format, created new ledger")

normalize_ledger()
print("LEDGER_NORMALIZED")
PY

chmod -f u+rw "$LEDGER" 2>/dev/null || true

echo "==> Running Phase 5 e2e test"
set +e
bash -x Fixes/qa/phase5_e2e.sh
code=$?
set -e

if [ $code -eq 0 ]; then
    echo "✓ Phase 5 e2e: PASS"
else
    echo "✗ Phase 5 e2e: FAIL (exit $code)"
fi

exit $code
