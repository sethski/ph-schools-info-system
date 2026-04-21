#!/usr/bin/env bash
# =============================================================================
# MINDI Phase 1 — Build Web Script
# Usage: bash scripts/build-web.sh [dev|build|start]
# =============================================================================
set -e

MODE="${1:-dev}"
cd apps/web

case "$MODE" in
  dev)
    echo "🧠 Starting Mindi web dev server…"
    pnpm dev
    ;;
  build)
    echo "🔨 Building Mindi web app…"
    pnpm build
    echo "✅ Build complete → apps/web/.next/"
    ;;
  start)
    echo "🚀 Starting Mindi production server…"
    pnpm start
    ;;
  *)
    echo "Usage: bash scripts/build-web.sh [dev|build|start]"
    exit 1
    ;;
esac
