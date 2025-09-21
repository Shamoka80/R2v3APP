# resync_templates_and_release.sh
set -euo pipefail

FIX=${FIX:-./Fixes}
OUTD=${OUTD:-$FIX/reports}
mkdir -p "$OUTD"

need() {
  [[ -f "$FIX/pdf_temp_export.pdf" && -f "$FIX/email_temp_export.pdf" ]]
}

echo "==> Check local templates"
if need; then
  ls -lh "$FIX"/{pdf_temp_export.pdf,email_temp_export.pdf}
else
  echo "==> Attempt restore from Git"
  git fetch origin || true
  git checkout -- Fixes/pdf_temp_export.pdf Fixes/email_temp_export.pdf || true
fi

if ! need; then
  echo "==> Attempt restore from last patched package"
  PKG=$(ls -t releases/*with_templates*.tar.gz 2>/dev/null | head -1 || true)
  if [[ -n "${PKG:-}" && -f "$PKG" ]]; then
    tar -xzf "$PKG" Fixes/pdf_temp_export.pdf Fixes/email_temp_export.pdf -C .
  fi
fi

if ! need; then
  echo "ERROR: Templates still missing. Re-upload Fixes/pdf_temp_export.pdf and Fixes/email_temp_export.pdf, then re-run."
  exit 1
fi

echo "==> Ensure tracked & push"
git add -f Fixes/pdf_temp_export.pdf Fixes/email_temp_export.pdf || true
git commit -m "chore: ensure template PDFs present" || true
git push -u origin main --tags || true

echo "==> Local cold verify (tree)"
bash coldver.sh

echo "==> Patch latest package to include templates"
bash patch_pkg.sh

echo "DONE: templates restored, package patched, cold-verified."
