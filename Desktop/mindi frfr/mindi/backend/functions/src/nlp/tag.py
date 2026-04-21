# =============================================================================
# MINDI Phase 1 — NLP: Zero-Shot Region Classifier
# Model: facebook/bart-large-mnli via HuggingFace transformers pipeline
# Classifies text chunks into NodeRegion: writing, code, personal,
#   academic, creative, professional
# =============================================================================

from functools import lru_cache
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from loguru import logger

router = APIRouter()

CANDIDATE_LABELS = [
    "creative writing or fiction",
    "source code or programming",
    "personal thoughts or diary",
    "academic or scientific content",
    "creative design or art",
    "professional work or business",
]

# Map classifier output back to NodeRegion keys
LABEL_TO_REGION = {
    "creative writing or fiction": "writing",
    "source code or programming": "code",
    "personal thoughts or diary": "personal",
    "academic or scientific content": "academic",
    "creative design or art": "creative",
    "professional work or business": "professional",
}

# Code detection heuristics (faster than classifier for obvious cases)
CODE_PATTERNS = [
    r'def\s+\w+\s*\(',
    r'function\s+\w+\s*\(',
    r'class\s+\w+[\s({]',
    r'import\s+\w+',
    r'from\s+\w+\s+import',
    r'<[a-zA-Z][^>]*>',   # HTML tags
    r'```[\w]*\n',         # Markdown code blocks
    r'^\s*(const|let|var)\s+\w+\s*=',
    r'^\s*#include\s*<',
]


@lru_cache(maxsize=1)
def get_classifier():
    """Load zero-shot classifier once."""
    import re
    from transformers import pipeline
    logger.info("Loading zero-shot classifier (facebook/bart-large-mnli)")
    clf = pipeline(
        "zero-shot-classification",
        model="facebook/bart-large-mnli",
        device=-1,  # CPU; use device=0 for GPU
    )
    logger.info("Classifier loaded")
    return clf


def quick_code_check(text: str) -> bool:
    """Fast heuristic check before running the full classifier."""
    import re
    code_signals = sum(
        1 for pattern in CODE_PATTERNS
        if re.search(pattern, text, re.MULTILINE)
    )
    return code_signals >= 2


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class TagRequest(BaseModel):
    texts: List[str]
    multi_label: bool = False   # Allow multiple regions per chunk


class TagResult(BaseModel):
    text_index: int
    region: str
    confidence: float
    all_scores: dict


class TagResponse(BaseModel):
    results: List[TagResult]
    model: str = "facebook/bart-large-mnli"


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post("/region", response_model=TagResponse)
async def tag_regions(req: TagRequest) -> TagResponse:
    """
    Classify each text chunk into a brain region.
    Uses fast heuristics first, classifier for ambiguous cases.
    """
    if not req.texts:
        raise HTTPException(status_code=400, detail="texts is empty")

    if len(req.texts) > 100:
        raise HTTPException(status_code=400, detail="Max 100 texts per request")

    classifier = get_classifier()
    results = []

    for i, text in enumerate(req.texts):
        # Fast code detection
        if quick_code_check(text):
            results.append(TagResult(
                text_index=i,
                region="code",
                confidence=0.92,
                all_scores={"code": 0.92},
            ))
            continue

        # Zero-shot classification
        try:
            output = classifier(
                text[:512],  # Truncate for speed
                CANDIDATE_LABELS,
                multi_label=req.multi_label,
            )

            top_label = output["labels"][0]
            top_score = output["scores"][0]
            region = LABEL_TO_REGION.get(top_label, "writing")

            all_scores = {
                LABEL_TO_REGION.get(label, label): round(score, 3)
                for label, score in zip(output["labels"], output["scores"])
            }

            results.append(TagResult(
                text_index=i,
                region=region,
                confidence=round(top_score, 3),
                all_scores=all_scores,
            ))

        except Exception as e:
            logger.warning(f"Classifier failed for text {i}: {e}")
            results.append(TagResult(
                text_index=i,
                region="writing",   # Safe fallback
                confidence=0.5,
                all_scores={},
            ))

    return TagResponse(results=results)
