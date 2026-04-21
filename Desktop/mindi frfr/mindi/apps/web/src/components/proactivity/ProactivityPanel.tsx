// =============================================================================
// MINDI — ProactivityPanel Component
// Shows active alerts, emotional state indicator, and Calm the Storm mode.
// Respects ui-ux-pro-max: reduced-motion, 44pt touch targets, semantic colors.
// =============================================================================

'use client';

import { useCallback } from 'react';
import type { ProactivityAlert, EmotionalSignals } from '../../../../../shared/types/phase2';
import { RISK_GATE } from '../../../../../shared/constants/phase2';

interface ProactivityPanelProps {
  alerts: ProactivityAlert[];
  emotionalState: EmotionalSignals | null;
  onDismiss: (alertId: string) => void;
  onAction: (alert: ProactivityAlert) => void;
}

export default function ProactivityPanel({
  alerts,
  emotionalState,
  onDismiss,
  onAction,
}: ProactivityPanelProps) {
  const isStressed =
    emotionalState?.detectedState === 'stressed' ||
    emotionalState?.detectedState === 'fatigued';

  if (alerts.length === 0 && !isStressed) return null;

  return (
    <div className="space-y-2" role="region" aria-label="Mindi suggestions">
      {/* Calm the Storm — stress support mode */}
      {isStressed && (
        <div
          className="flex items-start gap-3 px-4 py-3.5 rounded-xl border"
          style={{
            background: 'rgba(245, 158, 11, 0.06)',
            borderColor: 'rgba(245, 158, 11, 0.15)',
          }}
          role="alert"
          aria-live="polite"
        >
          <span className="text-lg" aria-hidden="true">🌊</span>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-amber-300">
              {emotionalState?.detectedState === 'fatigued'
                ? "You've been at it for a while"
                : "Mindi notices some tension"}
            </p>
            <p className="text-xs text-amber-300/60">
              {emotionalState?.detectedState === 'fatigued'
                ? "A short break can sharpen your focus. Your work will be here when you return."
                : "Take a breath. You're doing well. Want Mindi to summarize where you left off?"}
            </p>
          </div>
        </div>
      )}

      {/* Active alerts */}
      {alerts.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onDismiss={onDismiss}
          onAction={onAction}
        />
      ))}
    </div>
  );
}

function AlertCard({
  alert,
  onDismiss,
  onAction,
}: {
  alert: ProactivityAlert;
  onDismiss: (id: string) => void;
  onAction: (alert: ProactivityAlert) => void;
}) {
  const priorityColors = {
    high: { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)', dot: '#ef4444' },
    medium: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.15)', dot: '#f59e0b' },
    low: { bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.15)', dot: '#6366f1' },
  };

  const colors = priorityColors[alert.priority];

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl border"
      style={{ background: colors.bg, borderColor: colors.border }}
    >
      {/* Priority dot */}
      <div
        className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: colors.dot }}
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-sm font-medium text-white/80">{alert.title}</p>
        <p className="text-xs text-white/45 leading-relaxed">{alert.body}</p>

        {alert.actionLabel && (
          <button
            onClick={() => onAction(alert)}
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors underline-offset-2 hover:underline min-h-[44px] flex items-center"
          >
            {alert.actionLabel} →
          </button>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(alert.id)}
        aria-label={`Dismiss: ${alert.title}`}
        className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-white/25 hover:text-white/50 hover:bg-white/5 transition-all min-w-[44px] min-h-[44px]"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
          <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
