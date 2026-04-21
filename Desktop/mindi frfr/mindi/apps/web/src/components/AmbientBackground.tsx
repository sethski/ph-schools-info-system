// =============================================================================
// MINDI Phase 1 — AmbientBackground
// Default: Calm Flow (soft indigo pulses).
// Respects prefers-reduced-motion.
// =============================================================================
'use client';

import { AMBIENT_THEMES, DEFAULT_THEME } from '../../../../shared/constants/themes';
import type { ThemeId } from '../../../../shared/constants/themes';

export default function AmbientBackground({ themeId = DEFAULT_THEME }: { themeId?: ThemeId }) {
  const theme = AMBIENT_THEMES[themeId] ?? AMBIENT_THEMES[DEFAULT_THEME];
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-[#0a0a0f]" />
      {theme.orbColors.map((color, i) => (
        <div key={i} className="mindi-orb absolute rounded-full"
          style={{
            background: color,
            width:  i === 0 ? '40vw' : i === 1 ? '28vw' : '20vw',
            height: i === 0 ? '40vw' : i === 1 ? '28vw' : '20vw',
            top:    i === 0 ? '-10%' : i === 1 ? '60%'  : '30%',
            left:   i === 0 ? '-8%'  : i === 1 ? '70%'  : '40%',
            filter: `blur(${60 + i * 20}px)`,
            animationDelay: `${i * 4}s`,
            animationDuration: theme.animationSpeed === 'slow' ? '14s' : theme.animationSpeed === 'fast' ? '8s' : '11s',
          }}
        />
      ))}
    </div>
  );
}
