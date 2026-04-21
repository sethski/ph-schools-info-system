# Phase 4 Validation Checklist — Launch Readiness

> Final gate before public launch. All criteria must pass.
> All Phase 1–3 gates must remain green.

## Gate 1 — Ambient UI Polish

- [ ] AmbientCanvas renders on dashboard with default "Calm Flow" personality
- [ ] Switching personality in settings → canvas updates within 200ms
- [ ] All 5 personalities visually distinct (not just color changes)
- [ ] Emotional state "stressed" → particle density/speed reduces noticeably
- [ ] DnD mode → canvas opacity drops to near-invisible (≤10% glow)
- [ ] Sync pulse ring appears briefly when syncing between devices
- [ ] `prefers-reduced-motion` → static gradient only, no animation
- [ ] Canvas does not cause layout shift (CLS = 0)
- [ ] FPS stays ≥55 on mid-range Android device during particle animation

## Gate 2 — Advanced Gestures

- [ ] Swipe-to-delegate (right swipe on node) → triggers automation preview
- [ ] Hold-to-reflect (500ms press) → opens node reflection panel
- [ ] Two-finger rotate → graph orientation changes smoothly
- [ ] Double-tap → expands node's related connections
- [ ] Every gesture has working keyboard fallback (D / R / Space / Shift+arrows)
- [ ] Gesture hints visible on first launch (dismissible tooltip)
- [ ] `keyboardNavOnly` mode in accessibility → all gesture-only paths disabled
- [ ] No gesture conflicts with native browser/OS gestures

## Gate 3 — "Simulate My Future"

- [ ] Enter a decision → scenario generated using brain nodes as evidence
- [ ] All three perspectives (Past / Current / Ideal Me) return distinct narratives
- [ ] All four timeframes (6m / 1y / 2y / 5y) produce appropriately scoped responses
- [ ] Response cites knowledge base sources with [N] notation
- [ ] Tone is warm and empowering — never alarmist (manual review of 5 responses)
- [ ] Grounding question appears at end of every scenario
- [ ] Scenarios stored in `users/{uid}/scenarios` in Firestore
- [ ] Audit log: `llm_call` with `feature: 'simulate_future'` logged

## Gate 4 — Voice (Advanced, Phase 4)

- [ ] Phase 3 Web Speech API voice still works as baseline
- [ ] Voice consent gate unchanged and required
- [ ] Captions appear when `captionsEnabled: true` in accessibility prefs
- [ ] Latency displayed in ms on VoiceButton after each response
- [ ] "Disable voice" clears consent + stops all mic access

## Gate 5 — Accessibility Audit

- [ ] Lighthouse accessibility score ≥ 95
- [ ] All color contrast ratios ≥ 4.5:1 (verify with axe DevTools)
- [ ] `[data-high-contrast="true"]` applied to `<html>` when high contrast enabled
- [ ] `[data-large-text="true"]` scales body to 18px without layout breaks
- [ ] `[data-colorblind="deuteranopia"]` overrides region colors to accessible palette
- [ ] Skip link visible and functional on Tab press
- [ ] Screen reader (VoiceOver macOS + TalkBack Android): full dashboard navigation
- [ ] All form fields have visible labels (no placeholder-only)
- [ ] No keyboard trap anywhere in the app
- [ ] `aria-live="polite"` regions announce proactivity alerts

## Gate 6 — Localization

- [ ] Language switcher in settings works: EN → Filipino
- [ ] All 48 translation keys render correctly in Filipino
- [ ] Date/number formats correct for both locales
- [ ] No translation key renders as raw key string (fallback works)
- [ ] Filipino text doesn't break layout on any viewport

## Gate 7 — Performance

- [ ] Lighthouse Performance score ≥ 90 on desktop
- [ ] LCP < 2.5s on simulated 3G (Lighthouse throttling)
- [ ] CLS < 0.1 (no layout shift from ambient canvas or fonts)
- [ ] FID / INP < 200ms
- [ ] Bundle size: web app gzipped < 400KB initial JS
- [ ] AmbientCanvas memory: < 50MB on mobile after 10 minutes
- [ ] No memory leaks: canvas RAF cancelled on unmount (verify in heap snapshot)

## Gate 8 — Analytics & Feedback

- [ ] `session_start` event fires on login
- [ ] `feature_used` fires when Second Me, Brain Link, Voice used
- [ ] `upload_complete` fires on successful ingest
- [ ] AuthenticityRating widget appears after chat responses (after 2nd message)
- [ ] Rating submission → stored in `users/{uid}/ratings` in Firestore
- [ ] Rating data shows ≥4.5/5 average across 10 test interactions (manual)

## Gate 9 — Launch Readiness

- [ ] Zero critical bugs in 48-hour beta test (5+ users)
- [ ] All Phase 1–3 security gates still pass
- [ ] Privacy policy published and linked from app
- [ ] Trust Covenant doc accessible from Settings → Privacy
- [ ] AppStore / PlayStore assets prepared (screenshots, descriptions)
- [ ] Error tracking (Sentry or equivalent) configured and receiving events
- [ ] Firebase project on Blaze plan (pay-as-you-go) for production scale
- [ ] Firestore security rules deployed to production project
- [ ] Domain configured for production (app.mindi.ai or equivalent)

---

## Launch Success Metrics (post-launch targets)

| Metric | Target | Measurement |
|---|---|---|
| Authenticity Score | ≥ 4.5 / 5 | In-app rating widget |
| Trust in Accuracy | ≥ 90% | Post-interaction prompt |
| Time Saved | ≥ 30% faster | Pre/post user survey |
| Sessions / Week | ≥ 3 in Month 1 | Session analytics |
| Emotional Fit | ≥ 4 / 5 | Post-session survey |
| Unauthorized Shares | 0 | Audit log monitoring |

## Phase 4 Result

| Gate | Status | Notes |
|---|---|---|
| 1 — Ambient UI | ⬜ Pending | |
| 2 — Advanced Gestures | ⬜ Pending | |
| 3 — Simulate My Future | ⬜ Pending | |
| 4 — Voice (Advanced) | ⬜ Pending | |
| 5 — Accessibility Audit | ⬜ Pending | |
| 6 — Localization | ⬜ Pending | |
| 7 — Performance | ⬜ Pending | |
| 8 — Analytics & Feedback | ⬜ Pending | |
| 9 — Launch Readiness | ⬜ Pending | |

**🚀 Mindi launches when: all 9 gates = ✅ Pass**
