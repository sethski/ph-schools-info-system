// =============================================================================
// MINDI Phase 1 — useIngest Hook
// Upload → client PII scan → /api/ingest → Python ML pipeline → Firestore
// Real-time job progress via Firestore onSnapshot.
// =============================================================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../auth/useAuth';
import { clientPiiScan } from '../lib/trust';
import type { IngestJob } from '../../../../../shared/types/node';

export function useIngest(uid: string | null) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<IngestJob[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for job updates
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, 'users', uid, 'ingestJobs'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const unsub = onSnapshot(q, snap => {
      setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() } as IngestJob)));
    });
    return unsub;
  }, [uid]);

  const ingestFile = useCallback(async (file: File) => {
    if (!user) return;
    setUploading(true);
    setError(null);

    try {
      // Read file
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file, 'utf-8');
      });

      // Client-side PII pre-scan on raw text
      const { redactedText, fieldsRemoved } = clientPiiScan(text);

      const idToken = await user.getIdToken();
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          text: redactedText,
          fileName: file.name,
          fileType: file.type || 'text/plain',
          fileSize: file.size,
          piiFieldsRemovedByClient: fieldsRemoved,
        }),
      });

      if (!res.ok) throw new Error(`Ingest failed: ${res.statusText}`);

      return await res.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      throw err;
    } finally {
      setUploading(false);
    }
  }, [user]);

  const activeJobs  = jobs.filter(j => ['queued', 'chunking', 'embedding', 'fingerprinting'].includes(j.status));
  const recentDone  = jobs.filter(j => j.status === 'complete').slice(0, 3);

  return { jobs, activeJobs, recentDone, uploading, error, ingestFile };
}
