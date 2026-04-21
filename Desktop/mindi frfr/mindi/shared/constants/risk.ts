// =============================================================================
// MINDI Phase 1 — Shared Constants: Risk Levels
// Trust Covenant: enforced in UI and boundaries.py middleware
// =============================================================================

export const RISK_LEVELS = {
  LOW: {
    label: 'Auto',
    emoji: '🟢',
    color: '#22c55e',
    description: 'Auto-execute: summarize, tag, embed',
    requiresPreview: false,
    requiresMfa: false,
    requiresExplicitApprove: false,
  },
  MEDIUM: {
    label: 'Preview',
    emoji: '🟡',
    color: '#f59e0b',
    description: 'Preview required: drafts, suggestions',
    requiresPreview: true,
    requiresMfa: false,
    requiresExplicitApprove: false,
  },
  HIGH: {
    label: 'Approve',
    emoji: '🔴',
    color: '#ef4444',
    description: 'Explicit approve + MFA: submit, share, send',
    requiresPreview: true,
    requiresMfa: true,
    requiresExplicitApprove: true,
  },
} as const;

export type RiskLevel = keyof typeof RISK_LEVELS;

// Confidence threshold below which RAG offers web search or more context
export const CONFIDENCE_THRESHOLD = 0.70;

// Style match threshold for "This sounds like me" rating
export const STYLE_MATCH_THRESHOLD = 0.85;
