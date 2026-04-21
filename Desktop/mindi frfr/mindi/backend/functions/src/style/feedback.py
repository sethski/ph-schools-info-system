# =============================================================================
# MINDI Phase 4 — Style Feedback Endpoint
# Called when user submits AuthenticityRating (👍/👎 or 1-5 score).
# Adjusts style_match_score and flags low-rated regions for re-extraction.
# =============================================================================

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from loguru import logger
from utils.mongo_db import get_db
from utils.logging import write_audit_log

router = APIRouter()


class StyleFeedbackRequest(BaseModel):
    uid: str
    score: float          # 1–5 from AuthenticityRating, or 0/1 from 👍/👎
    region: Optional[str] = None
    feedback_type: Optional[str] = None  # tone | accuracy | structure | voice
    message_id: Optional[str] = None


class StyleFeedbackResponse(BaseModel):
    updated: bool
    new_style_match_score: float
    needs_reextraction: bool   # True if score ≤ 2 — trigger fresh style extraction


@router.post("/feedback", response_model=StyleFeedbackResponse)
async def style_feedback(req: StyleFeedbackRequest) -> StyleFeedbackResponse:
    """
    Update style_match_score from user authenticity rating.
    Score < 2/5 → flags region for re-extraction on next ingest.
    Weighted update: existing 80% + new feedback 20%.
    """
    db = get_db()

    # Normalise score to 0-1
    normalised = (req.score - 1) / 4.0 if req.score > 1 else float(req.score)

    user_ref = db.collection("users").document(req.uid)
    user_snap = user_ref.get()
    if not user_snap.exists:
        return StyleFeedbackResponse(updated=False, new_style_match_score=0.5, needs_reextraction=False)

    fingerprint = user_snap.to_dict().get("style_fingerprint", {})
    region = req.region or "overall"

    existing_score = fingerprint.get(region, {}).get("style_match_score", 0.75)
    new_score = round(existing_score * 0.8 + normalised * 0.2, 3)

    update_payload = {f"style_fingerprint.{region}.style_match_score": new_score}

    # Flag for re-extraction if consistently poor ratings
    needs_reextraction = normalised <= 0.4  # ≤ 2/5
    if needs_reextraction:
        update_payload[f"style_fingerprint.{region}.needs_reextraction"] = True
        logger.info(f"Style re-extraction flagged for {req.uid}/{region} (score={new_score:.2f})")

    user_ref.update(update_payload)

    await write_audit_log(req.uid, "style_feedback_received", {
        "region": region,
        "raw_score": req.score,
        "normalised": normalised,
        "new_match_score": new_score,
        "feedback_type": req.feedback_type,
        "needs_reextraction": needs_reextraction,
    })

    return StyleFeedbackResponse(
        updated=True,
        new_style_match_score=new_score,
        needs_reextraction=needs_reextraction,
    )
