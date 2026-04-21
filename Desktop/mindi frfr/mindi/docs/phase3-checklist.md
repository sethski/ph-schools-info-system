# Phase 3 Validation Checklist

> All criteria must PASS before Phase 4 begins.
> Phase 1 + Phase 2 gates remain green (re-verify if any shared code was touched).

## Gate 1 — Electron Desktop App

- [ ] `pnpm dev` in `apps/desktop` launches Mindi in a native window
- [ ] Window title bar styled correctly on macOS (hiddenInset) and Windows
- [ ] External links open in system browser, not Electron window
- [ ] File open dialog works: `apps/desktop/src/main.js` → `openFileDialog` IPC
- [ ] `preload.js` bridge: `window.mindiDesktop.isDesktop === true` in renderer
- [ ] `usePlatform().platform === 'desktop'` when running in Electron
- [ ] `electron-builder` produces `.dmg` (macOS) and `.exe` (Windows) without errors
- [ ] App does NOT expose nodeIntegration to renderer (security audit)

## Gate 2 — Capacitor Mobile

- [ ] `npx cap sync ios` completes without errors
- [ ] `npx cap sync android` completes without errors
- [ ] App opens on iOS Simulator — status bar dark, safe areas respected
- [ ] App opens on Android Emulator — splash screen shows, then dashboard
- [ ] `usePlatform().isCapacitor === true` when running in Capacitor
- [ ] Back gesture (iOS swipe-back, Android back button) works correctly
- [ ] Keyboard does not obscure input fields (Keyboard plugin config)
- [ ] App installable from local build on physical device

## Gate 3 — Cross-Platform Sync

- [ ] Sign in on web → create a node → sign in on desktop → node appears within 5s
- [ ] Create node on mobile (offline) → reconnect → node syncs to web and desktop
- [ ] Device heartbeat: `users/{uid}/devices/{deviceId}` updates every 30s
- [ ] `SyncStatusBar` shows "Offline" pill when network disconnected
- [ ] `SyncStatusBar` shows "Syncing…" briefly on reconnect, then "Synced"
- [ ] Offline queue: make 3 changes offline → reconnect → all 3 committed in order

## Gate 4 — Conflict Resolution

- [ ] Edit same node on two devices while both offline → conflict detected on sync
- [ ] Conflict card appears in `SyncStatusBar` with "keep this / keep other" options
- [ ] Choosing "Keep this device's version" resolves conflict, card disappears
- [ ] Audit log: no conflict resolution logged (conflicts are client-side only, no audit needed for this)

## Gate 5 — Brain-to-Brain Collaboration

- [ ] Create collab invite without MFA → 403, gate shown in UI
- [ ] Create collab invite with MFA → invitation sent, pending state shown
- [ ] Second user accepts invite → session status becomes 'active'
- [ ] Sandbox nodes appear in `CollaborationPanel` for both parties
- [ ] Merge sandbox node → appears in user's personal brain nodes
- [ ] Personal region nodes never appear in sandbox (confirmed by checking Firestore)
- [ ] End session → status becomes 'ended', sandbox no longer accessible
- [ ] Attempt to read another user's collab session → `permission-denied`

## Gate 6 — Export

- [ ] Export JSON → downloads `.json` file → valid JSON with `_meta`, `user`, `nodes`
- [ ] Export Markdown → downloads `.md` file → readable, region-organized
- [ ] Encrypted nodes in export show ciphertext, not plaintext
- [ ] Audit log: `export` action logged on every download
- [ ] File size reasonable: 1000 nodes < 5MB JSON

## Gate 7 — Browser Extension

- [ ] Extension loads in Chrome without manifest errors
- [ ] Select text on any page → "Add to Mindi" button appears
- [ ] Click capture button → toast "Added to your brain ✓" → node appears in Firestore
- [ ] Popup "Capture this page" → full page text captured (truncated at 10k chars)
- [ ] Popup "Inject Brain Link" → Brain Link snippet pasted into focused textarea
- [ ] Unauthenticated state → popup shows "Not signed in" + link to Mindi

## Gate 8 — Offline Mode

- [ ] Disconnect network → app shows offline pill
- [ ] Cached nodes visible in graph while offline
- [ ] Chat attempt while offline → graceful error, not crash
- [ ] Service worker registered: `sw.js` visible in DevTools → Application → Service Workers
- [ ] Lighthouse PWA score still ≥ 90
- [ ] `/offline` page loads when navigating to uncached route while offline

## Gate 9 — Security (Phase 3 additions)

- [ ] Attempt to read `collabSessions` as non-party user → `permission-denied`
- [ ] Attempt to update any field on `collabSessions` other than `status` → blocked
- [ ] Attempt to write to `sandboxes/{id}` metadata directly → blocked (Admin SDK only)
- [ ] Electron: `nodeIntegration: false` confirmed in DevTools console
- [ ] Extension: API key never appears in extension source files

---

## Result

| Gate | Status | Notes |
|---|---|---|
| 1 — Electron Desktop | ⬜ Pending | |
| 2 — Capacitor Mobile | ⬜ Pending | |
| 3 — Cross-Platform Sync | ⬜ Pending | |
| 4 — Conflict Resolution | ⬜ Pending | |
| 5 — Collaboration | ⬜ Pending | |
| 6 — Export | ⬜ Pending | |
| 7 — Browser Extension | ⬜ Pending | |
| 8 — Offline Mode | ⬜ Pending | |
| 9 — Security | ⬜ Pending | |

**Phase 4 unlocks when: all 9 gates = ✅ Pass**
