# =============================================================================
# MINDI Phase 1 — Style Fingerprint: Store & Update
# Manages versioned style profiles in Firestore.
# Called by extract.py after each ingest batch.
# =============================================================================

from datetime import datetime, timezone
from typing import Optional
from loguru import logger
from utils.mongo_db import get_db


def get_fingerprint(uid: str) -> Optional[dict]:
    """Load current style fingerprint for a user."""
    db = get_db()
    doc = db.collection("users").document(uid).get()
    if doc.exists:
        return doc.to_dict().get("style_fingerprint")
    return None


def update_fingerprint(uid: str, region: str, new_profile: dict) -> None:
    """
    Merge new region profile into existing fingerprint.
    Weighted average for numeric fields (new = 30%, existing = 70%)
    to prevent single document from skewing the profile.
    """
    db = get_db()
    existing = get_fingerprint(uid) or {}
    existing_region = existing.get(region, {})

    # Weighted merge for numeric fields
    merged = {**new_profile}
    for field in ["avg_sentence_length", "formality_score", "vocab_diversity"]:
        if field in existing_region and field in new_profile:
            merged[field] = round(
                existing_region[field] * 0.7 + new_profile[field] * 0.3, 3
            )

    # Merge tone keywords (union, capped at 8)
    old_keywords = set(existing_region.get("tone_keywords", []))
    new_keywords = set(new_profile.get("tone_keywords", []))
    merged["tone_keywords"] = list(old_keywords | new_keywords)[:8]

    merged["last_updated"] = datetime.now(timezone.utc).isoformat()
    merged["node_count"] = existing_region.get("node_count", 0) + 1

    db.collection("users").document(uid).set(
        {"style_fingerprint": {region: merged}, "style_updated_at": datetime.now(timezone.utc).isoformat()},
        merge=True,
    )
    logger.debug(f"Style fingerprint updated for {uid}/{region}")
