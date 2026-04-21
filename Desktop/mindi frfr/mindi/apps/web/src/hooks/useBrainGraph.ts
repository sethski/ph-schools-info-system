// =============================================================================
// MINDI — useBrainGraph Hook (all phases)
// Triggers Python proactivity scan when new nodes arrive via onSnapshot.
// =============================================================================
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection, query, where, onSnapshot, updateDoc, doc,
  serverTimestamp, orderBy,
} from 'firebase/firestore';
import { db } from '../app/lib/firebase';
import type { BrainNode } from '../../../../shared/types/node';

const IDB_NAME = 'mindi_brain', IDB_VEC = 'vectors', IDB_HASHES = 'hashes';

export function useBrainGraph(uid: string | null, onNewNodes?: (ids: string[]) => void) {
  const [nodes, setNodes]   = useState<BrainNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const idbRef = useRef<IDBDatabase | null>(null);

  useEffect(() => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = e => {
      const idb = (e.target as IDBOpenDBRequest).result;
      if (!idb.objectStoreNames.contains(IDB_VEC))    idb.createObjectStore(IDB_VEC, { keyPath: 'chunkHash' });
      if (!idb.objectStoreNames.contains(IDB_HASHES)) idb.createObjectStore(IDB_HASHES, { keyPath: 'hash' });
    };
    req.onsuccess = e => { idbRef.current = (e.target as IDBOpenDBRequest).result; };
  }, []);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    const q = query(
      collection(db, 'users', uid, 'nodes'),
      where('isArchived', '==', false),
      orderBy('updatedAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      // Collect IDs of brand-new nodes for proactivity scan
      const newIds = snap.docChanges()
        .filter(c => c.type === 'added')
        .map(c => c.doc.id);

      setNodes(snap.docs.map(d => ({ id: d.id, ...d.data() } as BrainNode)));
      setLoading(false);

      if (newIds.length > 0 && onNewNodes) onNewNodes(newIds);
    }, err => { setError(err.message); setLoading(false); });
    return unsub;
  }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const connectNodes = useCallback(async (sourceId: string, targetId: string) => {
    if (!uid) return;
    const src = nodes.find(n => n.id === sourceId);
    if (!src) return;
    await updateDoc(doc(db, 'users', uid, 'nodes', sourceId), {
      relatedNodeIds: [...new Set([...src.relatedNodeIds, targetId])],
      updatedAt: serverTimestamp(),
    });
  }, [uid, nodes]);

  const archiveNode = useCallback(async (nodeId: string) => {
    if (!uid) return;
    await updateDoc(doc(db, 'users', uid, 'nodes', nodeId), { isArchived: true, updatedAt: serverTimestamp() });
  }, [uid]);

  const storeEmbedding = useCallback(async (chunkHash: string, embedding: number[], nodeId: string) => {
    if (!idbRef.current) return;
    const tx = idbRef.current.transaction([IDB_VEC, IDB_HASHES], 'readwrite');
    tx.objectStore(IDB_VEC).put({ chunkHash, embedding, nodeId, storedAt: Date.now() });
    tx.objectStore(IDB_HASHES).put({ hash: chunkHash });
  }, []);

  const getExistingHashes = useCallback(async (): Promise<Set<string>> => {
    if (!idbRef.current) return new Set();
    return new Promise(resolve => {
      const tx = idbRef.current!.transaction(IDB_HASHES, 'readonly');
      const req = tx.objectStore(IDB_HASHES).getAllKeys();
      req.onsuccess = () => resolve(new Set(req.result as string[]));
      req.onerror  = () => resolve(new Set());
    });
  }, []);

  return { nodes, loading, error, connectNodes, archiveNode, storeEmbedding, getExistingHashes };
}
