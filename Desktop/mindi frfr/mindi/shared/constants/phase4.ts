// =============================================================================
// MINDI — Phase 4 Constants
// Ambient personalities, gesture registry, voice pipeline config, locales.
// =============================================================================

import type { AmbientPersonality, PersonalityId, GestureConfig, LocaleConfig } from '../types/phase4';

// -----------------------------------------------------------------------------
// AMBIENT VISUAL PERSONALITIES
// frontend-design skill: distinctive, non-generic, intentional aesthetics
// -----------------------------------------------------------------------------

export const AMBIENT_PERSONALITIES: Record<PersonalityId, AmbientPersonality> = {
  'calm-flow': {
    id: 'calm-flow',
    name: 'Calm Flow',
    description: 'Soft tide of indigo light — built for sustained focus',
    primaryColor: '#6366f1',
    secondaryColor: '#818cf8',
    particleShape: 'ring',
    particleDensity: 0.3,
    particleSpeed: 0.2,
    glowIntensity: 0.4,
    backgroundNoise: false,
    soundCue: 'soft_chime',
    orbCount: 3,
    orbBlurRadius: 80,
  },
  'focused-spark': {
    id: 'focused-spark',
    name: 'Focused Spark',
    description: 'Electric cyan bursts — for when clarity matters most',
    primaryColor: '#06b6d4',
    secondaryColor: '#22d3ee',
    particleShape: 'spark',
    particleDensity: 0.6,
    particleSpeed: 0.5,
    glowIntensity: 0.7,
    backgroundNoise: false,
    soundCue: 'spark_pop',
    orbCount: 2,
    orbBlurRadius: 60,
  },
  'grounded-earth': {
    id: 'grounded-earth',
    name: 'Grounded Earth',
    description: 'Warm amber and moss — rooted, steady, present',
    primaryColor: '#f59e0b',
    secondaryColor: '#10b981',
    particleShape: 'dot',
    particleDensity: 0.2,
    particleSpeed: 0.15,
    glowIntensity: 0.35,
    backgroundNoise: true,
    soundCue: 'deep_pulse',
    orbCount: 4,
    orbBlurRadius: 100,
  },
  'midnight-deep': {
    id: 'midnight-deep',
    name: 'Midnight Deep',
    description: 'Near-invisible neural threads — Mindi working silently',
    primaryColor: '#312e81',
    secondaryColor: '#1e1b4b',
    particleShape: 'neural',
    particleDensity: 0.8,
    particleSpeed: 0.1,
    glowIntensity: 0.15,
    backgroundNoise: true,
    soundCue: 'none',
    orbCount: 2,
    orbBlurRadius: 120,
  },
  'warm-ember': {
    id: 'warm-ember',
    name: 'Warm Ember',
    description: 'Rose and copper glow — late nights, creative sessions',
    primaryColor: '#f43f5e',
    secondaryColor: '#fb923c',
    particleShape: 'diamond',
    particleDensity: 0.4,
    particleSpeed: 0.25,
    glowIntensity: 0.5,
    backgroundNoise: true,
    soundCue: 'soft_chime',
    orbCount: 3,
    orbBlurRadius: 90,
  },
  'custom': {
    id: 'custom',
    name: 'Custom',
    description: 'Your own palette',
    primaryColor: '#6366f1',
    secondaryColor: '#818cf8',
    particleShape: 'dot',
    particleDensity: 0.3,
    particleSpeed: 0.2,
    glowIntensity: 0.4,
    backgroundNoise: false,
    soundCue: 'none',
    orbCount: 3,
    orbBlurRadius: 80,
  },
};

// -----------------------------------------------------------------------------
// GESTURE REGISTRY
// ui-ux-pro-max: gesture-alternative — every gesture has keyboard fallback
// -----------------------------------------------------------------------------

