// =============================================================================
// MINDI — AuditLogViewer Component
// Shows immutable record of all brain actions.
// Trust Covenant: full transparency to user about what Mindi did.
// =============================================================================

'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import type { AuditEvent } from '../../../../../shared/types';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  ingest:        { label: 'Learned from file',   color: '#10b981' },
  llm_call:      { label: 'AI responded',         color: '#6366f1' },
  share_create:  { label: 'Brain Link created',   color: '#f59e0b' },
  share_revoke:  { label: 'Brain Link revoked',   color: '#ef4444' },
  export:        { label: 'Brain exported',       color: '#8b5cf6' },
  delete_node:   { label: 'Node deleted',         color: '#ef4444' },
  login:         { label: 'Signed in',            color: '#06b6d4' },
  logout:        { label: 'Signed out',           color: '#06b6d4' },
  mfa_challenge: { label: 'MFA verified',         color: '#f59e0b' },
};

export default function AuditLogViewer({ uid }: { uid: string }) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users', uid, 'auditLog'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditEvent)));
      setLoading(false);
    });

    return unsub;
  }, [uid]);

  if (loading) {
    return <div className="text-white/30 text-sm p-4">Loading audit log…</div>;
  }

  return (
    <section aria-label="Activity audit log">
      <h2 className="font-display text-sm font-semibold text-white/70 mb-3 px-1">
        Activity Log
      </h2>

      {events.length === 0 ? (
        <p className="text-white/30 text-xs px-1">No activity yet.</p>
      ) : (
        <ul className="space-y-1" role="list">
          {events.map((event) => {
            const meta = ACTION_LABELS[event.action] ?? { label: event.action, color: '#6366f1' };
            const ts = event.timestamp instanceof Date
              ? event.timestamp
              : (event.timestamp as unknown as { toDate: () => Date })?.toDate?.() ?? new Date();

            return (
              <li
                key={event.id}
                className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-white/3 border border-white/5 text-xs"
              >
                {/* Action dot */}
                <span
                  className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: meta.color }}
                  aria-hidden="true"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-white/80">{meta.label}</span>
                    <time
                      dateTime={ts.toISOString()}
                      className="text-white/25 flex-shrink-0"
                    >
                      {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 text-white/35">
                    {event.piiRedacted && (
                      <span className="text-amber-400/70">🛡️ PII removed</span>
                    )}
                    {event.outboundModel && (
                      <span>via {event.outboundModel.split('/')[1]}</span>
                    )}
                    {event.metadata?.fileName ? (
                      <span className="truncate">{String(event.metadata.fileName)}</span>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[10px] text-white/20 mt-3 px-1">
        This log is immutable — Mindi cannot edit or delete these records.
      </p>
    </section>
  );
}
