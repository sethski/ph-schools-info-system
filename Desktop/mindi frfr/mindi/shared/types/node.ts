// =============================================================================
// MINDI Phase 1 — Shared Types: BrainNode + Version + Region
// =============================================================================

export type NodeRegion =
  | 'writing'
  | 'code'
  | 'personal'
  | 'academic'
  | 'creative'
  | 'professional';

export interface BrainNode {
  id: string;
  userId: string;
  region: NodeRegion;
  title: string;
  content: string;           // Encrypted if region = 'personal' or encryptionEnabled
  isEncrypted: boolean;
  version: number;           // Current active version
  isArchived: boolean;
  confidence: number;        // 0–1, assigned by ML pipeline
  tags: string[];
  sourceRef: SourceReference;
  styleMetrics: NodeStyleMetrics;
  relatedNodeIds: string[];  // Semantic similarity edges
  contradictionFlag: boolean; // Flagged by contradict.py
  createdAt: Date;
  updatedAt: Date;
}

export interface NodeVersion {
  nodeId: string;
  version: number;
  content: string;
  isEncrypted: boolean;
  archivedAt: Date;
  reason: 'update' | 'user-archived' | 'contradiction-resolved';
}

export interface SourceReference {
  type: 'upload' | 'gdrive' | 'gmail' | 'clipboard' | 'manual';
  fileId?: string;
  fileName?: string;
  fileUrl?: string;
  paragraph?: number;        // Source paragraph index for citation
  timestamp?: Date;
}

export interface NodeStyleMetrics {
  avgSentenceLength: number;
  vocabDiversity: number;    // Type-token ratio
  formalityScore: number;    // 0–1
  sentimentAvg: number;      // -1 to 1
  dominantStructure: 'prose' | 'bullets' | 'code' | 'mixed';
}

// Ingest job — tracks async pipeline status
export interface IngestJob {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: 'queued' | 'chunking' | 'embedding' | 'fingerprinting' | 'complete' | 'failed';
  progress: number;           // 0–100
  nodesCreated: number;
  piiRedacted: boolean;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Text chunk used in the embedding pipeline
export interface TextChunk {
  index: number;
  content: string;
  contentHash: string;        // SHA-256 for dedup
  tokenCount: number;
  sourceRef: SourceReference;
  embedding?: number[];       // Stored in IndexedDB only
}
