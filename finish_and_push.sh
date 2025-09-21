
#!/usr/bin/env bash
set -euo pipefail

# 1) Finish any pending cherry-pick sequence
if [ -f .git/CHERRY_PICK_HEAD ] || [ -d .git/sequencer ]; then
  echo "Finishing pending cherry-pick sequence…"
  # Try continue; if empty/clean, skip; if neither works, abort the sequence
  for _ in 1 2 3 4 5; do
    if git cherry-pick --continue 2>/dev/null; then
      continue
    elif git cherry-pick --skip 2>/dev/null; then
      continue
    else
      break
    fi
    # Exit loop if sequence cleared
    [ ! -f .git/CHERRY_PICK_HEAD ] && [ ! -d .git/sequencer ] && break
  done
  # If still stuck, abort (does not undo your already-created commits)
  if [ -f .git/CHERRY_PICK_HEAD ] || [ -d .git/sequencer ]; then
    git cherry-pick --abort || true
  fi
fi

# 2) Temporarily stash any local changes (incl. untracked) to avoid rebase/push refusal
STASHED=0
if [ -n "$(git status --porcelain)" ]; then
  git stash push -u -m "auto-stash-before-push"
  STASHED=1
fi

# 3) Push main + tags
git fetch origin
git rebase -X theirs origin/main || true
git push -u origin main --tags
echo "PUSH_OK"

# 4) Restore your working changes if we stashed
if [ "$STASHED" -eq 1 ]; then
  git stash pop || true
fi

# 5) Show quick status
git status -sb
