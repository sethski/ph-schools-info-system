// =============================================================================
// MINDI — Phase 2 Extended Types
// Adaptive identity, proactivity engine, automation, voice, Brain Link.
// Extends Phase 1 shared/types/index.ts — import both.
// =============================================================================

import type { NodeRegion, BrainNode, StyleFingerprint } from './index';

// -----------------------------------------------------------------------------
// ADAPTIVE IDENTITY — Style update proposals
// -----------------------------------------------------------------------------

export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'modified';

export interface StyleUpdateProposal {
  id: string;
  userId: string;
  region: NodeRegion;
  field: string; // e.g. 'toneKeywords', 'preferredStructure'
  currentValue: unknown;
  proposedValue: unknown;
  rationale: string; // Why Mindi is suggesting this
  evidenceNodeIds: string[]; // Which nodes triggered this
  status: ProposalStatus;
  userModifiedValue?: unknown; // If user chose to modify instead of approve/reject
  createdAt: Date;
  resolvedAt?: Date;
}

// -----------------------------------------------------------------------------
// PROACTIVITY ENGINE
// -----------------------------------------------------------------------------

export type ProactivityTrigger =
  | 'deadline_detected'
  | 'contradiction_found'
  | 'skill_gap_detected'
  | 'idle_suggestion'
  | 'stress_detected'
  | 'pattern_insight';

export type ProactivityPriority = 'low' | 'medium' | 'high';

export interface ProactivityAlert {
  id: string;
  userId: string;
  trigger: ProactivityTrigger;
  priority: ProactivityPriority;
  title: string;
  body: string;
  actionLabel?: string; // e.g. "Start quiz", "Review draft"
  actionType?: AutomationTaskType;
  relatedNodeIds: string[];
  isDismissed: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

// -----------------------------------------------------------------------------
// EMOTIONAL STATE DETECTION
// -----------------------------------------------------------------------------

export type EmotionalState = 'focused' | 'stressed' | 'fatigued' | 'neutral' | 'productive';

export interface EmotionalSignals {
  detectedState: EmotionalState;
  signals: {
    typingSpeedDelta?: number; // Change from user's baseline
    revisionRate?: number; // Edits per minute
    hourOfDay?: number; // Late-night sessions = fatigue signal
    sessionDuration?: number; // Minutes in current session
    wordSentiment?: number; // -1 to 1
  };
  confidence: number;
  detectedAt: Date;
}

// -----------------------------------------------------------------------------
// "SECOND ME" AUTOMATION
// -----------------------------------------------------------------------------

export type AutomationTaskType =
  | 'homework_outline'
  | 'homework_draft'
  | 'quiz_generate'
  | 'email_draft'
  | 'summarize'
  | 'skill_gap_analysis'
  | 'review_feedback';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AutomationTask {
  id: string;
  userId: string;
  type: AutomationTaskType;
  riskLevel: RiskLevel;
  title: string;
  input: Record<string, unknown>; // Task-specific input
  output?: string; // Generated content (shown in preview)
  status: 'queued' | 'generating' | 'preview' | 'approved' | 'rejected';
  styleMatchScore?: number; // 0-1, how well output matched user's style
  requiresApproval: boolean; // Always true for MEDIUM/HIGH
  approvedAt?: Date;
  createdAt: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  nodeId: string; // Source node
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizSession {
  id: string;
  userId: string;
  topic: string;
  questions: QuizQuestion[];
  answers: Record<string, number>; // questionId → selectedIndex
  score?: number;
  completedAt?: Date;
  createdAt: Date;
}

export interface SkillGapAnalysis {
  id: string;
  userId: string;
  targetDescription: string; // Job description or project spec
  knownSkills: string[]; // Detected from brain nodes
  missingSkills: string[]; // Gaps identified
  learningPath: LearningPathItem[];
  createdAt: Date;
}

export interface LearningPathItem {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  suggestedResources: string[];
  estimatedHours: number;
}

// -----------------------------------------------------------------------------
// BRAIN LINK v1 — Static context injection
// -----------------------------------------------------------------------------

export interface BrainLinkConfig {
  regions: NodeRegion[];
  includeStyleFingerprint: boolean;
  includeRecentNodes: boolean;
  maxNodes: number; // cap for snippet length
  expiresInHours: number | null; // null = no expiry
}

export interface BrainLinkSnippet {
  header: string; // "# Mindi Brain Link"
  styleSection: string; // Style fingerprint as readable text
  knowledgeSection: string; // Relevant node excerpts
  instructionSection: string; // "When responding, use this context..."
  fullText: string; // Combined — paste into any AI
  characterCount: number;
  tokenEstimate: number;
}

// -----------------------------------------------------------------------------
// VOICE Q&A (Pipeline: STT → RAG → TTS)
// voice-agents skill: Pipeline architecture for maximum control
// -----------------------------------------------------------------------------

export type VoiceSessionStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface VoiceSession {
  id: string;
  userId: string;
  status: VoiceSessionStatus;
  transcript?: string; // STT output
  response?: string; // RAG answer
  audioUrl?: string; // TTS output (local blob URL)
  latencyMs?: number; // Total pipeline latency
  createdAt: Date;
}

// Voice consent — explicit per the Trust Covenant
export interface VoiceConsent {
  userId: string;
  consentGiven: boolean;
  consentDate: Date;
  purposeAcknowledged: boolean; // User confirmed what voice data is used for
  storageLocation: 'local-only'; // Phase 2: always local-only
}

// -----------------------------------------------------------------------------
// AUDIT LOG — Phase 2 new action types
// -----------------------------------------------------------------------------

export type Phase2AuditAction =
  | 'style_proposal_created'
  | 'style_proposal_approved'
  | 'style_proposal_rejected'
  | 'automation_task_created'
  | 'automation_task_approved'
  | 'automation_approved_sent' // HIGH risk: explicit approve
  | 'brainlink_created'
  | 'brainlink_revoked'
  | 'voice_session_started'
  | 'quiz_completed'
  | 'skill_gap_analyzed';
