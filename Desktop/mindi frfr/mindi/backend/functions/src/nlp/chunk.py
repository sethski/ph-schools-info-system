# =============================================================================
# MINDI Phase 1 — NLP: Semantic Chunking + Deduplication
# Splits text into embedding-ready chunks with overlap.
# Hash-based dedup prevents re-embedding unchanged content.
# vector-database-engineer skill: 512 tokens, 50-token overlap for context.
# =============================================================================

import hashlib
import re
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from loguru import logger

router = APIRouter()

CHUNK_MAX_CHARS = 2048    # ~512 tokens at 4 chars/token
CHUNK_OVERLAP_CHARS = 200  # ~50 tokens overlap


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ChunkRequest(BaseModel):
    text: str
    source_file_id: str
    source_file_name: str
    max_chars: int = CHUNK_MAX_CHARS
    overlap_chars: int = CHUNK_OVERLAP_CHARS
    existing_hashes: List[str] = []  # Client sends known hashes to skip


class ChunkItem(BaseModel):
    index: int
    content: str
    content_hash: str
    token_estimate: int
    char_start: int
    char_end: int
    is_duplicate: bool


class ChunkResponse(BaseModel):
    chunks: List[ChunkItem]
    total_chunks: int
    new_chunks: int
    skipped_chunks: int


# ---------------------------------------------------------------------------
# Core chunking logic
# ---------------------------------------------------------------------------

def sha256(text: str) -> str:
    return hashlib.sha256(text.strip().encode()).hexdigest()


def split_sentences(text: str) -> List[str]:
    """
    Split on sentence boundaries (. ! ?) preserving structure.
    Handles edge cases: abbreviations, decimals, code blocks.
    """
    # Protect common abbreviations and decimals
    protected = re.sub(r'(\b(?:Dr|Mr|Mrs|Ms|Prof|etc|vs|Fig|e\.g|i\.e)\.)(\s)', r'\1__SENT__\2', text)
    protected = re.sub(r'(\d+\.\d+)', lambda m: m.group().replace('.', '__DEC__'), protected)

    sentences = re.split(r'(?<=[.!?])\s+', protected)

    # Restore protected patterns
    sentences = [s.replace('__SENT__', ' ').replace('__DEC__', '.') for s in sentences]
    return [s for s in sentences if s.strip()]


def chunk_text(
    text: str,
    max_chars: int = CHUNK_MAX_CHARS,
    overlap_chars: int = CHUNK_OVERLAP_CHARS,
) -> List[dict]:
    if not text or not text.strip():
        return []

    sentences = split_sentences(text)
    chunks = []
    current = ""
    char_pos = 0

    for sentence in sentences:
        proposed = current + (" " if current else "") + sentence

        if len(proposed) > max_chars and current:
            # Emit current chunk
            trimmed = current.strip()
            chunks.append({
                "content": trimmed,
                "hash": sha256(trimmed),
                "char_start": max(0, char_pos - len(current)),
                "char_end": char_pos,
            })
            # Start next chunk with overlap
            current = current[-overlap_chars:] + " " + sentence
        else:
            current = proposed

        char_pos += len(sentence) + 1

    # Final chunk
    if current.strip():
        trimmed = current.strip()
        chunks.append({
            "content": trimmed,
            "hash": sha256(trimmed),
            "char_start": max(0, char_pos - len(current)),
            "char_end": char_pos,
        })

    return chunks


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post("/text", response_model=ChunkResponse)
async def chunk_document(req: ChunkRequest) -> ChunkResponse:
    """
    Chunk a document into embedding-ready pieces.
    Returns only new chunks (not in existing_hashes) to avoid re-embedding.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text is empty")

    if len(req.text) > 5_000_000:
        raise HTTPException(status_code=400, detail="text exceeds 5MB limit")

    raw_chunks = chunk_text(req.text, req.max_chars, req.overlap_chars)
    existing_set = set(req.existing_hashes)

    result_chunks = []
    new_count = 0
    skipped_count = 0

    for i, chunk in enumerate(raw_chunks):
        is_dup = chunk["hash"] in existing_set
        if is_dup:
            skipped_count += 1
        else:
            new_count += 1

        result_chunks.append(ChunkItem(
            index=i,
            content=chunk["content"],
            content_hash=chunk["hash"],
            token_estimate=len(chunk["content"]) // 4,
            char_start=chunk["char_start"],
            char_end=chunk["char_end"],
            is_duplicate=is_dup,
        ))

    logger.info(
        f"Chunked '{req.source_file_name}': "
        f"{len(raw_chunks)} total, {new_count} new, {skipped_count} skipped"
    )

    return ChunkResponse(
        chunks=result_chunks,
        total_chunks=len(raw_chunks),
        new_chunks=new_count,
        skipped_chunks=skipped_count,
    )
