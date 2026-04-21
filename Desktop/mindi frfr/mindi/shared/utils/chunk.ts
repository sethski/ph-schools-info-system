// =============================================================================
// MINDI Phase 1 — Shared Utils: Text Chunking (JS mirror of chunk.py)
// Used client-side for pre-processing before sending to Python ML backend.
// =============================================================================

import type { TextChunk, SourceReference } from '../types/node';

const CHUNK_MAX_TOKENS = 512;
const CHUNK_OVERLAP_TOKENS = 50;

// Rough 4-chars-per-token estimate
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// SHA-256 hash for dedup (browser crypto API)
export async function hashContent(content: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(content.trim())
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function chunkText(
  text: string,
  sourceRef: SourceReference,
  options: { maxTokens?: number; overlapTokens?: number } = {}
): Promise<TextChunk[]> {
  const maxChars = (options.maxTokens ?? CHUNK_MAX_TOKENS) * 4;
  const overlapChars = (options.overlapTokens ?? CHUNK_OVERLAP_TOKENS) * 4;

  if (!text?.trim()) return [];

  const sentences = text
    .replace(/\r\n/g, '\n')
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);

  const chunks: TextChunk[] = [];
  let current = '';
  let idx = 0;

  for (const sentence of sentences) {
    const proposed = current + (current ? ' ' : '') + sentence;
    if (proposed.length > maxChars && current.length > 0) {
      const hash = await hashContent(current.trim());
      chunks.push({
        index: idx++,
        content: current.trim(),
        contentHash: hash,
        tokenCount: estimateTokens(current),
        sourceRef,
      });
      current = current.slice(-overlapChars) + ' ' + sentence;
    } else {
      current = proposed;
    }
  }

  if (current.trim()) {
    const hash = await hashContent(current.trim());
    chunks.push({
      index: idx,
      content: current.trim(),
      contentHash: hash,
      tokenCount: estimateTokens(current),
      sourceRef,
    });
  }

  return chunks;
}

export function deduplicateChunks<T extends { contentHash: string }>(
  chunks: T[],
  existingHashes: Set<string>
): { newChunks: T[]; skippedCount: number } {
  const newChunks = chunks.filter((c) => !existingHashes.has(c.contentHash));
  return { newChunks, skippedCount: chunks.length - newChunks.length };
}
