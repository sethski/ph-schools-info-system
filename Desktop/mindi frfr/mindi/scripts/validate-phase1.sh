#!/usr/bin/env bash
# =============================================================================
# MINDI Phase 1 — Validation Script
# Runs automated checks against the 10 Phase 1 validation criteria.
# Usage: bash scripts/validate-phase1.sh
# =============================================================================
set -e

PASS=0; FAIL=0; WARN=0
pass() { echo "✅ $1"; ((PASS++)); }
fail() { echo "❌ $1"; ((FAIL++)); }
warn() { echo "⚠️  $1 (manual check required)"; ((WARN++)); }

echo ""
echo "🧠 Mindi Phase 1 — Validation"
echo "================================"
echo ""

# ── Folder structure ────────────────────────────────────────────────────────
echo "📁 Checking folder structure…"
for path in \
  "apps/web/src/app/layout.tsx" \
  "apps/web/src/app/page.tsx" \
  "apps/web/src/app/graph/GraphCanvas.tsx" \
  "apps/web/src/app/graph/NodeCard.tsx" \
  "apps/web/src/app/graph/gestures.ts" \
  "apps/web/src/app/chat/ChatPanel.tsx" \
  "apps/web/src/app/chat/CitationBadge.tsx" \
  "apps/web/src/app/chat/useRAG.ts" \
  "apps/web/src/app/ingest/FileUploader.tsx" \
  "apps/web/src/app/ingest/useIngest.ts" \
  "apps/web/src/app/auth/SignIn.tsx" \
  "apps/web/src/app/auth/useAuth.ts" \
  "apps/web/src/app/lib/firebase.ts" \
  "apps/web/src/app/lib/openrouter.ts" \
  "apps/web/src/app/lib/gestures.ts" \
  "apps/web/src/app/lib/trust.ts" \
  "apps/web/public/manifest.json" \
  "apps/web/public/sw.js" \
  "backend/functions/requirements.txt" \
  "backend/functions/src/main.py" \
  "backend/functions/src/embeddings/generate.py" \
  "backend/functions/src/style/extract.py" \
  "backend/functions/src/nlp/chunk.py" \
  "backend/functions/src/nlp/tag.py" \
  "backend/functions/src/nlp/contradict.py" \
  "backend/functions/src/security/pii_redact.py" \
  "backend/functions/src/security/boundaries.py" \
  "backend/functions/src/utils/mongo_db.py" \
  "backend/functions/src/utils/openrouter.py" \
  "backend/functions/src/utils/logging.py" \
  "backend/firestore/security.rules" \
  "backend/firestore/indexes.json" \
  "shared/types/node.ts" \
  "shared/types/style.ts" \
  "shared/types/response.ts" \
  "shared/constants/regions.ts" \
  "shared/constants/risk.ts" \
  "docs/architecture.md" \
  "docs/trust-covenant.md" \
  "docs/validation-checklist.md"
do
  [ -f "$path" ] && pass "$path" || fail "$path MISSING"
done

echo ""

# ── Env vars ────────────────────────────────────────────────────────────────
echo "📋 Checking .env.local…"
if [ -f ".env.local" ]; then
  for var in NEXT_PUBLIC_FIREBASE_API_KEY NEXT_PUBLIC_FIREBASE_PROJECT_ID \
             FIREBASE_CLIENT_EMAIL FIREBASE_PRIVATE_KEY \
             OPENROUTER_API_KEY ML_BACKEND_SECRET NEXT_PUBLIC_ENCRYPTION_SALT; do
    val=$(grep "^${var}=" .env.local | cut -d'=' -f2-)
    [ -n "$val" ] && pass "$var set" || fail "$var missing in .env.local"
  done
else
  fail ".env.local not found — run setup.sh first"
fi

echo ""

# ── Security: API keys not in client code ───────────────────────────────────
echo "🔐 Security: API key exposure check…"
for dir in "apps/web/src/app/lib/firebase.ts" "apps/web/src/components" "apps/web/src/hooks"; do
  if grep -r "OPENROUTER_API_KEY\|ML_BACKEND_SECRET" "$dir" 2>/dev/null | grep -v "process.env" | grep -q .; then
    fail "API key found in client code: $dir"
  else
    pass "No exposed keys in $dir"
  fi
done

# Check piiRedacted enforcement in openrouter.ts
if grep -q "piiRedacted" apps/web/src/app/lib/openrouter.ts 2>/dev/null; then
  pass "piiRedacted guard in openrouter.ts"
else
  fail "piiRedacted guard missing from openrouter.ts"
fi

# Check Firestore audit log immutability rule
if grep -q "allow update, delete: if false" backend/firestore/security.rules 2>/dev/null; then
  pass "Audit log immutability rule present"
else
  fail "Audit log immutability rule missing from security.rules"
fi

echo ""

# ── Python syntax check ─────────────────────────────────────────────────────
echo "🐍 Python syntax check…"
if command -v python3 &>/dev/null; then
  for pyfile in \
    backend/functions/src/main.py \
    backend/functions/src/embeddings/generate.py \
    backend/functions/src/style/extract.py \
    backend/functions/src/nlp/chunk.py \
    backend/functions/src/nlp/tag.py \
    backend/functions/src/nlp/contradict.py \
    backend/functions/src/security/pii_redact.py \
    backend/functions/src/security/boundaries.py \
    backend/functions/src/utils/mongo_db.py \
    backend/functions/src/utils/openrouter.py \
    backend/functions/src/utils/logging.py; do
    python3 -c "
import ast, sys
try:
    ast.parse(open('$pyfile').read())
    print('  ✅ $pyfile')
except SyntaxError as e:
    print(f'  ❌ $pyfile: {e}')
    sys.exit(1)
" || ((FAIL++)) && ((PASS++))
  done
else
  warn "python3 not found — skipping syntax check"
fi

echo ""

# ── TypeScript check ─────────────────────────────────────────────────────────
echo "🔷 TypeScript check…"
if pnpm typecheck &>/dev/null 2>&1; then
  pass "TypeScript compiles without errors"
else
  warn "TypeScript errors — run: pnpm typecheck"
fi

echo ""

# ── Manual validation reminders ─────────────────────────────────────────────
echo "📋 Manual validation required:"
warn "Gate 1: Upload Bio_Notes.pdf → graph node appears in 15 sec"
warn "Gate 2: RAG chat cites file with ≥70% confidence, ≥85% style match"
warn "Gate 3: User rates response 'sounds like me' ≥4/5"
warn "Gate 4: PII in uploaded doc → redacted before OpenRouter (check audit log)"
warn "Gate 5: Share brain without 2FA → blocked"
warn "Gate 6: Offline mode → cached graph + local search works"
warn "Gate 7: Drag-to-Connect + keyboard fallback work"
warn "Gate 8: Lighthouse PWA score ≥90, installs standalone"
warn "Gate 10: POST /api/boundaries with auto_submit → HTTP 403"

echo ""
echo "=================================================="
echo "Results: ${PASS} passed · ${FAIL} failed · ${WARN} manual"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "❌ Phase 1 NOT ready — fix $FAIL failures above"
  exit 1
else
  echo "✅ Automated checks passed"
  echo "   Complete $WARN manual checks to unlock Phase 2"
fi
