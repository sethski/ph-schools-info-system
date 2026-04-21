// =============================================================================
// MINDI Phase 1 — NodeCard
// ReactFlow custom node: region badge, confidence ring, contradiction flag.
// Keyboard accessible (Enter = drill-down). Meets 44×44pt touch target.
// =============================================================================
'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { REGIONS } from '../../../../../shared/constants/regions';
import type { BrainNode } from '../../../../../shared/types/node';

interface NodeCardData { node: BrainNode; onDrill: (n: BrainNode) => void; }

function NodeCard({ data, selected }: NodeProps<NodeCardData>) {
  const { node, onDrill } = data;
  const region = REGIONS[node.region];
  const pct    = Math.round(node.confidence * 100);
  const R = 18;
  const circ = 2 * Math.PI * R;

  return (
    <div
      role="button" tabIndex={0}
      aria-label={`${node.title} — ${node.region} region, ${pct}% confidence${node.contradictionFlag ? ', contradiction flagged' : ''}`}
      data-node-id={node.id}
      onClick={() => onDrill(node)}
      onKeyDown={e => e.key === 'Enter' && onDrill(node)}
      className="relative cursor-pointer"
      style={{ minWidth: 44, minHeight: 44 }}
    >
      <Handle type="target" position={Position.Top}    className="!w-2 !h-2 !opacity-30" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !opacity-30" />

      <div
        className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border backdrop-blur-sm transition-all duration-200
          ${selected ? 'border-white/35 scale-105' : 'border-white/10 hover:border-white/25 hover:scale-102'}`}
        style={{
          background: `linear-gradient(135deg, ${region.color}18, ${region.color}06)`,
          boxShadow: selected ? `0 0 20px ${region.color}40` : undefined,
        }}
      >
        {/* Confidence ring */}
        <div className="relative w-10 h-10 flex items-center justify-center">
          <svg width="40" height="40" className="-rotate-90 absolute inset-0" aria-hidden="true">
            <circle cx="20" cy="20" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
            <circle cx="20" cy="20" r={R} fill="none" stroke={region.color} strokeWidth="2"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - node.confidence)}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
          </svg>
          <span className="text-[10px] font-semibold z-10" style={{ color: region.color }}>{pct}%</span>
        </div>

        {/* Region badge */}
        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full uppercase tracking-wider"
          style={{ background: `${region.color}25`, color: region.color }}>
          {region.label}
        </span>

        {/* Title */}
        <span className="text-[11px] text-white/70 font-medium max-w-[100px] truncate text-center leading-tight">
          {node.title}
        </span>

        {/* Contradiction flag */}
        {node.contradictionFlag && (
          <span className="text-[9px] text-amber-400 font-medium" role="alert" aria-label="Contradiction pending review">
            ⚠ Review
          </span>
        )}
      </div>
    </div>
  );
}

export default memo(NodeCard);
