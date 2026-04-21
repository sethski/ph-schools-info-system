// =============================================================================
// MINDI Phase 1 — useStyleFingerprint Hook
// Loads + subscribes to user's style fingerprint from Firestore.
// =============================================================================
'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { StyleFingerprint } from '../../../../shared/types/style';

export function useStyleFingerprint(uid: string | null) {
  const [fingerprint, setFingerprint] = useState<StyleFingerprint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }

    const unsub = onSnapshot(doc(db, 'users', uid), snap => {
      if (snap.exists()) {
        const data = snap.data();
        setFingerprint({
          userId: uid,
          overall: data.style_fingerprint?.overall ?? { toneKeywords: [], avgSentenceLength: 0, vocabLevel: 'intermediate', preferredStructure: 'mixed', formalityScore: 0.5, writingRhythm: '' },
          byRegion: data.style_fingerprint ?? {},
          lastUpdated: data.style_updated_at ? new Date(data.style_updated_at) : new Date(),
          nodeCount: Object.values(data.style_fingerprint ?? {}).reduce((acc: number, v: any) => acc + (v?.node_count ?? 0), 0),
        });
      }
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  return { fingerprint, loading };
}
