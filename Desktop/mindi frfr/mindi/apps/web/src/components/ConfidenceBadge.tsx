// =============================================================================
// MINDI Phase 1 — ConfidenceBadge + RegionTag
// =============================================================================
'use client';

import { REGIONS } from '../../../../shared/constants/regions';
import { CONFIDENCE_THRESHOLD } from '../../../../shared/constants/risk';
import type { NodeRegion } from '../../../../shared/types/node';

export function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const isLow = score < CONFIDENCE_THRESHOLD;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
      ${isLow ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}
      aria-label={`${pct}% confidence${isLow ? ' — consider adding more context' : ''}`}>
      {pct}%
    </span>
  );
}

export function RegionTag({ region }: { region: NodeRegion }) {
  const config = REGIONS[region];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider"
      style={{ background: `${config.color}20`, color: config.color }}>
      {config.label}
    </span>
  );
}
