// =============================================================================
// MINDI — Proactivity Engine (client-side emotional state detection)
// Contradiction detection and deadline scanning delegated to Python backend.
// This file handles only the stateless client-side emotional signal analysis.
// =============================================================================
import type { EmotionalState, EmotionalSignals } from '../../../../../shared/types/phase2';

const STRESS = { LATE_HOUR: 23, HIGH_REVISION: 5, LONG_SESSION: 120 };

export function detectEmotionalState(signals: {
  typingSpeedDelta?: number;
  revisionRate?: number;
  hourOfDay?: number;
  sessionDurationMinutes?: number;
}): EmotionalSignals {
  const stressors: string[] = [];
  if ((signals.hourOfDay ?? 0) >= STRESS.LATE_HOUR) stressors.push('late hour');
  if ((signals.revisionRate ?? 0) > STRESS.HIGH_REVISION) stressors.push('high revision rate');
  if ((signals.sessionDurationMinutes ?? 0) > STRESS.LONG_SESSION) stressors.push('long session');

  let state: EmotionalState = 'neutral';
  let confidence = 0.5;

  if (stressors.length >= 2) { state = 'stressed'; confidence = 0.8; }
  else if (stressors.includes('long session')) { state = 'fatigued'; confidence = 0.65; }
  else if (stressors.length === 1) { state = 'stressed'; confidence = 0.6; }

  return { detectedState: state, signals, confidence, detectedAt: new Date() };
}

export function getUiAdaptation(state: EmotionalState) {
  return {
    focused:    { suggestionFrequency: 'low',    orbOpacity: 0.15, showCalmPrompt: false },
    stressed:   { suggestionFrequency: 'none',   orbOpacity: 0.08, showCalmPrompt: true  },
    fatigued:   { suggestionFrequency: 'none',   orbOpacity: 0.06, showCalmPrompt: true  },
    neutral:    { suggestionFrequency: 'medium', orbOpacity: 0.2,  showCalmPrompt: false },
    productive: { suggestionFrequency: 'medium', orbOpacity: 0.25, showCalmPrompt: false },
  }[state];
}
