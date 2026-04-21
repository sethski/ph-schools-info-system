// =============================================================================
// MINDI — useProactivity Hook (Phase 2 — wired to Python ML backend)
// scanNewNodes() calls ML_BACKEND/proactivity/scan after ingest completes.
// Python writes alerts to Firestore; onSnapshot picks them up automatically.
// =============================================================================
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../app/lib/firebase';
import type { BrainNode } from '../../../../shared/types/node';
import type { ProactivityAlert, EmotionalSignals } from '../../../../shared/types/phase2';
import { detectEmotionalState, getUiAdaptation } from '../lib/proactivity/engine';

const ML_BACKEND_URL = process.env.NEXT_PUBLIC_ML_BACKEND_URL ?? 'http://localhost:8000';

export function useProactivity(uid: string | null, nodes: BrainNode[]) {
  const [alerts, setAlerts] = useState<ProactivityAlert[]>([]);
  const [emotionalState, setEmotionalState] = useState<EmotionalSignals | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionStart = useRef(Date.now());
  const typingEvents = useRef<number[]>([]);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    const q = query(
      collection(db, 'users', uid, 'alerts'),
      where('isDismissed', '==', false),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    return onSnapshot(q, snap => {
      setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProactivityAlert)));
      setLoading(false);
    });
  }, [uid]);

  // Call Python backend after ingest — it uses BGE-M3 + NLI for real contradiction detection
  const scanNewNodes = useCallback(async (newNodeIds: string[]) => {
    if (!uid || !newNodeIds.length) return;
    try {
      await fetch('/api/proactivity-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, nodeIds: newNodeIds }),
      });
    } catch (e) { console.warn('[proactivity] scan failed (non-blocking)'); }
  }, [uid]);

  const recordTypingEvent = useCallback(() => {
    typingEvents.current = [...typingEvents.current.filter(t => Date.now() - t < 60_000), Date.now()].slice(-100);
    setEmotionalState(detectEmotionalState({
      hourOfDay: new Date().getHours(),
      sessionDurationMinutes: Math.floor((Date.now() - sessionStart.current) / 60_000),
      revisionRate: typingEvents.current.length,
    }));
  }, []);

  const dismissAlert = useCallback(async (alertId: string) => {
    if (uid) await updateDoc(doc(db, 'users', uid, 'alerts', alertId), { isDismissed: true });
  }, [uid]);

  return {
    alerts, emotionalState, loading,
    uiAdaptation: emotionalState ? getUiAdaptation(emotionalState.detectedState) : null,
    recordTypingEvent, dismissAlert, scanNewNodes,
  };
}
