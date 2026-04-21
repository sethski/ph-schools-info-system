// =============================================================================
// MINDI — VoiceButton Component
// Push-to-talk with consent gate.
// Shows: status indicator, transcript, response, pipeline latency.
// voice-agents skill: pipeline STT→LLM→TTS, budget under 2s total.
// =============================================================================

'use client';

import { useState } from 'react';
import { useVoice } from '../../hooks/useVoice';

export default function VoiceButton() {
  const {
    status,
    transcript,
    response,
    latencyMs,
    error,
    consentGiven,
    isSupported,
    startListening,
    stopListening,
    grantConsent,
    revokeConsent,
  } = useVoice();

  const [showConsent, setShowConsent] = useState(false);

  if (!isSupported) {
    return (
      <p className="text-xs text-white/25 text-center">
        Voice not supported in this browser.
      </p>
    );
  }

  // Consent gate
  if (!consentGiven) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setShowConsent(true)}
          className="w-full py-3 bg-white/5 border border-white/10 text-white/50 rounded-xl text-sm hover:bg-white/8 hover:text-white/70 transition-all min-h-[44px]"
        >
          🎙 Enable Voice
        </button>

        {showConsent && (
          <div
            className="p-4 rounded-xl bg-amber-500/8 border border-amber-500/15 space-y-3"
            role="dialog"
            aria-label="Voice consent"
          >
            <p className="text-sm text-white/70 font-medium">Before enabling voice</p>
            <ul className="text-xs text-white/45 space-y-1 list-disc list-inside">
              <li>Your microphone is used only while you're actively holding the button</li>
              <li>Audio is processed locally — never uploaded in Phase 2</li>
              <li>Transcripts are sent to Mindi's AI (same as chat, PII-redacted)</li>
              <li>You can disable voice at any time</li>
            </ul>
            <div className="flex gap-2">
              <button
                onClick={() => { grantConsent(); setShowConsent(false); }}
                className="flex-1 py-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-lg text-xs font-medium hover:bg-indigo-500/30 transition-all min-h-[44px]"
              >
                I understand — Enable
              </button>
              <button
                onClick={() => setShowConsent(false)}
                className="flex-1 py-2 bg-white/5 border border-white/8 text-white/40 rounded-lg text-xs font-medium hover:bg-white/8 transition-all min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const isActive = status === 'listening' || status === 'processing' || status === 'speaking';
  const statusLabel = {
    idle: 'Hold to speak',
    listening: 'Listening…',
    processing: 'Thinking…',
    speaking: 'Speaking…',
    error: 'Error',
  }[status];

  const statusColor = {
    idle: 'rgba(255,255,255,0.3)',
    listening: '#6366f1',
    processing: '#f59e0b',
    speaking: '#10b981',
    error: '#ef4444',
  }[status];

  return (
    <div className="space-y-3">
      {/* Main voice button */}
      <div className="flex flex-col items-center gap-2">
        <button
          onMouseDown={startListening}
          onMouseUp={stopListening}
          onTouchStart={startListening}
          onTouchEnd={stopListening}
          disabled={status === 'processing' || status === 'speaking'}
          aria-label={statusLabel}
          aria-pressed={status === 'listening'}
          className={`
            w-16 h-16 rounded-full border-2 flex items-center justify-center
            transition-all duration-150 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500/50
          `}
          style={{
            background: isActive ? `${statusColor}20` : 'rgba(255,255,255,0.04)',
            borderColor: statusColor,
            boxShadow: status === 'listening' ? `0 0 20px ${statusColor}40` : undefined,
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            style={{ color: statusColor }}
          >
            {status === 'speaking' ? (
              // Speaker icon
              <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            ) : (
              // Mic icon
              <>
                <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </>
            )}
          </svg>
        </button>

        <span className="text-xs text-white/40">{statusLabel}</span>

        {/* Latency badge */}
        {latencyMs && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{
              background: latencyMs < 2000 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
              color: latencyMs < 2000 ? '#10b981' : '#f59e0b',
            }}
          >
            {latencyMs}ms
          </span>
        )}
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="bg-white/3 border border-white/8 rounded-xl px-3 py-2.5">
          <p className="text-[10px] text-white/30 mb-1">You said</p>
          <p className="text-xs text-white/60 italic">"{transcript}"</p>
        </div>
      )}

      {/* Response */}
      {response && (
        <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl px-3 py-2.5">
          <p className="text-[10px] text-indigo-400/50 mb-1">Mindi</p>
          <p className="text-xs text-white/70 leading-relaxed">{response.slice(0, 300)}</p>
        </div>
      )}

      {error && <p role="alert" className="text-xs text-red-400 text-center">{error}</p>}

      {/* Disable voice */}
      <button
        onClick={revokeConsent}
        className="text-[10px] text-white/20 hover:text-white/40 transition-colors w-full text-center min-h-[44px] flex items-center justify-center"
      >
        Disable voice & clear consent
      </button>
    </div>
  );
}
