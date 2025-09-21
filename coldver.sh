# Overwrite coldverify.sh and run
cat > coldverify.sh <<'BASH'
#!/usr/bin/env bash
set -euo pipefail

PKG=${1:-$(ls -t releases/rur2_prelaunch_*.tar.gz | head -1)}
[ -f "$PKG" ] || { echo "No package found"; exit 1; }

TMP="$(mktemp -d)"
tar -xzf "$PKG" -C "$TMP"

python - "$TMP" <<'PY'
import sys, json, hashlib
from pathlib import Path

root = Path(sys.argv[1])
summary = root / "Fixes/reports/release_summary.json"
if not summary.exists():
    print("COLD_VERIFY_OK False (missing release_summary.json)")
    sys.exit(1)

data = json.loads(summary.read_text())
ok = True

def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1<<20), b""):
            h.update(chunk)
    return h.hexdigest()

for a in data.get("artifacts", []):
    p = root / a["path"]
    exists = p.is_file()
    digest = sha256(p) if exists else None
    match = (digest == a.get("sha256"))
    ok &= exists and match
    print(json.dumps({"path": str(p.relative_to(root)), "exists": exists, "match": match}, separators=(",",":")))

print("COLD_VERIFY_OK", ok)
sys.exit(0 if ok else 1)
PY
BASH
chmod +x coldverify.sh
./coldverify.sh   # or: ./coldverify.sh releases/rur2_prelaunch_*.tar.gz