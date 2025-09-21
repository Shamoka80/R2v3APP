#!/usr/bin/env bash
set -euo pipefail

# 1) Ensure remote
git remote get-url origin >/dev/null 2>&1 || {
  echo "No 'origin' remote configured."; exit 1;
}

# 2) Fetch and attempt a non-interactive rebase (prefer remote on conflicts)
git fetch origin
set +e
git rebase -X theirs origin/main
rc=$?
set -e

# 3) If rebase fails, fall back: reset to remote then cherry-pick local commits
if [ $rc -ne 0 ]; then
  echo "Rebase failed; applying fallback strategy…"
  git rebase --abort || true
  TMP="tmp-local-$(date +%s)"
  git branch "$TMP"
  git reset --hard origin/main
  git log --reverse --format=%H origin/main.."$TMP" | xargs -r -n1 git cherry-pick -X ours
  git branch -D "$TMP" || true
fi

# 4) Push with tags
git push -u origin main --tags
echo "PUSH_OK"

# 5) (Optional) show last run URL hint
echo "Triggered CI on GitHub Actions."
