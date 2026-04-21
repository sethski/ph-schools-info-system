# =============================================================================
# MINDI Phase 1 — Security: Hard Boundaries Engine
# Trust Covenant enforcement middleware.
# Blocks: auto-submit, impersonation, unauthorized sharing.
# All blocked requests are logged to the immutable audit trail.
#
# Risk levels mirror shared/constants/risk.ts:
#   GREEN  (LOW):   Auto-execute, no approval
#   YELLOW (MEDIUM): Preview required
#   RED    (HIGH):  Explicit approve + MFA
# =============================================================================

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from loguru import logger

from utils.mongo_db import get_db
from utils.logging import write_audit_log

router = APIRouter()


# ---------------------------------------------------------------------------
# Action registry — every automated action has a risk level
# ---------------------------------------------------------------------------

ACTION_RISK = {
    # GREEN — auto-execute
    "summarize":           "LOW",
    "embed":               "LOW",
    "tag_region":          "LOW",
    "extract_style":       "LOW",

    # YELLOW — preview required
    "draft_outline":       "MEDIUM",
    "generate_quiz":       "MEDIUM",
    "draft_email":         "MEDIUM",
    "suggest_feedback":    "MEDIUM",

    # RED — explicit approve + MFA required
    "submit_homework":     "HIGH",
    "send_email":          "HIGH",
    "share_brain_link":    "HIGH",
    "delete_all_data":     "HIGH",
    "export_brain":        "HIGH",
}

# Hard-blocked actions — no risk level, always denied
HARD_BLOCKED = {
    "impersonate_user",
    "auto_submit",          # Submitting work without explicit user click
    "share_without_consent",
    "send_without_preview",
}


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class BoundaryCheckRequest(BaseModel):
    uid: str
    action: str
    context: Optional[dict] = None
    mfa_verified: bool = False
    user_approved: bool = False    # Explicit click-through approval


class BoundaryCheckResponse(BaseModel):
    allowed: bool
    risk_level: Optional[str]
    reason: str
    requires_mfa: bool
    requires_approval: bool
    action: str


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.post("/check", response_model=BoundaryCheckResponse)
async def check_boundary(req: BoundaryCheckRequest) -> BoundaryCheckResponse:
    """
    Evaluate whether an action is allowed under the Trust Covenant.
    Called by Next.js API routes before executing any automated action.
    """

    # --- Hard block: always denied ---
    if req.action in HARD_BLOCKED:
        await write_audit_log(
            req.uid, "boundary_blocked",
            {"action": req.action, "reason": "HARD_BLOCKED", "context": req.context},
        )
        logger.warning(f"HARD BLOCK: {req.uid} attempted {req.action}")
        raise HTTPException(
            status_code=403,
            detail=f"Action '{req.action}' is permanently blocked by Mindi's Trust Covenant."
        )

    # --- Unknown action ---
    risk = ACTION_RISK.get(req.action)
    if not risk:
        await write_audit_log(
            req.uid, "boundary_blocked",
            {"action": req.action, "reason": "UNKNOWN_ACTION"},
        )
        raise HTTPException(
            status_code=400,
            detail=f"Unknown action '{req.action}'. Only registered actions are permitted."
        )

    # --- Risk-based evaluation ---
    if risk == "LOW":
        return BoundaryCheckResponse(
            allowed=True,
            risk_level="LOW",
            reason="Low-risk action: auto-execute permitted",
            requires_mfa=False,
            requires_approval=False,
            action=req.action,
        )

    if risk == "MEDIUM":
        # Must have shown preview to user
        if not req.user_approved:
            await write_audit_log(
                req.uid, "boundary_blocked",
                {"action": req.action, "reason": "PREVIEW_REQUIRED"},
            )
            return BoundaryCheckResponse(
                allowed=False,
                risk_level="MEDIUM",
                reason="Preview required: user must review output before applying",
                requires_mfa=False,
                requires_approval=True,
                action=req.action,
            )
        return BoundaryCheckResponse(
            allowed=True,
            risk_level="MEDIUM",
            reason="Preview approved by user",
            requires_mfa=False,
            requires_approval=False,
            action=req.action,
        )

    if risk == "HIGH":
        # Requires both explicit approval AND MFA
        if not req.user_approved:
            await write_audit_log(
                req.uid, "boundary_blocked",
                {"action": req.action, "reason": "EXPLICIT_APPROVAL_REQUIRED"},
            )
            return BoundaryCheckResponse(
                allowed=False,
                risk_level="HIGH",
                reason="Explicit approval required for high-risk action",
                requires_mfa=True,
                requires_approval=True,
                action=req.action,
            )

        if not req.mfa_verified:
            await write_audit_log(
                req.uid, "boundary_blocked",
                {"action": req.action, "reason": "MFA_REQUIRED"},
            )
            return BoundaryCheckResponse(
                allowed=False,
                risk_level="HIGH",
                reason="MFA verification required for high-risk action",
                requires_mfa=True,
                requires_approval=True,
                action=req.action,
            )

        return BoundaryCheckResponse(
            allowed=True,
            risk_level="HIGH",
            reason="High-risk action approved with MFA",
            requires_mfa=False,
            requires_approval=False,
            action=req.action,
        )

    # Fallback (should never reach)
    return BoundaryCheckResponse(
        allowed=False,
        risk_level=None,
        reason="Unhandled risk evaluation",
        requires_mfa=True,
        requires_approval=True,
        action=req.action,
    )
