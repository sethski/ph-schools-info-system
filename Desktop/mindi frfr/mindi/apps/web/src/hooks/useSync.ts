// =============================================================================
// MINDI — useSync Hook
// Manages cross-device sync state: online/offline, queue, conflicts.
// Registers device heartbeat. Flushes queue on reconnect.
// =============================================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase/client';
import {
  initOfflineIDB,
  flushOfflineQueue,
  cacheNodes,
  enqueueOperation,
} from '../lib/offline/syncManager';
import { SYNC_CONFIG } from '../../../../shared/constants/phase3';
import type { SyncStatus, ConflictRecord } from '../../../../shared/types/phase3';
import type { BrainNode } from '../../../../shared/types';

export interface SyncState {
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingOps: number;
  conflicts: ConflictRecord[];
  lastSyncAt: Date | null;
  deviceId: string;
}

// Stable device ID — persisted in localStorage
function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('mindi_device_id');
  if (!id) {
    id = `${navigator.platform.toLowerCase().replace(/\s/g, '_')}_${Date.now()}`;
    localStorage.setItem('mindi_device_id', id);
  }
  return id;
}

export function useSync(uid: string | null, nodes: BrainNode[]) {
  const deviceId = getOrCreateDeviceId();

  const [state, setState] = useState<SyncState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    syncStatus: 'synced',
    pendingOps: 0,
    conflicts: [],
    lastSyncAt: null,
    deviceId,
  });

  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const idbReadyRef = useRef(false);

  // Initialize IDB
  useEffect(() => {
    initOfflineIDB().then(() => { idbReadyRef.current = true; });
  }, []);

  // Online/offline detection
  useEffect(() => {
    const setOnline = () => {
      setState((s) => ({ ...s, isOnline: true, syncStatus: 'syncing' }));
      // Flush queue on reconnect
      if (uid && idbReadyRef.current) {
        flushOfflineQueue(db, uid, (conflict) => {
          setState((s) => ({ ...s, conflicts: [...s.conflicts, conflict] }));
        }).then(({ flushed, conflicts }) => {
          setState((s) => ({
            ...s,
            syncStatus: conflicts > 0 ? 'conflict' : 'synced',
            pendingOps: 0,
            lastSyncAt: new Date(),
          }));
        });
      }
    };

    const setOffline = () => {
      setState((s) => ({ ...s, isOnline: false, syncStatus: 'offline' }));
    };

    window.addEventListener('online', setOnline);
    window.addEventListener('offline', setOffline);
    return () => {
      window.removeEventListener('online', setOnline);
      window.removeEventListener('offline', setOffline);
    };
  }, [uid]);

  // Cache nodes for offline reading whenever nodes update
  useEffect(() => {
    if (nodes.length > 0 && idbReadyRef.current) {
      cacheNodes(nodes);
    }
  }, [nodes]);

  // Device heartbeat — register this device in Firestore
  useEffect(() => {
    if (!uid) return;

    const registerDevice = async () => {
      const platform =
        typeof window !== 'undefined' && 'mindiDesktop' in window
          ? 'desktop'
          : typeof window !== 'undefined' && 'Capacitor' in window
          ? 'mobile'
          : 'web';

      await setDoc(
        doc(db, 'users', uid, 'devices', deviceId),
        {
          deviceId,
          userId: uid,
          platform,
          os: navigator.platform,
          lastSeenAt: serverTimestamp(),
          lastSyncAt: serverTimestamp(),
          syncStatus: 'synced',
          appVersion: '0.3.0',
        },
        { merge: true }
      );
    };

    registerDevice();
    heartbeatRef.current = setInterval(
      registerDevice,
      SYNC_CONFIG.DEVICE_HEARTBEAT_INTERVAL_MS
    );

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [uid, deviceId]);

  // Enqueue an offline write operation
  const queueOperation = useCallback(
    async (op: Omit<Parameters<typeof enqueueOperation>[0], 'id' | 'deviceId' | 'userId'>) => {
      if (!uid) return;

      const fullOp = {
        ...op,
        id: crypto.randomUUID(),
        deviceId,
        userId: uid,
        localTimestamp: new Date(),
        status: 'pending' as const,
      };

      await enqueueOperation(fullOp);
      setState((s) => ({ ...s, pendingOps: s.pendingOps + 1, syncStatus: 'pending' }));
    },
    [uid, deviceId]
  );

  // Resolve a conflict
  const resolveConflict = useCallback(
    (conflictId: string, resolution: ConflictRecord['resolution']) => {
      setState((s) => ({
        ...s,
        conflicts: s.conflicts.map((c) =>
          c.id === conflictId ? { ...c, resolution, resolvedAt: new Date() } : c
        ),
        syncStatus: s.conflicts.filter((c) => c.id !== conflictId && !c.resolution).length > 0
          ? 'conflict'
          : 'synced',
      }));
    },
    []
  );

  return {
    ...state,
    queueOperation,
    resolveConflict,
  };
}
