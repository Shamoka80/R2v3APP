#!/usr/bin/env bash
set -euo pipefail
REMOTE="origin"; BR="main"

# Optional non-interactive push: export GITHUB_TOKEN=...
git config pull.rebase true

git fetch $REMOTE $BR || true

# Ensure we’re on main and committed
git rev-parse --is-inside-work-tree >/dev/null
[ "$(git rev-parse --abbrev-ref HEAD)" = "$BR" ] || git branch -M "$BR"
if ! git diff --quiet || ! git diff --cached --quiet; then
  git add -A && git commit -m "Sync before push"
fi

# If remote branch exists, compute divergence
if git show-ref --quiet refs/remotes/$REMOTE/$BR; then
  set +e
  read BEHIND AHEAD < <(git rev-list --left-right --count $REMOTE/$BR...$BR 2>/dev/null | awk '{print $1" "$2}')
  set -e
  BEHIND=${BEHIND:-0}; AHEAD=${AHEAD:-0}

  if [ "$BEHIND" -gt 0 ] && [ "$AHEAD" -eq 0 ]; then
    # We are behind only → rebase
    git pull --rebase $REMOTE $BR
  elif [ "$BEHIND" -gt 0 ] && [ "$AHEAD" -gt 0 ]; then
    # Diverged → merge, prefer our changes on conflict
    git merge -X ours --no-edit $REMOTE/$BR || true
  fi
fi

# Push (use token if provided)
if [ -n "${GITHUB_TOKEN:-}" ]; then
  git -c credential.helper= \
      -c http.extraHeader="AUTHORIZATION: bearer $GITHUB_TOKEN" \
      push -u $REMOTE $BR --tags
else
  git push -u $REMOTE $BR --tags
fi
echo "✅ Sync & push complete."
