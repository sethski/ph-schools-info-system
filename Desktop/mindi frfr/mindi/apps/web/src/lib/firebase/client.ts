// Compatibility re-export: older imports reference `src/lib/firebase/client`
// Re-export from the canonical `app/lib/firebase.ts` implementation.
export { auth, db, googleProvider, default as firebaseApp } from '../../app/lib/firebase';
export * from '../../app/lib/firebase';
