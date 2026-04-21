# =============================================================================
# MINDI Phase 1 — NLP: Contradiction Detection
# Detects semantic conflicts between new content and existing brain nodes.
# Uses cosine similarity on BGE-M3 embeddings + NLI verification.
# Flagged contradictions are tagged "Pending Review" (non-blocking).
# =============================================================================

import numpy as np
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from loguru import logger

router = APIRouter()

# Similarity threshold: nodes above this are candidates for contradiction check
SIMILARITY_THRESHOLD = 0.75
# NLI contradiction score threshold
NLI_THRESHOLD = 0.60


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class NodeEmbedding(BaseModel):
    node_id: str
    content_excerpt: str    # First 200 chars for NLI context
    embedding: List[float]


class ContradictRequest(BaseModel):
    new_content: str
    new_embedding: List[float]
    existing_nodes: List[NodeEmbedding]
    region: str


class ContradictResult(BaseModel):
    node_id: str
    similarity_score: float
    contradiction_score: float
    is_contradiction: bool
    hint: str              # Human-readable description of the conflict


class ContradictResponse(BaseModel):
    contradictions: List[ContradictResult]
    checked_count: int
    flagged_count: int


# ---------------------------------------------------------------------------
# NLI contradiction check
# ---------------------------------------------------------------------------

def check_nli_contradiction(premise: str, hypothesis: str) -> float:
    """
    Use NLI to check if premise and hypothesis contradict.
    Returns contradiction probability (0–1).
    Falls back to 0.0 on error (non-blocking).
    """
    try:
        from transformers import pipeline
        nli = pipeline(
            "text-classification",
            model="cross-encoder/nli-distilroberta-base",
            device=-1,
        )
        result = nli(f"{premise} [SEP] {hypothesis}", truncation=True)
        for item in result:
            if item["label"].upper() == "CONTRADICTION":
                return round(item["score"], 3)
        return 0.0
    except Exception as e:
        logger.warning(f"NLI check failed (non-blocking): {e}")
        return 0.0


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post("/check", response_model=ContradictResponse)
async def check_contradictions(req: ContradictRequest) -> ContradictResponse:
    """
    Scan existing brain nodes for semantic conflicts with new content.
    High-similarity nodes are passed through NLI for contradiction scoring.
    Flagged nodes are non-blocking — UI shows "Pending Review" badge.
    """
    if not req.existing_nodes:
        return ContradictResponse(contradictions=[], checked_count=0, flagged_count=0)

    new_emb = np.array(req.new_embedding, dtype=np.float32)
    contradictions: List[ContradictResult] = []

    for node in req.existing_nodes:
        node_emb = np.array(node.embedding, dtype=np.float32)
        # Cosine similarity (embeddings already normalized)
        sim = float(np.dot(new_emb, node_emb))

        if sim < SIMILARITY_THRESHOLD:
            continue  # Not similar enough to contradict

        # Run NLI check on high-similarity pairs
        contradiction_score = check_nli_contradiction(
            premise=node.content_excerpt[:300],
            hypothesis=req.new_content[:300],
        )

        is_contradiction = contradiction_score >= NLI_THRESHOLD

        if is_contradiction:
            hint = (
                f"This content may conflict with an existing node "
                f"(similarity: {sim:.0%}, contradiction probability: {contradiction_score:.0%})"
            )
            contradictions.append(ContradictResult(
                node_id=node.node_id,
                similarity_score=round(sim, 3),
                contradiction_score=contradiction_score,
                is_contradiction=True,
                hint=hint,
            ))
            logger.info(f"Contradiction flagged: new vs {node.node_id} ({contradiction_score:.0%})")

    return ContradictResponse(
        contradictions=contradictions,
        checked_count=len(req.existing_nodes),
        flagged_count=len(contradictions),
    )
