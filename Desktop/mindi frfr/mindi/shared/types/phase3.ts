// =============================================================================
// MINDI — Phase 3 Types
// Cross-platform sync, collaboration, offline mode, export, browser extension.
// =============================================================================

import type { NodeRegion, BrainNode } from './index';

// -----------------------------------------------------------------------------
// CROSS-DEVICE SYNC
// -----------------------------------------------------------------------------

export type SyncStatus = 'synced' | 'pending' | 'conflict' | 'offline' | 'syncing';

export interface DeviceRecord {
  deviceId: string;
  userId: string;
  platform: 'web' | 'desktop' | 'mobile';
  os: string;
  lastSeenAt: Date;
  lastSyncAt: Date;
  syncStatus: SyncStatus;
  appVersion: string;
}

export interface SyncOperation {
  id: string;
  deviceId: string;
  userId: string;
  type: 'upsert' | 'archive' | 'connect';
  collectionPath: string;
  documentId: string;
  payload: Record<string, unknown>;
  localTimestamp: Date;
  serverTimestamp?: Date;
  status: 'pending' | 'committed' | 'conflict';
}

export interface ConflictRecord {
  id: string;
  userId: string;
  nodeId: string;
  localVersion: Partial<BrainNode>;
  remoteVersion: Partial<BrainNode>;
  detectedAt: Date;
  resolution?: 'local_wins' | 'remote_wins' | 'merged' | 'pending';
  resolvedAt?: Date;
}

// -----------------------------------------------------------------------------
// COLLABORATION — Brain-to-Brain Sync
// -----------------------------------------------------------------------------

export type CollabRole = 'owner' | 'collaborator' | 'viewer';
export type CollabStatus = 'pending' | 'active' | 'paused' | 'ended';

export interface CollabSession {
  id: string;
  initiatorUid: string;
  participantUid: string;
  sandboxId: string; // Isolated Firestore path for co-created content
  sharedRegions: NodeRegion[];
  initiatorRole: CollabRole;
  participantRole: CollabRole;
  status: CollabStatus;
  createdAt: Date;
  expiresAt: Date | null;
}

export interface SandboxNode {
  id: string;
  sandboxId: string;
  sourceNodeId: string; // Original node from either brain
  sourceUserId: string;
  content: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  mergedIntoUserId?: string; // If approved and merged into a personal brain
  createdAt: Date;
}

export interface CollabConflict {
  id: string;
  sandboxId: string;
  nodeA: SandboxNode;
  nodeB: SandboxNode;
  resolutionStrategy: 'keep_both' | 'use_a' | 'use_b' | 'merge' | 'pending';
  resolvedAt?: Date;
}

// -----------------------------------------------------------------------------
// OFFLINE MODE
// -----------------------------------------------------------------------------

export interface OfflineQueueItem {
  id: string;
  operation: SyncOperation;
  retryCount: number;
  lastAttempt?: Date;
  error?: string;
}

export interface OfflineCacheManifest {
  userId: string;
  deviceId: string;
  cachedNodeCount: number;
  cachedEmbeddingCount: number;
  lastFullSyncAt: Date;
  storageUsedBytes: number;
}

// -----------------------------------------------------------------------------
// EXPORT
// -----------------------------------------------------------------------------

export type ExportFormat = 'json' | 'markdown' | 'sqlite';

export interface ExportJob {
  id: string;
  userId: string;
  format: ExportFormat;
  includeRegions: NodeRegion[];
  includeEmbeddings: boolean;
  includeAuditLog: boolean;
  status: 'generating' | 'ready' | 'failed';
  downloadUrl?: string;
  fileSizeBytes?: number;
  createdAt: Date;
  expiresAt: Date; // Download links expire after 1 hour
}

// -----------------------------------------------------------------------------
// BROWSER EXTENSION
// -----------------------------------------------------------------------------

export interface ExtensionCapturePayload {
  url: string;
  title: string;
  selectedText?: string;
  fullPageText?: string;
  capturedAt: Date;
  source: 'selection' | 'full_page' | 'manual';
}

export interface ExtensionMessage {
  type: 'capture' | 'inject_brainlink' | 'ping' | 'auth_check';
  payload?: ExtensionCapturePayload | { brainLinkSnippet: string };
}
