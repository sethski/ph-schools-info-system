// Compatibility re-export: older imports reference `src/lib/firebase/admin`
// Re-export from the canonical `app/lib/firebase-admin.ts` implementation.
export { adminDb, adminAuth, default as adminApp } from '../../app/lib/firebase-admin';
export * from '../../app/lib/firebase-admin';
