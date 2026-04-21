// =============================================================================
// MINDI — ExportPanel Component
// One-click brain export in JSON, Markdown formats.
// Trust Covenant: full data portability, no vendor lock-in.
// =============================================================================

'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';

type ExportFormat = 'json' | 'markdown';

interface ExportOption {
  format: ExportFormat;
  label: string;
  description: string;
  icon: string;
  useCase: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    format: 'json',
    label: 'JSON',
    description: 'Complete structured export',
    icon: '{ }',
    useCase: 'Import to another app · Developer use · Full backup',
  },
  {
    format: 'markdown',
    label: 'Markdown',
    description: 'Human-readable export',
    icon: '# M',
    useCase: 'Read in Obsidian, Notion · Share as document · Print',
  },
];

export default function ExportPanel() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<{ format: ExportFormat; at: Date } | null>(null);

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (!user) return;
      setLoading(format);
      setError(null);

      try {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ format }),
        });

        if (!res.ok) throw new Error('Export failed');

        // Stream the file download
        const blob = await res.blob();
        const contentDisposition = res.headers.get('Content-Disposition') ?? '';
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        const filename = filenameMatch?.[1] ?? `mindi-brain.${format}`;

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setLastExport({ format, at: new Date() });
      } catch {
        setError('Export failed. Please try again.');
      } finally {
        setLoading(null);
      }
    },
    [user]
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-sm font-semibold text-white/70 mb-1">
          Export Brain
        </h3>
        <p className="text-xs text-white/35">
          Your data, your terms. Download everything and take it anywhere.
        </p>
      </div>

      <div className="space-y-2">
        {EXPORT_OPTIONS.map((opt) => (
          <div
            key={opt.format}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/3"
          >
            {/* Format icon */}
            <div
              className="w-10 h-10 flex-shrink-0 rounded-lg bg-white/5 flex items-center justify-center text-xs font-mono font-bold text-white/40"
              aria-hidden="true"
            >
              {opt.icon}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/80">{opt.label}</p>
              <p className="text-[11px] text-white/35">{opt.useCase}</p>
            </div>

            <button
              onClick={() => handleExport(opt.format)}
              disabled={!!loading}
              aria-label={`Export brain as ${opt.label}`}
              className="flex-shrink-0 px-3 py-1.5 bg-white/5 border border-white/10 text-white/50 text-xs rounded-lg hover:bg-white/10 hover:text-white/70 transition-all disabled:opacity-40 min-h-[44px] min-w-[70px]"
            >
              {loading === opt.format ? (
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 border border-white/30 border-t-white/60 rounded-full animate-spin" aria-hidden="true" />
                  <span>…</span>
                </span>
              ) : (
                '↓ Download'
              )}
            </button>
          </div>
        ))}
      </div>

      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}

      {lastExport && (
        <p className="text-[10px] text-emerald-400/60">
          ✓ {lastExport.format.toUpperCase()} exported at{' '}
          {lastExport.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}

      <p className="text-[10px] text-white/20 leading-relaxed">
        Exports include all your nodes, style fingerprint, and metadata.
        Encrypted nodes are exported as-is — decrypt locally with your key.
        Mindi never retains a copy of your exports.
      </p>
    </div>
  );
}
