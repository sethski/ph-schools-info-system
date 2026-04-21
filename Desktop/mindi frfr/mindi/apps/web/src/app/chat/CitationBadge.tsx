// =============================================================================
// MINDI Phase 1 — CitationBadge
// Shows source citation with region color, confidence, and file reference.
// =============================================================================
'use client';

import { REGIONS } from '../../../../../shared/constants/regions';
import type { Citation } from '../../../../../shared/types/response';

export default function CitationBadge({ citation }: { citation: Citation }) {
  const region = REGIONS[citation.region];
  const label = citation.sourceRef?.fileName
    ? `${citation.sourceRef.fileName}${citation.sourceRef.paragraph ? `#p${citation.sourceRef.paragraph}` : ''}`
    : citation.nodeTitle;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border cursor-default"
      style={{ background: `${region?.color ?? '#6366f1'}15`, borderColor: `${region?.color ?? '#6366f1'}30`, color: region?.color ?? '#a5b4fc' }}
      title={citation.excerpt}
      aria-label={`Source: ${label} (${Math.round(citation.confidence * 100)}% confidence)`}
    >
      <span className="opacity-60">[{region?.label ?? citation.region}]</span>
      <span className="max-w-[120px] truncate">{label}</span>
      <span className="opacity-50">·</span>
      <span>{Math.round(citation.confidence * 100)}%</span>
    </span>
  );
}
