# Mindi Phase 1 — Validation Checklist

> ⚠️ Do NOT proceed to Phase 2 until ALL criteria pass.

## Criteria Table

| Criteria | Test | Pass Condition | Status |
|---|---|---|---|
| Upload → Process | Upload `Bio_Notes.pdf` → wait 15 sec | Graph shows new node; sidebar shows content + style metrics | ⬜ |
| RAG Chat | Ask "What did I write about photosynthesis?" | Answer cites `Bio_Notes.pdf#p3`; style-match ≥85%; confidence ≥70% | ⬜ |
| Style Fingerprint | Compare output to user's past writing | User rates "This sounds like me" ≥4/5 | ⬜ |
| PII Redaction | Upload doc with email/phone → ask AI to summarize | Redacted content sent to OpenRouter; original preserved locally | ⬜ |
| 2FA Enforcement | Try to share brain link without 2FA | Action blocked; prompt to enable 2FA | ⬜ |
| Offline Mode | Disconnect internet → load app → ask question | Cached graph loads; local embeddings answer simple queries | ⬜ |
| Gesture Basics | Drag two nodes together → Pinch to zoom | Graph responds smoothly; no errors in console | ⬜ |
| PWA Install | Install app on mobile/desktop | App launches standalone; offline caching works | ⬜ |
| Folder Structure | Unzip `mindi-phase1.zip` | Exact structure matches spec; no root-level mess | ⬜ |
| Trust Boundaries | Try to auto-submit homework via API | Request blocked by `boundaries.py`; audit log records attempt | ⬜ |

## Detailed Gates

### Gate 1: Upload → Process (15 sec)
- [ ] Upload `Bio_Notes.pdf` via FileUploader
- [ ] IngestJob appears in Firestore → status transitions: queued → chunking → embedding → fingerprinting → complete
- [ ] New graph node appears via Firestore `onSnapshot` (no page refresh)
- [ ] Node sidebar shows: title, region, version, confidence %, style metrics
- [ ] `style_fingerprint` updated in Firestore `users/{uid}` doc

### Gate 2: RAG Chat Quality
- [ ] Ask "What did I write about photosynthesis?"
- [ ] Response includes at least one `[SOURCE N]` citation
- [ ] Citation references `Bio_Notes.pdf` with paragraph index
- [ ] Confidence badge ≥ 70% (green)
- [ ] Style match score ≥ 85% displayed
- [ ] Response reads in user's writing style (subjective: ask user to rate)

### Gate 3: Style Fingerprint
- [ ] Upload 3+ documents in different styles
- [ ] `style_fingerprint.byRegion` has entries for detected regions
- [ ] RAG response adapts tone based on fingerprint
- [ ] User rates response authenticity ≥ 4/5

### Gate 4: PII Redaction
- [ ] Create a doc containing: `user@example.com`, `09171234567`, `123-456-789`
- [ ] Upload doc → check Firestore node content: no raw PII visible
- [ ] Ask AI to summarize → inspect audit log: `piiRedacted: true`
- [ ] Check ML backend logs: Presidio ran on content
- [ ] Original file preserved in MongoDB GridFS unchanged

### Gate 5: 2FA Enforcement
- [ ] Attempt to call `POST /api/boundaries` with `action: share_brain_link` without MFA
- [ ] Response: `allowed: false, reason: MFA_REQUIRED`
- [ ] UI shows 2FA prompt
- [ ] Audit log records `boundary_blocked` event

### Gate 6: Offline Mode
- [ ] Chrome DevTools → Network → Offline
- [ ] Reload app → page loads from service worker cache
- [ ] Graph shows cached nodes from IndexedDB
- [ ] Ask a question → local embedding similarity search returns result
- [ ] "Offline" badge visible in header

### Gate 7: Gesture Basics
- [ ] Drag one node → hover over another node → release → edge created in Firestore
- [ ] Use keyboard fallback: focus node → press `C` → focus target → press `Enter` → edge created
- [ ] Pinch-to-drill (mobile): pinch into node → detail sidebar opens
- [ ] No console errors during drag/pinch operations

### Gate 8: PWA Install
- [ ] Chrome: install button appears in address bar
- [ ] Install → app opens in standalone window (no browser chrome)
- [ ] iOS Safari: Add to Home Screen → launches standalone
- [ ] Lighthouse PWA score ≥ 90

### Gate 9: Folder Structure
- [ ] Unzip `mindi-phase1.zip`
- [ ] Contains exactly `mindi/` root directory
- [ ] All subdirectories match spec: `apps/web/`, `backend/functions/`, `shared/`, `docs/`, `scripts/`
- [ ] No scattered files at root level

### Gate 10: Trust Boundaries
- [ ] Send `POST /api/boundaries` with `{ action: "auto_submit" }` → HTTP 403
- [ ] Send with `{ action: "submit_homework", user_approved: false }` → `allowed: false`
- [ ] Send with `{ action: "submit_homework", user_approved: true, mfa_verified: false }` → `allowed: false, requiresMfa: true`
- [ ] Check Firestore `auditLog`: each blocked attempt logged with `boundary_blocked` action
- [ ] Audit log entries: `allow update, delete: if false` confirmed (try in Firebase Console)

---

## Pre-Phase-2 Sign-off

| Gate | Tester | Date | Pass/Fail | Notes |
|---|---|---|---|---|
| 1 — Upload → Process | | | ⬜ | |
| 2 — RAG Chat | | | ⬜ | |
| 3 — Style Fingerprint | | | ⬜ | |
| 4 — PII Redaction | | | ⬜ | |
| 5 — 2FA Enforcement | | | ⬜ | |
| 6 — Offline Mode | | | ⬜ | |
| 7 — Gesture Basics | | | ⬜ | |
| 8 — PWA Install | | | ⬜ | |
| 9 — Folder Structure | | | ⬜ | |
| 10 — Trust Boundaries | | | ⬜ | |

**Phase 2 unlocks when: all 10 gates = ✅ Pass**
