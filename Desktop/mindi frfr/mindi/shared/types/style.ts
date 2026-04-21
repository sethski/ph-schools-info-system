// =============================================================================
// MINDI Phase 1 — Shared Types: StyleFingerprint
// Produced by backend/functions/src/style/extract.py
// =============================================================================

import type { NodeRegion } from './node';

export interface StyleFingerprint {
  userId: string;
  overall: StyleProfile;
  byRegion: Partial<Record<NodeRegion, StyleProfile>>;
  lastUpdated: Date;
  nodeCount: number;
  styleMatchScore?: number;   // 0–1, used for RAG output calibration
}

export interface StyleProfile {
  toneKeywords: string[];       // e.g. ['analytical', 'warm', 'concise']
  avgSentenceLength: number;
  vocabLevel: 'simple' | 'intermediate' | 'advanced';
  preferredStructure: 'prose' | 'bullets' | 'mixed';
  formalityScore: number;       // 0–1
  writingRhythm: string;        // e.g. 'short punchy sentences', 'long flowing paragraphs'
  codeStyle?: CodeStyleProfile;
}

export interface CodeStyleProfile {
  preferredLanguages: string[];
  namingConvention: 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case';
  commentDensity: 'minimal' | 'moderate' | 'verbose';
  preferredFrameworks: string[];
  architecturePatterns: string[];  // e.g. ['MVC', 'functional', 'class-based']
}
