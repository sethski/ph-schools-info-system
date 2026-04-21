// =============================================================================
// MINDI — AccessibilityPanel Component
// Full user control over all accessibility preferences.
// ui-ux-pro-max: every rule from the a11y checklist surfaced here.
// Preferences stored in Firestore and applied globally via CSS custom props.
// =============================================================================

'use client';

import { useState, useCallback, useEffect } from 'react';
import { A11Y_DEFAULTS, GESTURE_REGISTRY } from '../../../../../shared/constants/phase4';
import type { AccessibilityPrefs } from '../../../../../shared/types/phase4';

interface AccessibilityPanelProps {
  initialPrefs?: Partial<AccessibilityPrefs>;
  onSave: (prefs: AccessibilityPrefs) => void;
}

const DEFAULT_PREFS: AccessibilityPrefs = {
  reduceMotion: false,
  highContrast: false,
  largeText: false,
  screenReaderMode: false,
  colorBlindMode: 'none',
  captionsEnabled: false,
  keyboardNavOnly: false,
};

const COLOR_BLIND_OPTIONS = [
  { value: 'none',          label: 'None' },
  { value: 'deuteranopia',  label: 'Deuteranopia (red-green)' },
  { value: 'protanopia',    label: 'Protanopia (red-green)' },
  { value: 'tritanopia',    label: 'Tritanopia (blue-yellow)' },
] as const;

export default function AccessibilityPanel({
  initialPrefs = {},
  onSave,
}: AccessibilityPanelProps) {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>({ ...DEFAULT_PREFS, ...initialPrefs });
  const [saved, setSaved] = useState(false);

  // Apply prefs to document CSS custom properties immediately
  useEffect(() => {
    const root = document.documentElement;
    if (prefs.reduceMotion) {
      root.style.setProperty('--duration-fast', '1ms');
      root.style.setProperty('--duration-base', '1ms');
      root.style.setProperty('--duration-slow', '1ms');
    } else {
      root.style.removeProperty('--duration-fast');
      root.style.removeProperty('--duration-base');
      root.style.removeProperty('--duration-slow');
    }

    if (prefs.largeText) {
      root.style.setProperty('font-size', `${A11Y_DEFAULTS.LARGE_TEXT_SIZE_PX}px`);
    } else {
      root.style.setProperty('font-size', `${A11Y_DEFAULTS.MIN_FONT_SIZE_PX}px`);
    }

    if (prefs.highContrast) {
      root.style.setProperty('--color-border', 'rgba(255,255,255,0.25)');
      root.style.setProperty('--color-bg-surface', 'rgba(255,255,255,0.08)');
    } else {
      root.style.removeProperty('--color-border');
      root.style.removeProperty('--color-bg-surface');
    }
  }, [prefs]);

  const toggle = useCallback((key: keyof AccessibilityPrefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }, []);

  const handleSave = useCallback(() => {
    onSave(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [prefs, onSave]);

  const ToggleRow = ({
    label,
    description,
    prefKey,
    disabled = false,
  }: {
    label: string;
    description: string;
    prefKey: keyof AccessibilityPrefs;
    disabled?: boolean;
  }) => (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-white/5 last:border-0">
      <div className="flex-1">
        <p className="text-sm text-white/80">{label}</p>
        <p className="text-xs text-white/35 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => toggle(prefKey)}
        disabled={disabled}
        role="switch"
        aria-checked={!!prefs[prefKey]}
        aria-label={label}
        className={`
          flex-shrink-0 w-10 h-6 rounded-full border transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-transparent
          disabled:opacity-40
          ${prefs[prefKey]
            ? 'bg-indigo-500 border-indigo-400'
            : 'bg-white/8 border-white/15'
          }
        `}
        style={{ minWidth: A11Y_DEFAULTS.TOUCH_TARGET_MIN_PX, minHeight: A11Y_DEFAULTS.TOUCH_TARGET_MIN_PX }}
      >
        <span
          className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 mx-1 ${
            prefs[prefKey] ? 'translate-x-4' : 'translate-x-0'
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-sm font-semibold text-white/70 mb-1">Accessibility</h3>
        <p className="text-xs text-white/35">Mindi adapts to how you work best.</p>
      </div>

      <div className="bg-white/3 border border-white/8 rounded-xl px-4">
        <ToggleRow
          prefKey="reduceMotion"
          label="Reduce motion"
          description="Disable all animations and transitions"
        />
        <ToggleRow
          prefKey="highContrast"
          label="High contrast"
          description="Increase border and surface contrast"
        />
        <ToggleRow
          prefKey="largeText"
          label="Large text"
          description={`Scale body text to ${A11Y_DEFAULTS.LARGE_TEXT_SIZE_PX}px`}
        />
        <ToggleRow
          prefKey="screenReaderMode"
          label="Screen reader mode"
          description="Extra ARIA hints, removes decorative elements"
        />
        <ToggleRow
          prefKey="captionsEnabled"
          label="Captions"
          description="Show captions for all voice responses"
        />
        <ToggleRow
          prefKey="keyboardNavOnly"
          label="Keyboard navigation only"
          description="Disables gesture-only features"
        />
      </div>

      {/* Color blind mode */}
      <div className="space-y-2">
        <label
          htmlFor="colorblind-mode"
          className="text-xs text-white/40 uppercase tracking-wide block"
        >
          Color-blind palette
        </label>
        <select
          id="colorblind-mode"
          value={prefs.colorBlindMode}
          onChange={(e) => setPrefs((p) => ({ ...p, colorBlindMode: e.target.value as AccessibilityPrefs['colorBlindMode'] }))}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-indigo-400/50 min-h-[44px] appearance-none cursor-pointer"
        >
          {COLOR_BLIND_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Gesture keyboard shortcuts reference */}
      <div className="space-y-2">
        <p className="text-xs text-white/40 uppercase tracking-wide">Gesture keyboard shortcuts</p>
        <div className="bg-white/3 border border-white/8 rounded-xl divide-y divide-white/5">
          {Object.values(GESTURE_REGISTRY).map((g) => (
            <div key={g.type} className="flex items-start justify-between gap-3 px-4 py-2.5">
              <p className="text-xs text-white/60">{g.description}</p>
              <code className="text-[10px] text-indigo-400/70 bg-indigo-500/10 px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0">
                {g.keyboardShortcut?.split(' ')[0]}
              </code>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-3 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-sm font-medium hover:bg-indigo-500/30 transition-all min-h-[44px]"
      >
        {saved ? '✓ Saved' : 'Save preferences'}
      </button>
    </div>
  );
}
