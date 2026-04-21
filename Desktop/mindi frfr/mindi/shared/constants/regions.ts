// =============================================================================
// MINDI Phase 1 — Shared Constants: Regions
// =============================================================================

import type { NodeRegion } from '../types/node';

export const REGIONS: Record<NodeRegion, {
  label: string;
  color: string;
  description: string;
  alwaysEncrypted: boolean;
}> = {
  writing: {
    label: 'Writing',
    color: '#6366f1',
    description: 'Essays, notes, journal entries, articles',
    alwaysEncrypted: false,
  },
  code: {
    label: 'Code',
    color: '#06b6d4',
    description: 'Code snippets, architecture decisions, PRs',
    alwaysEncrypted: false,
  },
  personal: {
    label: 'Personal',
    color: '#f59e0b',
    description: 'Goals, values, reflections',
    alwaysEncrypted: true,   // Personal is ALWAYS encrypted
  },
  academic: {
    label: 'Academic',
    color: '#10b981',
    description: 'Lectures, research, assignments, textbooks',
    alwaysEncrypted: false,
  },
  creative: {
    label: 'Creative',
    color: '#ec4899',
    description: 'Designs, stories, brainstorms, art notes',
    alwaysEncrypted: false,
  },
  professional: {
    label: 'Professional',
    color: '#8b5cf6',
    description: 'Emails, reports, presentations, work notes',
    alwaysEncrypted: false,
  },
};
