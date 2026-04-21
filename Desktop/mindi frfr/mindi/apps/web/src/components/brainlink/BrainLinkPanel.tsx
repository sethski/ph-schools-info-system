// =============================================================================
// MINDI — BrainLinkPanel Component
// Create, copy, and revoke Brain Link snippets.
// MFA gate surfaced inline if not verified.
// Trust Covenant: regions always shown, expiry always displayed.
// =============================================================================

'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { REGIONS } from '../../../../../shared/constants';
import type { NodeRegion } from '../../../../../shared/types';

const ALL_REGIONS = Object.keys(REGIONS) as NodeRegion[];

interface LinkResult {
  shareId: string;
  snippet: string;
  characterCount: number;
  tokenEstimate: number;
  expiresAt: string | null;
  nodeCount: number;
}

export default function BrainLinkPanel() {
  const { user } = useAuth();
  const [selectedRegions, setSelectedRegions] = useState<NodeRegion[]>(['writing', 'academic']);
  const [expiryHours, setExpiryHours] = useState<number>(24);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LinkResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  const toggleRegion = useCallback((region: NodeRegion) => {
    setSelectedRegions((prev) =>
      prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
    );
  }, []);

  const createLink = useCallback(async () => {
    if (!user || selectedRegions.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/brainlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          regions: selectedRegions,
          includeStyleFingerprint: true,
          includeRecentNodes: true,
          maxNodes: 8,
          expiresInHours: expiryHours,
        }),
      });

      if (res.status === 403) {
        setError('MFA verification required. Go to Settings → Security to enable.');
        return;
      }
      if (!res.ok) throw new Error('Failed to create Brain Link');

      setResult(await res.json());
    } catch {
      setError('Could not create Brain Link. Try again.');
    } finally {
      setLoading(false);
    }
  }, [user, selectedRegions, expiryHours]);

  const copySnippet = useCallback(async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const revokeLink = useCallback(async () => {
    if (!result || !user) return;
    setRevoking(true);
    try {
      const idToken = await user.getIdToken();
      await fetch('/api/brainlink', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ shareId: result.shareId }),
      });
      setResult(null);
    } catch {
      setError('Could not revoke. Try again.');
    } finally {
      setRevoking(false);
    }
  }, [result, user]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-sm font-semibold text-white/70 mb-1">Brain Link</h3>
        <p className="text-xs text-white/35">
          Generate a read-only context snippet to paste into any AI. It makes them respond in your voice.
        </p>
      </div>

      {!result ? (
        <>
          {/* Region selector */}
          <div className="space-y-2">
            <p className="text-xs text-white/40 uppercase tracking-wide">Include regions</p>
            <div className="flex flex-wrap gap-2">
              {ALL_REGIONS.map((region) => {
                const config = REGIONS[region];
                const isSelected = selectedRegions.includes(region);
                return (
                  <button
                    key={region}
                    onClick={() => toggleRegion(region)}
                    aria-pressed={isSelected}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all min-h-[44px]"
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
          </div>

          {/* Expiry */}
          <div className="space-y-2">
            <p className="text-xs text-white/40 uppercase tracking-wide">Expires after</p>
            <div className="flex gap-2">
              {[1, 6, 24, 72].map((h) => (
                <button
                  key={h}
                  onClick={() => setExpiryHours(h)}
                  aria-pressed={expiryHours === h}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all min-h-[44px] ${
                    expiryHours === h
                      ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300'
                      : 'border-white/8 bg-white/3 text-white/40 hover:border-white/20'
                  }`}
                >
                  {h < 24 ? `${h}h` : `${h / 24}d`}
                </button>
              ))}
            </div>
          </div>

          {error && <p role="alert" className="text-xs text-red-400">{error}</p>}

          <button
            onClick={createLink}
            disabled={loading || selectedRegions.length === 0}
            className="w-full py-3 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-sm font-medium hover:bg-indigo-500/30 transition-all disabled:opacity-40 min-h-[44px]"
          >
            {loading ? 'Generating…' : '✦ Generate Brain Link'}
          </button>

          <p className="text-[10px] text-white/20 text-center">
            MFA required · Read-only · Revocable anytime
          </p>
        </>
      ) : (
        <div className="space-y-3">
          {/* Snippet preview */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">
                {result.nodeCount} nodes · ~{result.tokenEstimate} tokens
              </span>
              {result.expiresAt && (
                <span className="text-xs text-amber-400/60">
                  Expires {new Date(result.expiresAt).toLocaleDateString()}
                </span>
              )}
            </div>

            <pre className="text-xs text-white/50 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed font-mono">
              {result.snippet.slice(0, 400)}…
            </pre>
          </div>

          <div className="flex gap-2">
            <button
              onClick={copySnippet}
              className="flex-1 py-2.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-sm font-medium hover:bg-indigo-500/30 transition-all min-h-[44px]"
            >
              {copied ? '✓ Copied!' : 'Copy to clipboard'}
            </button>
            <button
              onClick={revokeLink}
              disabled={revoking}
              className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/15 transition-all disabled:opacity-40 min-h-[44px]"
              aria-label="Revoke Brain Link"
            >
              {revoking ? '…' : 'Revoke'}
            </button>
          </div>

          <p className="text-xs text-white/30 text-center">
            Paste this into ChatGPT, Claude, or any AI to make it respond in your voice.
          </p>
        </div>
      )}
    </div>
  );
}
