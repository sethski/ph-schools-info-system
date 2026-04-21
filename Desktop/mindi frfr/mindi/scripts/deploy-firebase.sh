#!/usr/bin/env bash
# =============================================================================
# MINDI Phase 1 — Deploy Firebase Script
# Deploys: Python ML Cloud Functions + Firestore rules + Storage rules
# Usage: bash scripts/deploy-firebase.sh [functions|rules|all]
# =============================================================================
set -e

TARGET="${1:-all}"
PROJECT_ID=$(grep "^FIREBASE_PROJECT_ID=" .env.local 2>/dev/null | cut -d'=' -f2)

if [ -z "$PROJECT_ID" ]; then
  echo "❌ FIREBASE_PROJECT_ID not set in .env.local"
  exit 1
fi

echo "🔥 Deploying to Firebase project: $PROJECT_ID"
echo ""

deploy_functions() {
  echo "🐍 Deploying Python ML Cloud Functions…"
  # Set env vars in Firebase Functions config
  firebase functions:config:set \
    ml.backend_secret="$(grep ML_BACKEND_SECRET .env.local | cut -d'=' -f2)" \
    openrouter.api_key="$(grep OPENROUTER_API_KEY .env.local | cut -d'=' -f2)" \
    firebase.project_id="$PROJECT_ID" \
    --project "$PROJECT_ID" 2>/dev/null || true

  firebase deploy --only functions --project "$PROJECT_ID"
  echo "✅ Cloud Functions deployed"
  echo ""
  echo "   Get your ML backend URL:"
  echo "   firebase functions:list --project $PROJECT_ID"
  echo "   Update NEXT_PUBLIC_ML_BACKEND_URL in .env.local"
}

deploy_rules() {
  echo "🔐 Deploying Firestore + Storage rules…"
  firebase deploy --only firestore --project "$PROJECT_ID"
  echo "✅ Rules deployed"
}

case "$TARGET" in
  functions) deploy_functions ;;
  rules)     deploy_rules ;;
  all)       deploy_functions; echo ""; deploy_rules ;;
  *)
    echo "Usage: bash scripts/deploy-firebase.sh [functions|rules|all]"
    exit 1
    ;;
esac

echo ""
echo "✅ Firebase deployment complete"
