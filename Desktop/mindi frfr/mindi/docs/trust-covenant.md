# Mindi Trust Covenant — Phase 1

> This document governs every decision in Mindi's development.
> Violations are bugs, not features. All contributors must read this.

## 1. User Sovereignty

- All data is owned by the user. Export or delete at any time, instantly.
- Mindi will never train on user data without explicit, informed, revocable opt-in.
- No dark patterns. No guilt on deletion. No retention loops.

## 2. Hard Boundaries (Never Cross)

| Boundary | Enforcement |
|---|---|
| Never submit work without explicit user click | `boundaries.py` blocks `auto_submit` + `send_without_preview` |
| Never impersonate user in real-time conversations | `boundaries.py` blocks `impersonate_user` |
| Never share brain without region-level consent | MFA + region selection required for all shares |
| Never call LLM without PII redaction confirmed | `pii_redacted=True` enforced in `openrouter.py` + `openrouter.ts` |
| Audit log is immutable | Firestore rule: `allow update, delete: if false` on `auditLog` |

## 3. PII Pipeline (Two-Gate)

1. **Client Gate 1** — `trust.ts` `clientPiiScan()`: regex strips emails, PH IDs, phones before ANY network call
2. **Server Gate 2** — `pii_redact.py` Microsoft Presidio + custom PH patterns before ANY OpenRouter call

Both gates must pass. Original content stays local. Only redacted text leaves the device.

## 4. Transparency

Every AI output MUST show:
- Confidence score (0–100%)
- Source citations with file name + paragraph reference
- Style match score (% how well output matched user's fingerprint)

If confidence < 70%: Mindi says so and offers alternatives. No silent guesses.

## 5. Mistake Protocol

1. Apologize sincerely — never defensively
2. Correct instantly
3. Ask "How should I handle this next time?"
4. Log the correction in the audit trail

## 6. Privacy by Default

- Embeddings stored in IndexedDB only — never Firestore, never cloud
- Personal region nodes always encrypted client-side (AES-256-GCM)
- Firebase sees only ciphertext for sensitive nodes
- OpenRouter API key lives in Cloud Functions only — never in client bundle
- PII redacted before every LLM call, every time, no exceptions

## 7. Risk-Based Automation

| Risk | Gate | Examples |
|---|---|---|
| 🟢 LOW | Auto-execute | Summarize, tag, embed |
| 🟡 MEDIUM | Preview required | Draft outline, quiz, email draft |
| 🔴 HIGH | Explicit approve + MFA | Submit homework, send email, share brain |

`boundaries.py` enforces this at the API level. The UI enforces it visually.
Even if the API is bypassed, Firestore security rules block unauthorized writes.

## 8. What Mindi Will Never Do

- Sell, rent, or share user data with advertisers
- Use behavioral data for ad targeting
- Enable surveillance or stalking of third parties
- Auto-submit work without an explicit click
- Respond with fabricated citations
