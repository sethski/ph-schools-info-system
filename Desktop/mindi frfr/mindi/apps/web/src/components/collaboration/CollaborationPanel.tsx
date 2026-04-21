// =============================================================================
// MINDI — CollaborationPanel Component
// Brain-to-brain sync: invite, sandbox view, approve/merge nodes.
// Trust Covenant: no content shared without explicit invite + MFA + approval.
// =============================================================================

'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { REGIONS } from '../../../../../shared/constants';
import type { NodeRegion } from '../../../../../shared/types';

type CollabView = 'invite' | 'pending' | 'active';

const ALL_REGIONS = Object.keys(REGIONS) as NodeRegion[];

export default function CollaborationPanel() {
  const { user } = useAuth();
  const [view, setView] = useState<CollabView>('invite');
  const [email, setEmail] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<NodeRegion[]>(['writing']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const toggleRegion = useCallback((r: NodeRegion) => {
    setSelectedRegions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  }, []);

  const sendInvite = useCallback(async () => {
    if (!user || !email.trim() || selectedRegions.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/collaboration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          action: 'create',
          participantEmail: email.trim(),
          sharedRegions: selectedRegions,
        }),
      });

      if (res.status === 403) {
        const data = await res.json();
        if (data.requiresMfa) {
          setError('MFA required to start a collaboration. Go to Settings → Security.');
          return;
        }
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to send invite');
        return;
      }

      const data = await res.json();
      setSessionId(data.sessionId);
      setView('pending');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, email, selectedRegions]);

  const endSession = useCallback(async () => {
    if (!user || !sessionId) return;
    const idToken = await user.getIdToken();
    await fetch('/api/collaboration', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ sessionId }),
    });
    setView('invite');
    setSessionId(null);
    setEmail('');
  }, [user, sessionId]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-sm font-semibold text-white/70 mb-1">
          Brain-to-Brain
        </h3>
        <p className="text-xs text-white/35">
          Connect with a collaborator. Share selected regions in a sandboxed space.
        </p>
      </div>

      {view === 'invite' && (
        <div className="space-y-4">
          {/* Email input */}
          <div className="space-y-1.5">
            <label htmlFor="collab-email" className="text-xs text-white/40 uppercase tracking-wide">
              Collaborator's email
            </label>
            <input
              id="collab-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-indigo-400/50 transition-colors min-h-[44px]"
            />
          </div>

          {/* Region selector */}
          <div className="space-y-2">
            <p className="text-xs text-white/40 uppercase tracking-wide">Share these regions</p>
            <div className="flex flex-wrap gap-2">
              {ALL_REGIONS.filter((r) => r !== 'personal').map((region) => {
                const config = REGIONS[region];
                const isSelected = selectedRegions.includes(region);
                return (
                  <button
                    key={region}
                    onClick={() => toggleRegion(region)}
                    aria-pressed={isSelected}
                    className="px-3 py-1.5 rounded-full border text-xs font-medium transition-all min-h-[44px]"
                    style={{
                      background: isSelected ? `${config.color}20` : 'rgba(255,255,255,0.03)',
                      borderColor: isSelected ? `${config.color}50` : 'rgba(255,255,255,0.08)',
                      color: isSelected ? config.color : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-white/20">
              Personal region is never shared — even in collaboration.
            </p>
          </div>

          {error && <p role="alert" className="text-xs text-red-400">{error}</p>}

          <button
            onClick={sendInvite}
            disabled={loading || !email.trim() || selectedRegions.length === 0}
            className="w-full py-3 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-sm font-medium hover:bg-indigo-500/30 transition-all disabled:opacity-40 min-h-[44px]"
          >
            {loading ? 'Sending invite…' : '✦ Send Brain Invite'}
          </button>

          <p className="text-[10px] text-white/20 text-center">
            MFA required · Sandbox isolated · Merge requires your approval
          </p>
        </div>
      )}

      {view === 'pending' && (
        <div className="space-y-3">
          <div
            className="flex items-start gap-3 px-4 py-3.5 rounded-xl border"
            style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.15)' }}
          >
            <div
              className="w-2 h-2 rounded-full mt-1.5 animate-pulse flex-shrink-0"
              style={{ background: '#6366f1' }}
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium text-white/80">Waiting for {email}</p>
              <p className="text-xs text-white/40 mt-0.5">
                They'll receive an invitation. Once accepted, your sandbox opens.
              </p>
            </div>
          </div>

          <button
            onClick={endSession}
            className="w-full py-2.5 bg-white/5 border border-white/10 text-white/40 rounded-xl text-sm hover:bg-white/8 hover:text-white/60 transition-all min-h-[44px]"
          >
            Cancel invite
          </button>
        </div>
      )}
    </div>
  );
}
