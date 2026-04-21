#!/usr/bin/env bash
# =============================================================================
# MINDI Phase 1 — Setup Script
# One-time setup: Firebase init, Python venv, env vars template.
# Usage: bash scripts/setup.sh
# =============================================================================
set -e

echo ""
echo "🧠 Mindi Phase 1 — Setup"
echo "========================="
echo ""

# Check prerequisites
check() { command -v "$1" &>/dev/null && echo "✅ $1" || { echo "❌ $1 required — install: $2"; exit 1; }; }
check node   "https://nodejs.org (v20+)"
check pnpm   "npm install -g pnpm"
check python3 "https://python.org (3.11+)"
check firebase "npm install -g firebase-tools"

echo ""

# Node version
NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
[ "$NODE_VER" -ge 20 ] || { echo "❌ Node.js 20+ required (current: $(node -v))"; exit 1; }

# Python version
PY_VER=$(python3 -c "import sys; print(sys.version_info.minor)")
[ "$PY_VER" -ge 11 ] || echo "⚠️  Python 3.11+ recommended for ML backend"

# Copy env template
if [ ! -f ".env.local" ]; then
  cp .env.example .env.local
  echo ""
  echo "📋 Created .env.local — fill in these values:"
  echo "   NEXT_PUBLIC_FIREBASE_*  → Firebase Console → Project Settings"
  echo "   FIREBASE_CLIENT_EMAIL   → Firebase → Service Accounts → Generate Key"
  echo "   FIREBASE_PRIVATE_KEY    → same JSON file"
  echo "   OPENROUTER_API_KEY      → openrouter.ai/keys"
  echo "   ML_BACKEND_SECRET       → python3 -c \"import secrets; print(secrets.token_hex(32))\""
  echo "   NEXT_PUBLIC_ENCRYPTION_SALT → node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  echo ""
  read -p "Press Enter after filling .env.local…"
fi

# Install Node deps
echo "📦 Installing Node dependencies…"
pnpm install

# Python venv + deps
echo ""
echo "🐍 Setting up Python ML backend…"
cd backend/functions
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
# Install the matching spaCy English model directly to avoid resolver/download issues
python -m pip install -q "https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1-py3-none-any.whl"
deactivate
cd ../..
echo "✅ Python deps installed"

# Firebase login
echo ""
echo "🔥 Firebase login…"
firebase projects:list &>/dev/null || firebase login

# Deploy rules
echo ""
echo "🔐 Deploying Firestore + Storage rules…"
PROJECT_ID=$(grep "^FIREBASE_PROJECT_ID=" .env.local | cut -d'=' -f2)
firebase deploy --only firestore --project "$PROJECT_ID"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. bash scripts/deploy-firebase.sh   ← Deploy Python ML backend"
echo "  2. bash scripts/build-web.sh dev      ← Start web dev server"
