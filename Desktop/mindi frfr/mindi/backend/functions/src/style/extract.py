# =============================================================================
# MINDI Phase 1 — Style Extraction
# Two-stage pipeline:
#   1. Statistical metrics from text (sentence length, vocab, formality)
#   2. LLM qualitative profile via OpenRouter
# Produces StyleFingerprint stored in MongoDB users/{uid}/style_fingerprint
# =============================================================================

import re
import json
from typing import List, Optional
from collections import Counter

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from loguru import logger

from utils.openrouter import call_openrouter
from utils.mongo_db import get_db
from utils.logging import write_audit_log

router = APIRouter()

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class StyleExtractRequest(BaseModel):
    uid: str
    region: str
    text_samples: List[str]       # Multiple chunks for richer analysis
    existing_fingerprint: Optional[dict] = None  # Merge with current profile


class StyleExtractResponse(BaseModel):
    uid: str
    region: str
    tone_keywords: List[str]
    avg_sentence_length: float
    vocab_level: str              # simple | intermediate | advanced
    preferred_structure: str      # prose | bullets | mixed
    formality_score: float        # 0–1
    writing_rhythm: str
    vocab_diversity: float        # type-token ratio
    llm_observations: str
    style_match_score: float      # 0–1 confidence in profile accuracy


# ---------------------------------------------------------------------------
# Statistical helpers
# ---------------------------------------------------------------------------

def compute_avg_sentence_length(text: str) -> float:
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    sentences = [s for s in sentences if len(s.split()) > 1]
    if not sentences:
        return 0.0
    word_counts = [len(s.split()) for s in sentences]
    return round(sum(word_counts) / len(word_counts), 1)


def compute_vocab_diversity(text: str) -> float:
    """Type-token ratio (TTR) — unique words / total words."""
    words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
    if not words:
        return 0.0
    return round(len(set(words)) / len(words), 3)


def estimate_formality(text: str) -> float:
    """
    Heuristic formality score based on:
    - Contractions (informal) vs. full forms (formal)
    - First-person pronouns (informal)
    - Passive voice markers (formal)
    - Average word length
    """
    informal_markers = len(re.findall(r"\b(I'm|can't|won't|don't|isn't|it's|I've|I'd)\b", text))
    formal_markers = len(re.findall(r"\b(therefore|furthermore|consequently|however|nevertheless)\b", text, re.I))
    passive = len(re.findall(r'\b(is|was|were|been|be)\s+\w+ed\b', text))

    words = text.split()
    avg_word_len = sum(len(w) for w in words) / max(len(words), 1)

    # Normalize to 0–1 (higher = more formal)
    score = 0.5
    score -= informal_markers * 0.03
    score += formal_markers * 0.04
    score += passive * 0.02
    score += max(0, (avg_word_len - 4) * 0.05)
    return round(max(0.0, min(1.0, score)), 2)


def estimate_vocab_level(diversity: float, avg_word_len: float) -> str:
    if diversity < 0.4 and avg_word_len < 4.5:
        return "simple"
    elif diversity > 0.65 or avg_word_len > 6:
        return "advanced"
    return "intermediate"


def detect_structure(text: str) -> str:
    bullet_markers = len(re.findall(r'^[\s]*[-•*]\s', text, re.MULTILINE))
    numbered = len(re.findall(r'^\s*\d+[.)]\s', text, re.MULTILINE))
    code_blocks = len(re.findall(r'```|`[^`]+`', text))

    if code_blocks > 2:
        return "code"
    total_structure = bullet_markers + numbered
    sentences = len(re.split(r'(?<=[.!?])\s+', text))
    if total_structure > sentences * 0.5:
        return "bullets"
    elif total_structure > 0:
        return "mixed"
    return "prose"


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post("/extract", response_model=StyleExtractResponse)
async def extract_style(req: StyleExtractRequest) -> StyleExtractResponse:
    """
    Extract style fingerprint from text samples.
    Runs statistical analysis + LLM qualitative profile.
    """
    if not req.text_samples:
        raise HTTPException(status_code=400, detail="text_samples is empty")

    combined = "\n\n".join(req.text_samples[:10])  # Cap at 10 samples

    # --- Statistical metrics ---
    avg_sentence_len = compute_avg_sentence_length(combined)
    vocab_diversity = compute_vocab_diversity(combined)
    formality = estimate_formality(combined)
    words = re.findall(r'\b[a-zA-Z]+\b', combined.lower())
    avg_word_len = sum(len(w) for w in words) / max(len(words), 1)
    vocab_level = estimate_vocab_level(vocab_diversity, avg_word_len)
    structure = detect_structure(combined)

    # --- LLM qualitative profile ---
    existing_context = ""
    if req.existing_fingerprint:
        existing_context = f"\nExisting profile to update:\n{json.dumps(req.existing_fingerprint, indent=2)}\n"

    system_prompt = """You are a writing style analyst for Mindi, an adaptive AI companion.
Analyze the text and return ONLY valid JSON (no markdown, no preamble).
JSON structure:
{
  "tone_keywords": ["string"],    // 3-5 words: e.g. "analytical", "warm", "terse"
  "writing_rhythm": "string",     // 1 sentence: e.g. "Short punchy sentences with em-dashes"
  "observations": "string"        // 1-2 sentences in plain English
}"""

    user_prompt = f"{existing_context}Analyze this writing sample (region: {req.region}):\n\n{combined[:2000]}"

    try:
        llm_raw = await call_openrouter(
            system=system_prompt,
            user=user_prompt,
            model="anthropic/claude-haiku-4",
            max_tokens=300,
            temperature=0.2,
        )
        llm_data = json.loads(llm_raw.strip())
        tone_keywords = llm_data.get("tone_keywords", ["clear", "direct"])
        writing_rhythm = llm_data.get("writing_rhythm", "Standard prose")
        llm_obs = llm_data.get("observations", "")
    except Exception as e:
        logger.warning(f"LLM style extraction fallback: {e}")
        tone_keywords = ["clear", "direct"]
        writing_rhythm = "Standard prose"
        llm_obs = ""

    # --- Persist to MongoDB ---
    profile = {
        "region": req.region,
        "tone_keywords": tone_keywords,
        "avg_sentence_length": avg_sentence_len,
        "vocab_level": vocab_level,
        "preferred_structure": structure,
        "formality_score": formality,
        "writing_rhythm": writing_rhythm,
        "vocab_diversity": vocab_diversity,
        "llm_observations": llm_obs,
        "style_match_score": 0.75,  # Initial estimate; improves with feedback
    }

    db = get_db()
    db.collection("users").document(req.uid).set(
        {"style_fingerprint": {req.region: profile}},
        merge=True,
    )

    await write_audit_log(req.uid, "style_extracted", {"region": req.region})

    return StyleExtractResponse(**profile, uid=req.uid)
