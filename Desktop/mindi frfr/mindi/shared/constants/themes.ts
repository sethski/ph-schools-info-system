// =============================================================================
// MINDI Phase 1 — Shared Constants: Ambient Visual Themes
// Default: Calm Flow (soft blue pulses)
// =============================================================================

export interface AmbientThemeConfig {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgClass: string;
  orbColors: string[];
  animationSpeed: 'slow' | 'medium' | 'fast';
}

export const AMBIENT_THEMES: Record<string, AmbientThemeConfig> = {
  'calm-flow': {
    id: 'calm-flow',
    name: 'Calm Flow',
    description: 'Soft tide of indigo light — built for sustained focus',
    primaryColor: '#6366f1',
    secondaryColor: '#818cf8',
    accentColor: '#a5b4fc',
    bgClass: 'bg-slate-950',
    orbColors: ['#6366f130', '#818cf820', '#3730a310'],
    animationSpeed: 'slow',
  },
  'focused-spark': {
    id: 'focused-spark',
    name: 'Focused Spark',
    description: 'Electric cyan — sharp, high-energy focus',
    primaryColor: '#06b6d4',
    secondaryColor: '#22d3ee',
    accentColor: '#67e8f9',
    bgClass: 'bg-zinc-950',
    orbColors: ['#06b6d430', '#22d3ee20', '#0891b210'],
    animationSpeed: 'medium',
  },
  'grounded-earth': {
    id: 'grounded-earth',
    name: 'Grounded Earth',
    description: 'Warm amber and moss — rooted and calm',
    primaryColor: '#f59e0b',
    secondaryColor: '#10b981',
    accentColor: '#fcd34d',
    bgClass: 'bg-stone-950',
    orbColors: ['#f59e0b25', '#10b98120', '#d9770615'],
    animationSpeed: 'slow',
  },
};

export type ThemeId = keyof typeof AMBIENT_THEMES;
export const DEFAULT_THEME: ThemeId = 'calm-flow';
