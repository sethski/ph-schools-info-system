// =============================================================================
// MINDI — Phase 4 Types
// Ambient UI, personality layers, scenario planning, time-travel,
// advanced voice, accessibility, localization, launch analytics.
// =============================================================================

import type { NodeRegion } from './index';

// -----------------------------------------------------------------------------
// AMBIENT VISUAL PERSONALITY
// -----------------------------------------------------------------------------

export type ParticleShape = 'dot' | 'ring' | 'diamond' | 'spark' | 'neural';
export type SoundCue = 'soft_chime' | 'deep_pulse' | 'spark_pop' | 'none';

export interface AmbientPersonality {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  particleShape: ParticleShape;
  particleDensity: number;       // 0–1
  particleSpeed: number;         // 0–1
  glowIntensity: number;         // 0–1
  backgroundNoise: boolean;      // Subtle grain overlay
  soundCue: SoundCue;
  orbCount: number;
  orbBlurRadius: number;
}

// Predefined personalities + custom slot
export type PersonalityId =
  | 'calm-flow'
  | 'focused-spark'
  | 'grounded-earth'
  | 'midnight-deep'
  | 'warm-ember'
  | 'custom';

// -----------------------------------------------------------------------------
// ADVANCED GESTURES
// -----------------------------------------------------------------------------

export type GestureType =
  | 'drag-to-connect'     // Phase 1
  | 'pinch-to-drill'      // Phase 1
  | 'swipe-to-delegate'   // Phase 4
  | 'hold-to-reflect'     // Phase 4
  | 'two-finger-rotate'   // Phase 4
  | 'double-tap-expand';  // Phase 4

export interface GestureConfig {
  type: GestureType;
  enabled: boolean;
  hasKeyboardAlternative: boolean; // Trust Covenant: always provide alternative
  keyboardShortcut?: string;
  description: string;
}

// -----------------------------------------------------------------------------
// "SIMULATE MY FUTURE" — Scenario Planning
// -----------------------------------------------------------------------------

export type ScenarioPerspective = 'past-me' | 'current-me' | 'ideal-me';

export interface ScenarioInput {
  decision: string;            // "Should I switch careers to ML engineering?"
  timeframeMonths: number;     // 6, 12, 24, 60
  perspective: ScenarioPerspective;
  includeRegions: NodeRegion[];
}

export interface ScenarioOutcome {
  id: string;
  userId: string;
  input: ScenarioInput;
  narrative: string;           // GPT-style story of the future
  prosNarrative: string;
  consNarrative: string;
  confidenceScore: number;
  evidenceNodeIds: string[];
  generatedAt: Date;
}

// Time-travel style comparison
export interface StyleSnapshot {
  perspective: ScenarioPerspective;
  capturedAt: Date;
  toneKeywords: string[];
  avgSentenceLength: number;
  dominantThemes: string[];
  vocabLevel: string;
  characterSummary: string;    // 1-2 sentence plain English description
}

// -----------------------------------------------------------------------------
// ADVANCED VOICE — Coqui XTTS / OpenVoice
// voice-agents skill: pipeline architecture, watermarking, local-first
// -----------------------------------------------------------------------------

export type VoiceCloneStatus =
  | 'not_started'
  | 'recording'            // Collecting reference audio
  | 'processing'           // XTTS processing
  | 'ready'
  | 'error';

export interface VoiceProfile {
  userId: string;
  status: VoiceCloneStatus;
  referenceAudioCount: number;    // How many samples collected
  referenceAudioMinutes: number;  // Total minutes collected
  modelPath?: string;             // Local path — never uploaded
  isWatermarked: boolean;
  consentDate: Date;
  lastUsedAt?: Date;
}

export type SpeakerLabel = 'user' | 'other';

export interface DiarizationSegment {
  startMs: number;
  endMs: number;
  speaker: SpeakerLabel;
  transcript: string;
  confidence: number;
}

// -----------------------------------------------------------------------------
// ACCESSIBILITY
// -----------------------------------------------------------------------------

export interface AccessibilityPrefs {
  reduceMotion: boolean;           // Overrides system pref
  highContrast: boolean;
  largeText: boolean;              // Scales body to 18px+
  screenReaderMode: boolean;       // Extra ARIA hints, no decorative elements
  colorBlindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  captionsEnabled: boolean;        // Caption all voice responses
  keyboardNavOnly: boolean;        // Disables all gesture-only features
}

// -----------------------------------------------------------------------------
// LOCALIZATION
// -----------------------------------------------------------------------------

export type SupportedLocale = 'en' | 'tl'; // English | Filipino (Tagalog)

export interface LocaleConfig {
  locale: SupportedLocale;
  label: string;
  flag: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  numberFormat: Intl.NumberFormatOptions;
}

// -----------------------------------------------------------------------------
// LAUNCH ANALYTICS (privacy-preserving, no PII)
// -----------------------------------------------------------------------------

export type AnalyticsEvent =
  | 'session_start'
  | 'session_end'
  | 'feature_used'
  | 'upload_complete'
  | 'chat_message_sent'
  | 'rating_submitted'
  | 'error_occurred'
  | 'onboarding_step_completed';

export interface AnalyticsPayload {
  event: AnalyticsEvent;
  feature?: string;
  durationMs?: number;
  errorCode?: string;
  onboardingStep?: number;
  // No PII — no userId, no content, no email
}

// Authenticity rating — primary Phase 4 success metric
export interface AuthenticityRating {
  userId: string;
  sessionId: string;
  score: number;              // 1–5
  prompt: string;             // Which interaction prompted the rating
  feedback?: 'tone' | 'accuracy' | 'structure' | 'voice'; // What felt off
  submittedAt: Date;
}
