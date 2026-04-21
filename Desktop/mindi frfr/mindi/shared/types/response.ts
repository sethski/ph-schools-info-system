// =============================================================================
// MINDI Phase 1 — Shared Types: RAGResponse with Citations + Confidence
// =============================================================================

import type { NodeRegion, SourceReference } from './node';

export interface RAGResponse {
  id: string;
  query: string;
  answer: string;
  citations: Citation[];
  confidence: number;           // 0–1 retrieval confidence
  styleMatchScore: number;      // 0–1 how well output matched user's style
  model: string;                // Which OpenRouter model was used
  retrievedNodeIds: string[];
  piiRedacted: boolean;
  lowConfidence: boolean;       // true if confidence < 0.7
  createdAt: Date;
}

export interface Citation {
  nodeId: string;
  nodeTitle: string;
  region: NodeRegion;
  excerpt: string;              // The specific passage cited
  paragraph?: number;           // Paragraph index in source
  confidence: number;
  sourceRef: SourceReference;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  confidence?: number;
  styleMatchScore?: number;
  feedbackScore?: 1 | -1;       // 👍/👎
  timestamp: Date;
}

export interface AuditEvent {
  id: string;
  userId: string;
  action:
    | 'ingest'
    | 'llm_call'
    | 'share_create'
    | 'share_revoke'
    | 'export'
    | 'delete_node'
    | 'login'
    | 'logout'
    | 'boundary_blocked';       // Trust boundary enforcement
  targetNodeId?: string;
  piiRedacted: boolean;
  piiFieldsRemoved?: string[];
  outboundModel?: string;
  blocked?: boolean;            // Was this action blocked by boundaries engine?
  metadata?: Record<string, unknown>;
  timestamp: Date;
}
