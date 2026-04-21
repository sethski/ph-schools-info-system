// =============================================================================
// MINDI Phase 1 — Shared Utils: Validation Helpers
// Used by scripts/validate-phase1.sh and test suites
// =============================================================================

import { CONFIDENCE_THRESHOLD, STYLE_MATCH_THRESHOLD } from '../constants/risk';

export function validateConfidence(score: number): boolean {
  return score >= CONFIDENCE_THRESHOLD;
}

export function validateStyleMatch(score: number): boolean {
  return score >= STYLE_MATCH_THRESHOLD;
}

// Check PII was redacted (no raw emails/phones in string)
export function hasPiiLeak(text: string): boolean {
  const EMAIL = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
  const PHONE = /(?:\+63|0)9\d{9}|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/;
  return EMAIL.test(text) || PHONE.test(text);
}
