# OPTIONAL: set this for non-interactive push (PAT with "repo" scope)
# export GITHUB_TOKEN=ghp_your_token_here

cat > push_to_github.sh <<'BASH'
#!/usr/bin/env bash
set -euo pipefail

REMOTE_URL="https://github.com/Shamoka80/R2v3APP.git"
DEFAULT_BRANCH="main"

command -v git >/dev/null || { echo "git not found"; exit 1; }

# Init repo if needed
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git init
  git checkout -b "$DEFAULT_BRANCH"
fi

# Minimal identity (only if unset)
git config user.name  >/dev/null 2>&1 || git config user.name  "${GIT_USER:-R2v3 Bot}"
git config user.email >/dev/null 2>&1 || git config user.email "${GIT_EMAIL:-r2v3@example.local}"

# Sensible .gitignore (only if missing)
if [ ! -f .gitignore ]; then
  cat > .gitignore <<'EOF'
node_modules/
.venv/
.env
__pycache__/
*.pyc
*.pyo
.DS_Store
releases/*.tar.gz*
Fixes/reports/*.xlsx
Fixes/reports/*.docx
EOF
  git add .gitignore
fi

# Commit any changes
if ! git diff --quiet || ! git diff --cached --quiet; then
  git add -A
  git commit -m "Initial/updated backup to GitHub"
fi

# Ensure branch name
[ "$(git rev-parse --abbrev-ref HEAD)" = "$DEFAULT_BRANCH" ] || git branch -M "$DEFAULT_BRANCH"

# Set remote
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
fi

# Push (prefer token if present)
if [ -n "${GITHUB_TOKEN:-}" ]; then
  echo "→ Pushing with GITHUB_TOKEN..."
  git -c credential.helper= \
      -c http.extraHeader="AUTHORIZATION: bearer $GITHUB_TOKEN" \
      push -u origin "$DEFAULT_BRANCH" --tags
else
  echo "→ No GITHUB_TOKEN set; attempting interactive HTTPS push…"
  git push -u origin "$DEFAULT_BRANCH" --tags
fi

echo "✅ Done. Repo: $REMOTE_URL"
BASH

chmod +x push_to_github.sh
./push_to_github.sh