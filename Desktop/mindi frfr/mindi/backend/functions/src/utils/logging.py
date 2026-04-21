# =============================================================================
# MINDI Phase 1 — Utils: Audit Log Writer
# Writes to MongoDB-backed users/{uid}/auditLog/{id} records
# =============================================================================

import uuid
from datetime import datetime, timezone
from typing import Optional
from loguru import logger


def setup_logging() -> None:
    """Configure loguru for structured logging."""
    logger.add(
        "logs/mindi-ml.log",
        rotation="100 MB",
        retention="30 days",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
        level="INFO",
    )


async def write_audit_log(
    uid: str,
    action: str,
    metadata: Optional[dict] = None,
    pii_redacted: bool = False,
) -> None:
    """
    Append an immutable audit log entry for a user action.
    MongoDB-backed audit records remain append-only at the application layer.
    """
    try:
        from utils.mongo_db import get_db
        db = get_db()

        log_entry = {
            "id": str(uuid.uuid4()),
            "userId": uid,
            "action": action,
            "piiRedacted": pii_redacted,
            "metadata": metadata or {},
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "ml-backend",
        }

        db.collection("users").document(uid)\
          .collection("auditLog").add(log_entry)

    except Exception as e:
        # Audit log failures are logged but never block the main flow
        logger.error(f"Audit log write failed for {uid}/{action}: {e}")
