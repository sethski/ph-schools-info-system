// =============================================================================
// MINDI — PersonalitySelector Component
// Visual theme picker. Live preview via AmbientCanvas miniature.
// =============================================================================

'use client';

import { useState } from 'react';
import { AMBIENT_PERSONALITIES } from '../../../../../shared/constants/phase4';
import type { PersonalityId } from '../../../../../shared/types/phase4';
import AmbientCanvas from '../ambient/AmbientCanvas';

interface PersonalitySelectorProps {
  currentId: PersonalityId;
  onChange: (id: PersonalityId) => void;
}

const PERSONALITY_IDS = Object.keys(AMBIENT_PERSONALITIES).filter(
  (id) => id !== 'custom'
) as PersonalityId[];

export default function PersonalitySelector({ currentId, onChange }: PersonalitySelectorProps) {
  const [hoveredId, setHoveredId] = useState<PersonalityId | null>(null);
  const previewId = hoveredId ?? currentId;
  const previewPersonality = AMBIENT_PERSONALITIES[previewId];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-sm font-semibold text-white/70 mb-1">
          Visual Personality
        </h3>
        <p className="text-xs text-white/35">
          Mindi's ambient presence adapts to your mood and work style.
        </p>
      </div>

      {/* Live preview */}
      <div
        className="relative w-full h-32 rounded-2xl overflow-hidden border border-white/8"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[#0f0f13]" />
        <AmbientCanvas personality={previewPersonality} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-0.5">
            <p
              className="font-display text-base font-semibold"
              style={{ color: previewPersonality.primaryColor }}
            >
              {previewPersonality.name}
            </p>
            <p className="text-xs text-white/30">{previewPersonality.description}</p>
          </div>
        </div>
      </div>

      {/* Personality grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PERSONALITY_IDS.map((id) => {
          const p = AMBIENT_PERSONALITIES[id];
          const isActive = currentId === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              onMouseEnter={() => setHoveredId(id)}
              onMouseLeave={() => setHoveredId(null)}
              aria-pressed={isActive}
              aria-label={`${p.name} — ${p.description}`}
              className={`
                relative flex flex-col items-start gap-1.5 p-3 rounded-xl border
                transition-all duration-200 min-h-[44px] text-left overflow-hidden
                ${isActive
                  ? 'border-white/25 scale-[1.02]'
                  : 'border-white/8 hover:border-white/15'
                }
              `}
              style={{
                background: isActive ? `${p.primaryColor}12` : 'rgba(255,255,255,0.02)',
              }}
            >
              {/* Color dots */}
              <div className="flex gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: p.primaryColor }}
                  aria-hidden="true"
                />
                <span
                  className="w-2.5 h-2.5 rounded-full opacity-60"
                  style={{ background: p.secondaryColor }}
                  aria-hidden="true"
                />
              </div>
              <span className="text-xs font-medium text-white/75">{p.name}</span>

              {/* Active indicator */}
              {isActive && (
                <span
                  className="absolute top-2 right-2 text-[10px] font-semibold"
                  style={{ color: p.primaryColor }}
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
