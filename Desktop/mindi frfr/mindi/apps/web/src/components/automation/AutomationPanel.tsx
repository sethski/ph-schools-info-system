// =============================================================================
// MINDI — AutomationPanel Component
// "Second Me" task launcher: outline, quiz, email draft, summary, skill gap.
// Shows risk badge + approval gate before executing MEDIUM/HIGH tasks.
// Trust Covenant: preview always shown before content is "used".
// =============================================================================

'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AUTOMATION_RISK_MAP, RISK_GATE } from '../../../../../shared/constants/phase2';
import type { AutomationTaskType } from '../../../../../shared/types/phase2';

interface TaskResult {
  taskId: string;
  output: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  isPreview: boolean;
  approved: boolean;
}

const TASK_CONFIGS: Array<{
  type: AutomationTaskType;
  label: string;
  icon: string;
  placeholder: string;
  inputKey: string;
}> = [
  { type: 'homework_outline', label: 'Homework Outline', icon: '📋', placeholder: 'Topic or assignment title', inputKey: 'topic' },
  { type: 'quiz_generate',    label: 'Quiz Me',          icon: '🧩', placeholder: 'Topic to be quizzed on',   inputKey: 'topic' },
  { type: 'email_draft',      label: 'Email Draft',      icon: '✉️',  placeholder: 'Email subject or context', inputKey: 'subject' },
  { type: 'summarize',        label: 'Summarize',        icon: '⚡',  placeholder: 'Paste content to summarize', inputKey: 'content' },
  { type: 'skill_gap_analysis', label: 'Skill Gap',      icon: '🎯', placeholder: 'Job description or project goal', inputKey: 'target' },
];

export default function AutomationPanel() {
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState<typeof TASK_CONFIGS[0] | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TaskResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = useCallback(async () => {
    if (!selectedTask || !inputValue.trim() || !user) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          type: selectedTask.type,
          input: { [selectedTask.inputKey]: inputValue.trim() },
        }),
      });

      if (res.status === 403) {
        const data = await res.json();
        if (data.requiresMfa) {
          setError('This action requires MFA verification. Please verify in Settings → Security.');
          return;
        }
      }

      if (!res.ok) throw new Error('Task failed');

      const data = await res.json();
      setResult({ ...data, approved: data.riskLevel === 'LOW' });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedTask, inputValue, user]);

  const handleApprove = useCallback(async () => {
    if (!result || !user) return;
    const idToken = await user.getIdToken();
    await fetch('/api/automation', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ taskId: result.taskId }),
    });
    setResult((r) => r ? { ...r, approved: true } : r);
  }, [result, user]);

  const riskLevel = selectedTask ? AUTOMATION_RISK_MAP[selectedTask.type] : null;
  const gate = riskLevel ? RISK_GATE[riskLevel] : null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-sm font-semibold text-white/70 mb-3">Second Me</h3>

        {/* Task selector */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TASK_CONFIGS.map((task) => {
            const risk = AUTOMATION_RISK_MAP[task.type];
            const isSelected = selectedTask?.type === task.type;
            return (
              <button
                key={task.type}
                onClick={() => { setSelectedTask(task); setInputValue(''); setResult(null); setError(null); }}
                aria-pressed={isSelected}
                className={`
                  flex flex-col items-start gap-1 px-3 py-2.5 rounded-xl border text-left
                  transition-all duration-150 min-h-[44px]
                  ${isSelected
                    ? 'border-indigo-500/40 bg-indigo-500/10'
                    : 'border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/5'
                  }
                `}
              >
                <span className="text-base" aria-hidden="true">{task.icon}</span>
                <span className="text-xs font-medium text-white/75">{task.label}</span>
                {/* Risk badge */}
                <span
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: `${RISK_GATE[risk].color}20`,
                    color: RISK_GATE[risk].color,
                  }}
                >
                  {RISK_GATE[risk].label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input */}
      {selectedTask && (
        <div className="space-y-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={selectedTask.placeholder}
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/25 resize-none focus:outline-none focus:border-indigo-400/50 transition-colors min-h-[44px]"
            aria-label={selectedTask.placeholder}
          />

          {/* Risk gate explanation */}
          {gate && (
            <p className="text-xs px-1" style={{ color: `${gate.color}99` }}>
              {gate.description}
              {gate.requiresMfa && ' · MFA required'}
            </p>
          )}

          <button
            onClick={handleRun}
            disabled={loading || !inputValue.trim()}
            className="w-full py-2.5 px-4 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-sm font-medium hover:bg-indigo-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
          >
            {loading ? 'Generating…' : `Run ${selectedTask.label}`}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-400 px-1">{error}</p>
      )}

      {/* Result + Approval gate */}
      {result && (
        <div className="space-y-3">
          <div className="bg-white/3 border border-white/8 rounded-xl p-4">
            {result.isPreview && !result.approved && (
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/8">
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full"
                  style={{
                    background: `${RISK_GATE[result.riskLevel].color}20`,
                    color: RISK_GATE[result.riskLevel].color,
                  }}
                >
                  Preview — not applied yet
                </span>
              </div>
            )}

            <div className="text-sm text-white/75 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
              {result.output}
            </div>

            {/* Approval buttons for MEDIUM/HIGH */}
            {result.isPreview && !result.approved && (
              <div className="flex gap-2 mt-4 pt-3 border-t border-white/8">
                <button
                  onClick={handleApprove}
                  className="flex-1 py-2 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/25 transition-all min-h-[44px]"
                >
                  ✓ Approve & use
                </button>
                <button
                  onClick={() => setResult(null)}
                  className="flex-1 py-2 bg-white/5 border border-white/10 text-white/50 rounded-lg text-xs font-medium hover:bg-white/8 transition-all min-h-[44px]"
                >
                  ✕ Reject
                </button>
              </div>
            )}

            {result.approved && (
              <p className="text-xs text-emerald-400 mt-3 flex items-center gap-1">
                <span aria-hidden="true">✓</span> Approved
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