export const GESTURE_REGISTRY: Record<string, GestureConfig> = {
  'drag-to-connect': {
    type: 'drag-to-connect',
    enabled: true,
    hasKeyboardAlternative: true,
    keyboardShortcut: 'C (select source node, then C, then select target)',
    description: 'Drag from one node to another to create a connection',
  },
  'pinch-to-drill': {
    type: 'pinch-to-drill',
    enabled: true,
    hasKeyboardAlternative: true,
    keyboardShortcut: 'Enter (on focused node)',
    description: 'Pinch in on a node to drill into its details',
  },
  'swipe-to-delegate': {
    type: 'swipe-to-delegate',
    enabled: true,
    hasKeyboardAlternative: true,
    keyboardShortcut: 'D (on focused node)',
    description: 'Swipe right on a task node to delegate it to Mindi',
  },
  'hold-to-reflect': {
    type: 'hold-to-reflect',
    enabled: true,
    hasKeyboardAlternative: true,
    keyboardShortcut: 'R (on focused node)',
    description: 'Long-press a node to open reflection mode',
  },
  'two-finger-rotate': {
    type: 'two-finger-rotate',
    enabled: true,
    hasKeyboardAlternative: true,
    keyboardShortcut: 'Shift+← / Shift+→ to rotate graph view',
    description: 'Two-finger rotate to change graph orientation',
  },
  'double-tap-expand': {
    type: 'double-tap-expand',
    enabled: true,
    hasKeyboardAlternative: true,
    keyboardShortcut: 'Space (on focused node)',
    description: 'Double-tap a node to expand its related nodes',
  },
};

// -----------------------------------------------------------------------------
// ADVANCED VOICE CONFIG (Phase 4: Coqui XTTS upgrade)
// voice-agents skill: pipeline STT→LLM→TTS, latency budget per stage
// -----------------------------------------------------------------------------

export const VOICE_ADVANCED_CONFIG = {
  // Reference audio requirements for voice cloning
  CLONE_MIN_SAMPLES: 3,
  CLONE_MIN_MINUTES: 1.0,
  CLONE_RECOMMENDED_MINUTES: 5.0,

  // Latency budget for cloned voice (longer than Web Speech API)
  LATENCY_BUDGET_CLONED_MS: {
    stt: 200,
    llm: 1500,
    tts_clone: 800,    // XTTS synthesis adds ~500ms over Web Speech
    total: 2500,       // Target ceiling
  },

  // Watermarking — imperceptible but detectable
  WATERMARK_FREQUENCY_HZ: 19500, // Near-ultrasonic, inaudible
  WATERMARK_PAYLOAD: 'mindi-voice-v1',

  // Privacy: all model files stored locally
  LOCAL_MODEL_DIR: 'mindi_voice_models',
  NEVER_UPLOAD_AUDIO: true,
} as const;

// -----------------------------------------------------------------------------
// LOCALIZATION
// -----------------------------------------------------------------------------

export const LOCALES: Record<string, LocaleConfig> = {
  en: {
    locale: 'en',
    label: 'English',
    flag: '🇺🇸',
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: { style: 'decimal', maximumFractionDigits: 2 },
  },
  tl: {
    locale: 'tl',
    label: 'Filipino',
    flag: '🇵🇭',
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: { style: 'decimal', maximumFractionDigits: 2 },
  },
};

// -----------------------------------------------------------------------------
// ACCESSIBILITY DEFAULTS
// ui-ux-pro-max: all a11y rules applied here as runtime-configurable defaults
// -----------------------------------------------------------------------------

export const A11Y_DEFAULTS = {
  MIN_FONT_SIZE_PX: 16,
  LARGE_TEXT_SIZE_PX: 18,
  MIN_CONTRAST_RATIO: 4.5,
  MIN_LARGE_TEXT_CONTRAST: 3.0,
  FOCUS_RING_WIDTH_PX: 2,
  TOUCH_TARGET_MIN_PX: 44,
  ANIMATION_DURATION_REDUCED_MS: 1,
  COLOR_BLIND_SAFE_PALETTE: {
    writing:      '#5B6CF6', // Shifted from pure indigo for deuteranopia
    code:         '#0891B2',
    personal:     '#D97706',
    academic:     '#059669',
    creative:     '#DB2777',
    professional: '#7C3AED',
  },
} as const;

// -----------------------------------------------------------------------------
// LAUNCH ANALYTICS TARGETS (Phase 4 success metrics)
// -----------------------------------------------------------------------------

export const LAUNCH_TARGETS = {
  AUTHENTICITY_SCORE_MIN: 4.5,       // Out of 5
  TRUST_ACCURACY_MIN: 0.90,          // 90%
  TIME_SAVED_TARGET_PCT: 0.30,       // 30%
  SESSIONS_PER_WEEK_TARGET: 3,
  EMOTIONAL_FIT_SCORE_MIN: 4.0,      // Out of 5
  LOAD_TIME_3G_MAX_MS: 2000,
  CRITICAL_BUGS_BETA_MAX: 0,
} as const;
