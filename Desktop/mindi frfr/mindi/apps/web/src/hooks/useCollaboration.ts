// =============================================================================
// MINDI — useCollaboration Hook
// Manages collab session lifecycle: create, accept, sandbox sync, end.
// Real-time sandbox node sync via Firestore onSnapshot.
// =============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase/client';
import { useAuth } from './useAuth';
import type { CollabSession, SandboxNode } from '../../../../shared/types/phase3';

export interface CollabState {
  activeSessions: CollabSession[];
  pendingSessions: CollabSession[];
  sandboxNodes: SandboxNode[];
  loading: boolean;
  error: string | null;
}

export function useCollaboration() {
  const { user } = useAuth();
  const [state, setState] = useState<CollabState>({
    activeSessions: [],
    pendingSessions: [],
    sandboxNodes: [],
    loading: true,
    error: null,
  });

  // Listen for sessions where user is initiator or participant
  useEffect(() => {
    if (!user?.uid) { setState((s) => ({ ...s, loading: false })); return; }

    const uid = user.uid;

    // Sessions where user is initiator
    const q1 = query(
      collection(db, 'collabSessions'),
      where('initiatorUid', '==', uid),
      where('status', 'in', ['pending', 'active'])
    );

    // Sessions where user is participant
    const q2 = query(
      collection(db, 'collabSessions'),
      where('participantUid', '==', uid),
      where('status', 'in', ['pending', 'active'])
    );

    const unsub1 = onSnapshot(q1, (snap) => {
      const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CollabSession));
      setState((s) => ({
        ...s,
        activeSessions: [
          ...sessions.filter((x) => x.status === 'active'),
          ...s.activeSessions.filter((x) => x.participantUid === uid),
        ],
        pendingSessions: [
          ...sessions.filter((x) => x.status === 'pending'),
          ...s.pendingSessions.filter((x) => x.participantUid === uid),
        ],
        loading: false,
      }));
    });

    const unsub2 = onSnapshot(q2, (snap) => {
      const sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CollabSession));
      setState((s) => ({
        ...s,
        activeSessions: [
          ...s.activeSessions.filter((x) => x.initiatorUid === uid),
          ...sessions.filter((x) => x.status === 'active'),
        ],
        pendingSessions: [
          ...s.pendingSessions.filter((x) => x.initiatorUid === uid),
          ...sessions.filter((x) => x.status === 'pending'),
        ],
        loading: false,
      }));
    });

    return () => { unsub1(); unsub2(); };
  }, [user?.uid]);

  // Listen for sandbox nodes when there's an active session
  useEffect(() => {
    const activeSession = state.activeSessions[0];
    if (!activeSession?.sandboxId) return;

    const q = query(
      collection(db, 'sandboxes', activeSession.sandboxId, 'nodes'),
      where('approvalStatus', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const nodes = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SandboxNode));
      setState((s) => ({ ...s, sandboxNodes: nodes }));
    });

    return unsub;
  }, [state.activeSessions]);

  // Accept an incoming invite
  const acceptInvite = useCallback(async (sessionId: string) => {
    if (!user) return;
    const idToken = await user.getIdToken();
    const res = await fetch('/api/collaboration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ action: 'accept', sessionId }),
    });
    if (!res.ok) throw new Error('Failed to accept invite');
  }, [user]);

  // Merge a sandbox node into personal brain
  const mergeNode = useCallback(async (sandboxId: string, sandboxNodeId: string) => {
    if (!user) return;
    const idToken = await user.getIdToken();
    const res = await fetch('/api/collaboration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ action: 'merge_node', sandboxId, sandboxNodeId }),
    });
    if (!res.ok) throw new Error('Failed to merge node');
    return res.json();
  }, [user]);

  // End a session
  const endSession = useCallback(async (sessionId: string) => {
    if (!user) return;
    const idToken = await user.getIdToken();
    await fetch('/api/collaboration', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ sessionId }),
    });
  }, [user]);

  return {
    ...state,
    acceptInvite,
    mergeNode,
    endSession,
  };
}
