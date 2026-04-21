# Mindi Phase 1 — Firestore Schema

## Collections

### `users/{uid}`
User profile and style fingerprint.

```
{
  uid: string,
  email: string,
  displayName: string | null,
  locale: "en" | "tl",
  mfaEnrolled: boolean,
  style_fingerprint: {
    [region: string]: {
      tone_keywords: string[],
      avg_sentence_length: number,
      vocab_level: string,
      preferred_structure: string,
      formality_score: number,
      writing_rhythm: string,
      node_count: number,
      last_updated: string  // ISO timestamp
    }
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `users/{uid}/nodes/{nodeId}`
Brain knowledge nodes.

```
{
  id: string,
  userId: string,
  region: "writing"|"code"|"personal"|"academic"|"creative"|"professional",
  title: string,
  content: string,          // Encrypted if personal or encryptionEnabled
  isEncrypted: boolean,
  version: number,          // Active version number
  isArchived: boolean,
  confidence: number,        // 0–1
  tags: string[],
  sourceRef: {
    type: "upload"|"gdrive"|"gmail"|"clipboard"|"manual",
    fileId?: string,
    fileName?: string,
    fileUrl?: string,
    paragraph?: number,
    timestamp?: Timestamp
  },
  styleMetrics: {
    avgSentenceLength: number,
    vocabDiversity: number,
    formalityScore: number,
    sentimentAvg: number,
    dominantStructure: string
  },
  relatedNodeIds: string[],  // Edges (semantic similarity > 0.75)
  contradictionFlag: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `users/{uid}/nodes/{nodeId}/versions/{versionId}`
Full version history. Append-only.

```
{
  nodeId: string,
  version: number,
  content: string,
  isEncrypted: boolean,
  archivedAt: Timestamp,
  reason: "update"|"user-archived"|"contradiction-resolved"
}
```

### `users/{uid}/auditLog/{logId}`
Immutable audit trail. No update/delete allowed by security rules.

```
{
  id: string,
  userId: string,
  action: string,          // See AuditEvent type
  piiRedacted: boolean,
  piiFieldsRemoved: string[],
  outboundModel?: string,
  blocked?: boolean,
  metadata: object,
  timestamp: Timestamp,
  source: "web-client"|"ml-backend"
}
```

### `users/{uid}/ingestJobs/{jobId}`
Tracks async processing pipeline status.

```
{
  id: string,
  userId: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  status: "queued"|"chunking"|"embedding"|"fingerprinting"|"complete"|"failed",
  progress: number,         // 0–100
  nodesCreated: number,
  piiRedacted: boolean,
  error?: string,
  createdAt: Timestamp,
  completedAt?: Timestamp
}
```
