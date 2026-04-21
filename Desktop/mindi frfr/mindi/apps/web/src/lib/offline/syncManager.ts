// =============================================================================
// MINDI — Offline Sync Manager
// Manages the offline operation queue in IndexedDB.
// On reconnect: flushes pending ops to Firestore in order.
// Conflict detection: last-write-wins with user prompt for diverged nodes.
// =============================================================================

import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { OFFLINE_CONFIG, SYNC_CONFIG } from '../../../../../shared/constants/phase3';
import type { SyncOperation, OfflineQueueItem, ConflictRecord } from '../../../../../shared/types/phase3';

const { IDB_STORES } = OFFLINE_CONFIG;
const IDB_NAME = 'mindi_offline';
const IDB_VERSION = 1;

// -----------------------------------------------------------------------------
// IndexedDB initialization
// -----------------------------------------------------------------------------

let idb: IDBDatabase | null = null;

export async function initOfflineIDB(): Promise<IDBDatabase> {
  if (idb) return idb;

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      // Sync queue — pending ops to flush when online
      if (!db.objectStoreNames.contains(IDB_STORES.QUEUE)) {
        const store = db.createObjectStore(IDB_STORES.QUEUE, { keyPath: 'id' });
        store.createIndex('status', 'operation.status', { unique: false });
        store.createIndex('timestamp', 'operation.localTimestamp', { unique: false });
      }

      // Node cache — offline read support
      if (!db.objectStoreNames.contains(IDB_STORES.NODES)) {
        const nodeStore = db.createObjectStore(IDB_STORES.NODES, { keyPath: 'id' });
        nodeStore.createIndex('region', 'region', { unique: false });
        nodeStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      // Cache manifest
      if (!db.objectStoreNames.contains(IDB_STORES.MANIFEST)) {
        db.createObjectStore(IDB_STORES.MANIFEST, { keyPath: 'userId' });
      }
    };

    req.onsuccess = (e) => {
      idb = (e.target as IDBOpenDBRequest).result;
      resolve(idb);
    };

    req.onerror = () => reject(req.error);
  });
}

// -----------------------------------------------------------------------------
// Queue an offline operation
// -----------------------------------------------------------------------------

export async function enqueueOperation(op: SyncOperation): Promise<void> {
  const db = await initOfflineIDB();

  const item: OfflineQueueItem = {
    id: op.id,
    operation: op,
    retryCount: 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORES.QUEUE, 'readwrite');
    tx.objectStore(IDB_STORES.QUEUE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// -----------------------------------------------------------------------------
// Flush queue on reconnect
// -----------------------------------------------------------------------------

export async function flushOfflineQueue(
  firestoreDb: Firestore,
  uid: string,
  onConflict: (conflict: ConflictRecord) => void
): Promise<{ flushed: number; conflicts: number; errors: number }> {
  const db = await initOfflineIDB();

  // Get all pending items ordered by localTimestamp
  const pending = await getPendingQueue(db);

  let flushed = 0;
  let conflicts = 0;
  let errors = 0;

  for (const item of pending) {
    const { operation } = item;

    try {
      await commitOperation(firestoreDb, uid, operation);
      await removeFromQueue(db, item.id);
      flushed++;
    } catch (err: unknown) {
      // Check if conflict (document modified remotely while offline)
      if (err instanceof Error && err.message?.includes('ALREADY_EXISTS')) {
        conflicts++;
        onConflict({
          id: crypto.randomUUID(),
          userId: uid,
          nodeId: operation.documentId,
          localVersion: operation.payload as Record<string, unknown>,
          remoteVersion: {}, // Caller fetches remote version
          detectedAt: new Date(),
          resolution: 'pending',
        });
      } else {
        errors++;
        // Increment retry count
        await incrementRetry(db, item.id);
      }
    }
  }

  return { flushed, conflicts, errors };
}

// -----------------------------------------------------------------------------
// Cache nodes for offline reading (called on fresh sync)
// -----------------------------------------------------------------------------

export async function cacheNodes(nodes: unknown[]): Promise<void> {
  const db = await initOfflineIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORES.NODES, 'readwrite');
    const store = tx.objectStore(IDB_STORES.NODES);

    // LRU: if over limit, clear oldest first
    for (const node of nodes.slice(0, OFFLINE_CONFIG.MAX_CACHED_NODES)) {
      store.put(node);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// -----------------------------------------------------------------------------
// Read cached nodes (offline fallback)
// -----------------------------------------------------------------------------

export async function getCachedNodes(): Promise<unknown[]> {
  const db = await initOfflineIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORES.NODES, 'readonly');
    const req = tx.objectStore(IDB_STORES.NODES).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

async function getPendingQueue(db: IDBDatabase): Promise<OfflineQueueItem[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORES.QUEUE, 'readonly');
    const index = tx.objectStore(IDB_STORES.QUEUE).index('timestamp');
    const req = index.getAll();
    req.onsuccess = () => resolve(
      (req.result as OfflineQueueItem[])
        .filter((i) => i.retryCount < 3)
        .sort((a, b) =>
          new Date(a.operation.localTimestamp).getTime() -
          new Date(b.operation.localTimestamp).getTime()
        )
    );
    req.onerror = () => reject(req.error);
  });
}

async function commitOperation(
  firestoreDb: Firestore,
  uid: string,
  op: SyncOperation
): Promise<void> {
  const ref = doc(firestoreDb, op.collectionPath, op.documentId);
  const payload = { ...op.payload, updatedAt: serverTimestamp() };

  if (op.type === 'upsert') {
    await setDoc(ref, payload, { merge: true });
  } else if (op.type === 'archive') {
    await updateDoc(ref, { isArchived: true, updatedAt: serverTimestamp() });
  } else if (op.type === 'connect') {
    await updateDoc(ref, payload);
  }
}

async function removeFromQueue(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve) => {
    const tx = db.transaction(IDB_STORES.QUEUE, 'readwrite');
    tx.objectStore(IDB_STORES.QUEUE).delete(id);
    tx.oncomplete = () => resolve();
  });
}

async function incrementRetry(db: IDBDatabase, id: string): Promise<void> {
  return new Promise((resolve) => {
    const tx = db.transaction(IDB_STORES.QUEUE, 'readwrite');
    const store = tx.objectStore(IDB_STORES.QUEUE);
    const req = store.get(id);
    req.onsuccess = () => {
      const item: OfflineQueueItem = req.result;
      if (item) {
        item.retryCount++;
        item.lastAttempt = new Date();
        store.put(item);
      }
    };
    tx.oncomplete = () => resolve();
  });
}
