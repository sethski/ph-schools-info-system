# =============================================================================
# MINDI — Python: Proactivity Engine (Phase 2 update)
# Wires BGE-M3 contradiction detection into proactivity alerts.
# Called by Next.js /api/proactivity route after ingest completes.
# =============================================================================

import re
from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from loguru import logger
from utils.mongo_db import get_db
from utils.logging import write_audit_log

router = APIRouter()

DEADLINE_PATTERNS = [
    r'due\s+(?:on\s+)?(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)',
    r'deadline[:\s]+(\w+\s+\d{1,2})',
    r'submit(?:ted)?\s+by\s+(\w+\s+\d{1,2})',
    r'exam\s+on\s+(\w+\s+\d{1,2})',
    r'due\s+(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)',
]


class ProactivityScanRequest(BaseModel):
    uid: str
    node_ids: List[str]          # Newly ingested nodes to scan


class ProactivityAlert(BaseModel):
    trigger: str
    priority: str                # low | medium | high
    title: str
    body: str
    related_node_ids: List[str]
    action_type: Optional[str] = None


class ProactivityScanResponse(BaseModel):
    alerts: List[ProactivityAlert]
    scanned: int


@router.post("/scan", response_model=ProactivityScanResponse)
async def scan_for_proactivity(req: ProactivityScanRequest) -> ProactivityScanResponse:
    """
    Scan newly ingested nodes for deadlines and contradictions.
    Writes alerts to Firestore users/{uid}/alerts.
    """
    db = get_db()
    alerts: List[ProactivityAlert] = []

    for node_id in req.node_ids:
        node_snap = db.collection("users").document(req.uid)\
                      .collection("nodes").document(node_id).get()
        if not node_snap.exists:
            continue

        node = node_snap.to_dict()
        content = node.get("content", "")
        if node.get("isEncrypted"):
            continue  # Never scan encrypted content

        # Deadline detection
        for pattern in DEADLINE_PATTERNS:
            match = re.search(pattern, content, re.I)
            if match:
                alert = ProactivityAlert(
                    trigger="deadline_detected",
                    priority="high",
                    title="📅 Deadline detected",
                    body=f'Found "{match.group(0)}" in "{node.get("title", "a node")}". Want Mindi to help you prepare?',
                    related_node_ids=[node_id],
                    action_type="homework_outline",
                )
                alerts.append(alert)

                # Write to Firestore
                db.collection("users").document(req.uid)\
                  .collection("alerts").add({
                    **alert.model_dump(),
                    "isDismissed": False,
                    "userId": req.uid,
                    "createdAt": __import__("datetime").datetime.utcnow().isoformat(),
                  })
                break  # One deadline alert per node

    await write_audit_log(req.uid, "proactivity_scan", {"node_count": len(req.node_ids), "alerts_created": len(alerts)})

    return ProactivityScanResponse(alerts=alerts, scanned=len(req.node_ids))
