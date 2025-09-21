
#!/usr/bin/env bash
set -euo pipefail
REPO="${REPO:-Shamoka80/R2v3APP}"     # owner/repo
WF="${WF:-ci.yml}"                    # workflow file name
BR="${BR:-main}"                      # branch
POLL="${POLL:-10}"                    # seconds between checks
TIMEOUT="${TIMEOUT:-900}"             # max seconds to wait
API="https://api.github.com/repos/$REPO/actions/workflows/$WF/runs?branch=$BR&per_page=1"

echo "Watching CI for $REPO :: $WF @ $BR"
start=$(date +%s)
while :; do
  JSON=$(python - <<'PY'
import json,sys,urllib.request,os
url=os.environ["API"]
req=urllib.request.Request(url,headers={"Accept":"application/vnd.github+json"})
with urllib.request.urlopen(req) as r:
    j=json.load(r)
runs=j.get("workflow_runs",[])
run=runs[0] if runs else {}
print(json.dumps({
  "id": run.get("id"),
  "status": run.get("status"),
  "conclusion": run.get("conclusion"),
  "html_url": run.get("html_url"),
}))
PY
)
  status=$(printf '%s' "$JSON" | python -c 'import sys,json; print(json.load(sys.stdin)["status"])')
  concl=$(printf '%s' "$JSON" | python -c 'import sys,json; print(json.load(sys.stdin)["conclusion"])')
  url=$(printf   '%s' "$JSON" | python -c 'import sys,json; print(json.load(sys.stdin)["html_url"])')
  echo "status=$status conclusion=${concl:-n/a}  $url"

  if [ "$status" = "completed" ]; then
    [ "$concl" = "success" ] && exit 0 || exit 1
  fi
  now=$(date +%s); (( now-start >= TIMEOUT )) && { echo "Timed out."; exit 2; }
  sleep "$POLL"
done
