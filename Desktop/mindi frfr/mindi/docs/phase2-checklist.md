# Phase 2 Validation Checklist

> All criteria must PASS before Phase 3 begins.
> Phase 1 gates remain green (re-verify if any Phase 1 code was touched).

## Gate 1 — Adaptive Identity

- [ ] Upload new content → style proposal appears in Firestore within 30s
- [ ] Style proposal shows: current value, proposed value, rationale, evidence nodes
- [ ] Approve proposal → `styleFingerprint` updates in Firestore
- [ ] Reject proposal → status flips to `rejected`, fingerprint unchanged
- [ ] Modify proposal → user's modified value saved, applied to fingerprint

## Gate 2 — Proactivity Engine

- [ ] Node with deadline text (e.g. "due November 15") → alert fires within engine cycle
- [ ] Two nodes with contradicting claims → contradiction alert appears
- [ ] Late-hour session (after 11pm) + long session → stress/fatigue alert surfaces
- [ ] DnD schedule set → no alerts fired during that window
- [ ] Dismiss alert → `isDismissed: true`, disappears from panel
- [ ] Cannot update any other field on alert except `isDismissed` (Firestore rule check)

## Gate 3 — "Second Me" Automation

- [ ] Run `summarize` (LOW risk) → result appears immediately, no approval prompt
- [ ] Run `homework_outline` (MEDIUM) → preview shown, approve/reject buttons visible
- [ ] Run `email_draft` (HIGH) → MFA gate fires before generation
- [ ] Approve MEDIUM task → status flips to `approved` in Firestore
- [ ] Reject task → result cleared, no content applied
- [ ] Audit log: every task creation logged with `automation_task_created`
- [ ] Style match: output reads like user's writing (subjective ≥ 4/5)

## Gate 4 — Brain Link

- [ ] Create Brain Link without MFA → 403 returned, gate displayed inline
- [ ] Create Brain Link with MFA → snippet generated with style + knowledge sections
- [ ] Snippet pasted into ChatGPT/Claude.ai → AI responds in user's tone and cites content
- [ ] One-click revoke → `isRevoked: true`, Firestore rule blocks any further field changes
- [ ] Expired link: attempt to use expired shareId → correctly flagged
- [ ] Audit log: `brainlink_created` + `brainlink_revoked` both logged

## Gate 5 — Voice Q&A

- [ ] First launch → consent dialog appears before any microphone access
- [ ] Hold button → transcription appears within 500ms of release
- [ ] Transcript → RAG answer → TTS playback → total latency < 3s
- [ ] Latency badge displays actual ms
- [ ] "Disable voice" → consent cleared, microphone access removed
- [ ] No audio data stored in MongoDB GridFS or Firestore (local-only confirmed)

## Gate 6 — Emotional State

- [ ] Late-night + long session → "Calm the Storm" panel appears
- [ ] Stress UI adaptation: orb opacity reduced, suggestion frequency drops
- [ ] Manual override: user dismisses calm prompt → does not reappear within 15 minutes

## Gate 7 — Security

- [ ] Attempt to update `output` field on automationTask → Firestore blocks it
- [ ] Attempt to update anything on auditLog → still blocked (Phase 1 rule intact)
- [ ] Attempt to create Brain Link share without MFA claim → blocked at API level
- [ ] All Phase 1 security gates still pass

---

## Result

| Gate | Status | Notes |
|---|---|---|
| 1 — Adaptive Identity | ⬜ Pending | |
| 2 — Proactivity | ⬜ Pending | |
| 3 — Automation | ⬜ Pending | |
| 4 — Brain Link | ⬜ Pending | |
| 5 — Voice | ⬜ Pending | |
| 6 — Emotional State | ⬜ Pending | |
| 7 — Security | ⬜ Pending | |

**Phase 3 unlocks when: all 7 gates = ✅ Pass**
