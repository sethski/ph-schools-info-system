# =============================================================================
# MINDI Phase 1 — Embedding Generation (BGE-M3)
# Model: BAAI/bge-m3 via sentence-transformers
# Dimensions: 1024 (BGE-M3 default)
# ONNX export available for local offline fallback
#
# vector-database-engineer skill:
#   - 1024 dimensions for high recall
#   - Chunked inputs with overlap for context continuity
#   - Metadata stored in MongoDB, vectors in IndexedDB (client)
# =============================================================================

import os
import hashlib
from functools import lru_cache
from typing import List

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from loguru import logger
from sentence_transformers import SentenceTransformer

router = APIRouter()

# ---------------------------------------------------------------------------
# Model loading — lazy singleton, cached after first call
# ---------------------------------------------------------------------------

MODEL_NAME = "BAAI/bge-m3"
EMBEDDING_DIM = 1024


@lru_cache(maxsize=1)
def get_model() -> SentenceTransformer:
    """Load BGE-M3 model once and cache in memory."""
    logger.info(f"Loading embedding model: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)
    logger.info("Embedding model loaded")
    return model


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class EmbedRequest(BaseModel):
    texts: List[str]
    normalize: bool = True        # L2-normalize for cosine similarity
    batch_size: int = 32


class EmbedResponse(BaseModel):
    embeddings: List[List[float]]
    dimensions: int
    model: str
    count: int


class SimilarityRequest(BaseModel):
    query_embedding: List[float]
    candidate_embeddings: List[List[float]]
    top_k: int = 10


class SimilarityResponse(BaseModel):
    indices: List[int]            # Ranked indices of top_k candidates
    scores: List[float]           # Cosine similarity scores


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.post("/generate", response_model=EmbedResponse)
async def generate_embeddings(req: EmbedRequest) -> EmbedResponse:
    """
    Generate BGE-M3 embeddings for a batch of text chunks.
    Called by the ingest pipeline after PII redaction.
    """
    if not req.texts:
        raise HTTPException(status_code=400, detail="texts list is empty")

    if len(req.texts) > 500:
        raise HTTPException(status_code=400, detail="Max 500 texts per request")

    try:
        model = get_model()

        # BGE-M3 instruction prefix improves retrieval quality
        # For asymmetric retrieval: add instruction to queries, not passages
        passages = [f"Represent this sentence: {t}" for t in req.texts]

        embeddings = model.encode(
            passages,
            batch_size=req.batch_size,
            normalize_embeddings=req.normalize,
            show_progress_bar=False,
        )

        return EmbedResponse(
            embeddings=embeddings.tolist(),
            dimensions=EMBEDDING_DIM,
            model=MODEL_NAME,
            count=len(embeddings),
        )

    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")


@router.post("/query", response_model=EmbedResponse)
async def embed_query(texts: List[str]) -> EmbedResponse:
    """
    Embed a RAG query with retrieval instruction prefix.
    Separate endpoint from /generate to use query-optimized prefix.
    """
    if not texts:
        raise HTTPException(status_code=400, detail="texts list is empty")

    model = get_model()

    # Query instruction prefix for asymmetric retrieval
    queries = [f"Represent this query for searching: {t}" for t in texts]
    embeddings = model.encode(queries, normalize_embeddings=True)

    return EmbedResponse(
        embeddings=embeddings.tolist(),
        dimensions=EMBEDDING_DIM,
        model=MODEL_NAME,
        count=len(embeddings),
    )


@router.post("/similarity", response_model=SimilarityResponse)
async def compute_similarity(req: SimilarityRequest) -> SimilarityResponse:
    """
    Fast cosine similarity ranking for RAG retrieval.
    Used server-side when IndexedDB vectors aren't available (e.g. new device).
    """
    if not req.candidate_embeddings:
        raise HTTPException(status_code=400, detail="No candidate embeddings")

    q = np.array(req.query_embedding, dtype=np.float32)
    candidates = np.array(req.candidate_embeddings, dtype=np.float32)

    # Cosine similarity (vectors already L2-normalized from /generate)
    scores = candidates @ q

    top_k = min(req.top_k, len(scores))
    top_indices = np.argsort(scores)[::-1][:top_k].tolist()
    top_scores = scores[top_indices].tolist()

    return SimilarityResponse(indices=top_indices, scores=top_scores)
