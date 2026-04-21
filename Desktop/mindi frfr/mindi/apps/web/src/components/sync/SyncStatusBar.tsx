// =============================================================================
// MINDI — SyncStatusBar Component
// Shows real-time sync state: online/offline, pending ops, active devices, conflicts.
// Minimal — only visible when something needs attention.
// =============================================================================

'use client';

import type { SyncState } from '../../hooks/useSync';
import type { ConflictRecord } from '../../../../../shared/types/phase3';

interface SyncStatusBarProps {
  syncState: SyncState;
  onResolveConflict: (conflictId: string, resolution: ConflictRecord['resolution']) => void;
}

export default function SyncStatusBar({ syncState, onResolveConflict }: SyncStatusBarProps) {
  const { isOnline, syncStatus, pendingOps, conflicts, lastSyncAt } = syncState;

  // Only render when something needs attention
  if (syncStatus === 'synced' && conflicts.length === 0) return null;

  const statusConfig = {
    synced:   { color: '#10b981', label: 'Synced',   icon: '✓' },
    syncing:  { color: '#6366f1', label: 'Syncing…', icon: '↻' },
    pending:  { color: '#f59e0b', label: `${pendingOps} pending`, icon: '⏳' },
    conflict: { color: '#ef4444', label: 'Conflicts', icon: '⚠' },
    offline:  { color: '#6b7280', label: 'Offline',  icon: '⊘' },
  };

  const config = statusConfig[syncStatus];

  return (
    <div role="status" aria-live="polite" className="space-y-2">
      {/* Status pill */}
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ background: `${config.color}18`, color: config.color }}
      >
        <span
          className={syncStatus === 'syncing' ? 'animate-spin inline-block' : ''}
          aria-hidden="true"
          style={{ fontSize: '10px' }}
        >
          {config.icon}
        </span>
        {config.label}
        {!isOnline && (
          <span className="ml-1 text-[10px] opacity-60">— changes saved locally</span>
        )}
      </div>

      {/* Conflict resolution cards */}
      {conflicts.filter((c) => !c.resolution || c.resolution === 'pending').map((conflict) => (
        <ConflictCard
          key={conflict.id}
          conflict={conflict}
          onResolve={onResolveConflict}
        />
      ))}

      {/* Last sync time */}
      {lastSyncAt && syncStatus === 'synced' && (
        <p className="text-[10px] text-white/20">
          Last synced {lastSyncAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  );
}

function ConflictCard({
  conflict,
  onResolve,
}: {
  conflict: ConflictRecord;
  onResolve: (id: string, resolution: ConflictRecord['resolution']) => void;
}) {
  return (
    <div
      className="px-3 py-3 rounded-xl border space-y-2"
      style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.15)' }}
      role="alert"
    >
      <p className="text-xs font-medium text-red-400">Sync conflict on node</p>
      <p className="text-[11px] text-white/40">
        This node was edited on two devices simultaneously.
        Choose which version to keep.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onResolve(conflict.id, 'local_wins')}
          className="flex-1 py-1.5 text-xs bg-white/5 border border-white/10 text-white/60 rounded-lg hover:bg-white/8 transition-all min-h-[44px]"
        >
          Keep this device's version
        </button>
        <button
          onClick={() => onResolve(conflict.id, 'remote_wins')}
          className="flex-1 py-1.5 text-xs bg-white/5 border border-white/10 text-white/60 rounded-lg hover:bg-white/8 transition-all min-h-[44px]"
        >
          Keep other device's version
        </button>
      </div>
    </div>
  );
}
