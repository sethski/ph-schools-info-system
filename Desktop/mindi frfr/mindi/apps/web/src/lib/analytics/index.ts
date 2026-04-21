// =============================================================================
// MINDI — Privacy-Preserving Analytics
// Track feature usage and session metrics for launch validation.
// Zero PII: no userId, no content, no email, no IP.
// Batched — no per-event network requests in hot path.
// =============================================================================

import type { AnalyticsPayload, AnalyticsEvent } from '../../../../../shared/types/phase4';

const BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 30_000;
const ENDPOINT = '/api/analytics'; // Phase 4: simple Next.js route

let queue: AnalyticsPayload[] = [];
let flushTimer: NodeJS.Timeout | null = null;

function flush() {
  if (queue.length === 0) return;
  const batch = [...queue];
  queue = [];

  // Fire-and-forget — analytics failures never block the user
  fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events: batch }),
  }).catch(() => { /* swallow — analytics is non-critical */ });
}

export function track(event: AnalyticsEvent, payload: Omit<AnalyticsPayload, 'event'> = {}) {
  queue.push({ event, ...payload });

  if (queue.length >= BATCH_SIZE) {
    flush();
    return;
  }

  // Schedule flush
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flush();
      flushTimer = null;
    }, FLUSH_INTERVAL_MS);
  }
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('pagehide', flush);
}

// Convenience wrappers
export const analytics = {
  sessionStart: () => track('session_start'),
  sessionEnd: (durationMs: number) => track('session_end', { durationMs }),
  featureUsed: (feature: string) => track('feature_used', { feature }),
  uploadComplete: () => track('upload_complete'),
  chatSent: () => track('chat_message_sent'),
  ratingSubmitted: (score: number) => track('rating_submitted', { durationMs: score }),
  error: (errorCode: string) => track('error_occurred', { errorCode }),
  onboardingStep: (step: number) => track('onboarding_step_completed', { onboardingStep: step }),
};
