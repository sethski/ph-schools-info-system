# =============================================================================
# MINDI — Python: Collaboration Sandbox (Phase 3 update)
# Creates and manages sandbox Firestore paths for brain-to-brain sync.
# Admin SDK bypasses client security rules for cross-user sandbox writes.
# =============================================================================

import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from loguru import logger
from utils.mongo_db import get_db
from utils.logging import write_audit_log

router = APIRouter()


class CreateSandboxRequest(BaseModel):
    initiator_uid: str
    participant_uid: str
    shared_regions: List[str]
    session_id: str


class SandboxResponse(BaseModel):
    sandbox_id: str
    created: bool


@router.post("/create", response_model=SandboxResponse)
async def create_sandbox(req: CreateSandboxRequest) -> SandboxResponse:
    """
    Admin-creates a sandbox Firestore path for two collaborating users.
    Client security rules block direct sandbox creation — only Admin SDK allowed.
    """
    db = get_db()
    sandbox_id = f"sandbox_{req.initiator_uid[:8]}_{req.participant_uid[:8]}_{int(datetime.now().timestamp())}"

    db.collection("sandboxes").document(sandbox_id).set({
        "sandboxId": sandbox_id,
        "sessionId": req.session_id,
        "initiatorUid": req.initiator_uid,
        "participantUid": req.participant_uid,
        "sharedRegions": req.shared_regions,
        "status": "active",
        "createdAt": datetime.now(timezone.utc).isoformat(),
    })

    await write_audit_log(req.initiator_uid, "sandbox_created", {"sandbox_id": sandbox_id})
    return SandboxResponse(sandbox_id=sandbox_id, created=True)
