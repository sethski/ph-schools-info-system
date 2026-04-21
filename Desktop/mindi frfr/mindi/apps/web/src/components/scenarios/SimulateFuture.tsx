// =============================================================================
// MINDI — SimulateFuture Component
// "What would my life look like if I...?"
// Perspective: Past Me / Current Me / Ideal Me.
// Gentle, grounded, empowering — never alarmist.
// =============================================================================

'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { ScenarioPerspective } from '../../../../../shared/types/phase4';

interface ScenarioResult {
  scenarioId: string;
  narrative: string;
  prosNarrative: string;
  consNarrative: string;
  groundingQuestion: string;
  evidenceNodeIds: string[];
}

const PERSPECTIVES: Array<{
  id: ScenarioPerspective;
  label: string;
  description: string;
  icon: string;
}> = [
  { id: 'past-me',    label: 'Past Me',    description: 'Who I was — patterns & fears',  icon: '◁' },
  { id: 'current-me', label: 'Current Me', description: 'Who I am right now',             icon: '◉' },
  { id: 'ideal-me',   label: 'Ideal Me',   description: 'Who I\'m becoming',              icon: '▷' },
];

const TIMEFRAMES = [
  { months: 6,  label: '6 months' },
  { months: 12, label: '1 year' },
  { months: 24, label: '2 years' },
  { months: 60, label: '5 years' },
];

export default function SimulateFuture() {
  const { user } = useAuth();
  const [decision, setDecision] = useState('');
  const [perspective, setPerspective] = useState<ScenarioPerspective>('current-me');
  const [timeframe, setTimeframe] = useState(12);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'narrative' | 'pros' | 'cons'>('narrative');

  const simulate = useCallback(async () => {
    if (!user || !decision.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          input: {
            decision: decision.trim(),
            timeframeMonths: timeframe,
            perspective,
            includeRegions: ['writing', 'academic', 'professional', 'creative'],
          },
        }),
      });

      if (!res.ok) throw new Error('Scenario generation failed');
      setResult(await res.json());
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, decision, perspective, timeframe]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-sm font-semibold text-white/70 mb-1">
          Simulate My Future
        </h3>
        <p className="text-xs text-white/35">
          Explore a decision through the lens of your own mind. Grounded in your knowledge.
        </p>
      </div>

      {!result ? (
        <div className="space-y-4">
          {/* Decision input */}
          <textarea
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            placeholder="What decision are you exploring? e.g. 'Should I take the new job offer?' or 'What if I start my own project?'"
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/20 resize-none focus:outline-none focus:border-indigo-400/50 transition-colors min-h-[44px]"
            aria-label="Decision to simulate"
          />

          {/* Perspective switcher */}
          <div className="space-y-1.5">
            <p className="text-xs text-white/40 uppercase tracking-wide">Perspective</p>
            <div className="flex gap-2">
              {PERSPECTIVES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPerspective(p.id)}
                  aria-pressed={perspective === p.id}
                  className={`
                    flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border text-center
                    transition-all duration-150 min-h-[44px]
                    ${perspective === p.id
                      ? 'border-indigo-500/40 bg-indigo-500/10'
                      : 'border-white/8 bg-white/3 hover:border-white/15'
                    }
                  `}
                >
                  <span className="text-sm" aria-hidden="true">{p.icon}</span>
                  <span className={`text-[11px] font-medium ${perspective === p.id ? 'text-indigo-300' : 'text-white/50'}`}>
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe */}
          <div className="space-y-1.5">
            <p className="text-xs text-white/40 uppercase tracking-wide">Timeframe</p>
            <div className="flex gap-2">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t.months}
                  onClick={() => setTimeframe(t.months)}
                  aria-pressed={timeframe === t.months}
                  className={`
                    flex-1 py-2 rounded-lg border text-xs font-medium transition-all min-h-[44px]
                    ${timeframe === t.months
                      ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300'
                      : 'border-white/8 bg-white/3 text-white/40 hover:border-white/15'
                    }
                  `}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p role="alert" className="text-xs text-red-400">{error}</p>}

          <button
            onClick={simulate}
            disabled={loading || !decision.trim()}
            className="w-full py-3 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-sm font-medium hover:bg-indigo-500/30 transition-all disabled:opacity-40 min-h-[44px]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border border-indigo-400/40 border-t-indigo-400 rounded-full animate-spin" aria-hidden="true" />
                Simulating your future…
              </span>
            ) : (
              '✦ Simulate'
            )}
          </button>

          <p className="text-[10px] text-white/20 text-center">
            Grounded in your knowledge base · Not a prediction · Always your choice
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-white/3 p-1 rounded-xl">
            {([
              { id: 'narrative', label: 'Story' },
              { id: 'pros',      label: 'Upsides' },
              { id: 'cons',      label: 'Challenges' },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
                className={`
                  flex-1 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[44px]
                  ${activeTab === tab.id ? 'bg-white/8 text-white/90' : 'text-white/35 hover:text-white/60'}
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4 min-h-[120px]">
            <p className="text-sm text-white/70 leading-relaxed">
              {activeTab === 'narrative' && result.narrative}
              {activeTab === 'pros' && result.prosNarrative}
              {activeTab === 'cons' && result.consNarrative}
            </p>
          </div>

          {/* Grounding question */}
          <div
            className="px-4 py-3 rounded-xl border"
            style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.15)' }}
          >
            <p className="text-[11px] text-indigo-400/60 uppercase tracking-wide mb-1">Mindi asks</p>
            <p className="text-sm text-white/70 italic">{result.groundingQuestion}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setResult(null); setDecision(''); }}
              className="flex-1 py-2 bg-white/5 border border-white/8 text-white/40 rounded-xl text-xs font-medium hover:bg-white/8 transition-all min-h-[44px]"
            >
              Try another
            </button>
            <button
              onClick={() => setPerspective(perspective === 'current-me' ? 'ideal-me' : perspective === 'ideal-me' ? 'past-me' : 'current-me')}
              className="flex-1 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl text-xs font-medium hover:bg-indigo-500/15 transition-all min-h-[44px]"
            >
              Switch perspective
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
